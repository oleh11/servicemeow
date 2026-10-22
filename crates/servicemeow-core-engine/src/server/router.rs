use axum::routing::{get, post};
use axum::Router;
use std::sync::Arc;
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use super::handlers::{
    cad_collision_handler, cad_decompose_handler, health_handler, script_validate_handler,
    telemetry_ingest_handler, telemetry_stats_handler, AppState,
};
use crate::telemetry::TelemetryPipeline;

pub fn create_router() -> Router {
    let state = AppState {
        start_time: Instant::now(),
        telemetry_pipeline: Arc::new(TelemetryPipeline::new(50_000)),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health_handler))
        .route("/api/v1/cad/decompose", post(cad_decompose_handler))
        .route("/api/v1/cad/collision-check", post(cad_collision_handler))
        .route("/api/v1/telemetry/ingest", post(telemetry_ingest_handler))
        .route("/api/v1/telemetry/stats", get(telemetry_stats_handler))
        .route("/api/v1/script/validate", post(script_validate_handler))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
