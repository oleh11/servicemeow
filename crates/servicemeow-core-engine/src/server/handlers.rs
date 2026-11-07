use axum::extract::State;
use axum::http::StatusCode;
use axum::response::Json;
use serde_json::{json, Value};
use std::sync::Arc;
use std::time::Instant;

use crate::cad::{check_aabb_overlap, decompose_svg, CadCollisionCheckRequest, CadCollisionCheckResponse, CadDecomposeRequest, CadDecomposeResponse};
use crate::sandbox::{validate_and_meter_script, ScriptValidateRequest, ScriptValidateResponse};
use crate::telemetry::{BatchIngestRequest, BatchIngestResponse, TelemetryPipeline, TelemetryStats};

#[derive(Clone)]
pub struct AppState {
    pub start_time: Instant,
    pub telemetry_pipeline: Arc<TelemetryPipeline>,
}

pub async fn health_handler(State(state): State<AppState>) -> Json<Value> {
    let uptime = state.start_time.elapsed().as_secs();
    Json(json!({
        "status": "healthy",
        "engine": "servicemeow-core-engine",
        "version": env!("CARGO_PKG_VERSION"),
        "language": "Rust 2024 (stable-x86_64-pc-windows-gnu)",
        "uptime_seconds": uptime,
        "capabilities": [
            "cad_vector_decomposition",
            "spatial_aabb_collision_detection",
            "telemetry_stream_ingestion",
            "script_ast_security_validation"
        ]
    }))
}

pub async fn cad_decompose_handler(
    Json(req): Json<CadDecomposeRequest>,
) -> Result<Json<CadDecomposeResponse>, (StatusCode, Json<Value>)> {
    match decompose_svg(&req.svg_content, req.scale_factor_sq_ft) {
        Ok(resp) => Ok(Json(resp)),
        Err(err) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "CAD_PARSE_FAILED", "message": err })),
        )),
    }
}

pub async fn cad_collision_handler(
    Json(req): Json<CadCollisionCheckRequest>,
) -> Json<CadCollisionCheckResponse> {
    let mut collisions = Vec::new();
    let n = req.hotspots.len();

    for i in 0..n {
        for j in (i + 1)..n {
            if let Some(pair) = check_aabb_overlap(&req.hotspots[i], &req.hotspots[j], 1.0) {
                collisions.push(pair);
            }
        }
    }

    let count = collisions.len();
    Json(CadCollisionCheckResponse {
        has_collisions: count > 0,
        collisions_count: count,
        collision_pairs: collisions,
    })
}

pub async fn telemetry_ingest_handler(
    State(state): State<AppState>,
    Json(req): Json<BatchIngestRequest>,
) -> Json<BatchIngestResponse> {
    let resp = state.telemetry_pipeline.ingest_batch(req).await;
    Json(resp)
}

pub async fn telemetry_stats_handler(
    State(state): State<AppState>,
) -> Json<TelemetryStats> {
    let stats = state.telemetry_pipeline.get_stats();
    Json(stats)
}

pub async fn script_validate_handler(
    Json(req): Json<ScriptValidateRequest>,
) -> Json<ScriptValidateResponse> {
    let resp = validate_and_meter_script(&req);
    Json(resp)
}
