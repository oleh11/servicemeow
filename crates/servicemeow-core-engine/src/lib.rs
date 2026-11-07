pub mod cad;
pub mod sandbox;
pub mod server;
pub mod telemetry;

// Clean explicit re-exports
pub use cad::{
    calculate_polygon_area, check_aabb_overlap, compute_bounding_box, decompose_svg,
    normalize_to_percentage, BoundingBox, CadCollisionCheckRequest, CadCollisionCheckResponse,
    CadDecomposeRequest, CadDecomposeResponse, CollisionPair, NormalizedHotspot, Point2D,
};
pub use sandbox::{
    validate_and_meter_script, ScriptValidateRequest, ScriptValidateResponse, SecurityFinding,
};
pub use server::{create_router, AppState};
pub use telemetry::{
    AuditEvent, BatchIngestRequest, BatchIngestResponse, TelemetryEvent, TelemetryPipeline,
    TelemetryStats,
};
