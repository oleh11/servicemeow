use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

use servicemeow_core_engine::cad::{calculate_polygon_area, check_aabb_overlap, decompose_svg, Point2D};
use servicemeow_core_engine::sandbox::validate_and_meter_script;
use servicemeow_core_engine::sandbox::ScriptValidateRequest;
use servicemeow_core_engine::server::create_router;
use servicemeow_core_engine::telemetry::{BatchIngestRequest, TelemetryEvent, TelemetryPipeline};

#[test]
fn test_shoelace_polygon_area() {
    // 100x100 square
    let square = vec![
        Point2D { x: 0.0, y: 0.0 },
        Point2D { x: 100.0, y: 0.0 },
        Point2D { x: 100.0, y: 100.0 },
        Point2D { x: 0.0, y: 100.0 },
    ];
    let area = calculate_polygon_area(&square);
    assert_eq!(area, 10000.0);

    // Right-angle triangle: base 100, height 50 -> area 2500
    let triangle = vec![
        Point2D { x: 0.0, y: 0.0 },
        Point2D { x: 100.0, y: 0.0 },
        Point2D { x: 0.0, y: 50.0 },
    ];
    let tri_area = calculate_polygon_area(&triangle);
    assert_eq!(tri_area, 2500.0);
}

#[test]
fn test_svg_cad_decomposition() {
    let svg = r#"<svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
        <rect x="50" y="50" width="200" height="150" id="OR-302" />
        <text x="70" y="80">OR-302</text>
        <polygon points="400,100 600,100 650,300 400,300" id="CONF-401" />
        <text x="450" y="150">CONF-401</text>
    </svg>"#;

    let res = decompose_svg(svg, 1.0).expect("decomposition should succeed");
    assert!(res.success);
    assert_eq!(res.total_spaces_extracted, 2);
    assert!(res.gross_area_sq_ft > 0.0);

    let or302 = res.hotspots.iter().find(|h| h.space_number == "OR-302").expect("OR-302 should exist");
    assert_eq!(or302.floorplan_x, 5.0); // 50 / 1000 = 5%
    assert_eq!(or302.floorplan_y, 6.25); // 50 / 800 = 6.25%
    assert_eq!(or302.floorplan_width, 20.0); // 200 / 1000 = 20%
    assert_eq!(or302.floorplan_height, 18.75); // 150 / 800 = 18.75%
}

#[test]
fn test_cad_aabb_collision_detection() {
    let svg = r#"<svg viewBox="0 0 1000 800">
        <rect x="100" y="100" width="200" height="200" id="ROOM-A" />
        <rect x="150" y="150" width="200" height="200" id="ROOM-B" />
        <rect x="600" y="100" width="100" height="100" id="ROOM-C" />
    </svg>"#;

    let res = decompose_svg(svg, 1.0).unwrap();
    let room_a = res.hotspots.iter().find(|h| h.space_number == "ROOM-A").unwrap();
    let room_b = res.hotspots.iter().find(|h| h.space_number == "ROOM-B").unwrap();
    let room_c = res.hotspots.iter().find(|h| h.space_number == "ROOM-C").unwrap();

    let collision_ab = check_aabb_overlap(room_a, room_b, 0.5);
    assert!(collision_ab.is_some());
    let pair = collision_ab.unwrap();
    assert_eq!(pair.space_a, "ROOM-A");
    assert_eq!(pair.space_b, "ROOM-B");

    let collision_ac = check_aabb_overlap(room_a, room_c, 0.5);
    assert!(collision_ac.is_none());
}

#[tokio::test]
async fn test_telemetry_pipeline_batch_ingest() {
    let pipeline = TelemetryPipeline::new(1000);
    let events = vec![
        TelemetryEvent {
            id: None,
            event_type: "monitor.cpu_load".into(),
            source: "node-agent".into(),
            severity: "info".into(),
            task_id: None,
            ci_id: Some("srv-01".into()),
            payload: json!({ "usage_pct": 45.2 }),
            timestamp: chrono::Utc::now(),
        },
        TelemetryEvent {
            id: None,
            event_type: "ci.ping_failure".into(),
            source: "blackbox-probe".into(),
            severity: "critical".into(),
            task_id: Some("INC0010042".into()),
            ci_id: Some("gw-core-01".into()),
            payload: json!({ "packet_loss": 100 }),
            timestamp: chrono::Utc::now(),
        },
    ];

    let resp = pipeline.ingest_batch(BatchIngestRequest {
        telemetry_events: events,
        audit_events: vec![],
    }).await;

    assert!(resp.success);
    assert_eq!(resp.telemetry_count, 2);
    assert_eq!(resp.critical_anomalies_detected, 1);
    assert!(!resp.sample_anomalies.is_empty());

    let stats = pipeline.get_stats();
    assert_eq!(stats.total_ingested_events, 2);
    assert_eq!(stats.active_anomaly_count, 1);
}

#[test]
fn test_script_sandbox_security_validator() {
    // 1. Malicious prototype pollution attack
    let malicious = r#"
        const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
        Object.assign({}, payload);
    "#;
    let res_malicious = validate_and_meter_script(&ScriptValidateRequest {
        script: malicious.into(),
        fuel_limit: 100_000,
    });
    assert!(!res_malicious.is_safe);
    assert!(res_malicious.security_findings.iter().any(|f| f.rule == "NO_PROTO_MUTATION"));

    // 2. Safe calculation script
    let safe = r#"
        function calculateSlaBreach(priority, elapsedMinutes) {
            if (priority === 1 && elapsedMinutes > 60) return true;
            return false;
        }
    "#;
    let res_safe = validate_and_meter_script(&ScriptValidateRequest {
        script: safe.into(),
        fuel_limit: 100_000,
    });
    assert!(res_safe.is_safe);
    assert!(res_safe.security_findings.is_empty());
    assert!(res_safe.estimated_fuel > 0);
}

#[tokio::test]
async fn test_axum_rest_health_endpoint() {
    let app = create_router();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_json: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(body_json["status"], "healthy");
    assert_eq!(body_json["engine"], "servicemeow-core-engine");
}
