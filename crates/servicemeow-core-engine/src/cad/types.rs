use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Point2D {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BoundingBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NormalizedHotspot {
    pub id: String,
    pub name: String,
    pub space_number: String,
    pub room_category: String,
    pub floorplan_x: f64,      // 0.0 - 100.0%
    pub floorplan_y: f64,      // 0.0 - 100.0%
    pub floorplan_width: f64,  // 0.0 - 100.0%
    pub floorplan_height: f64, // 0.0 - 100.0%
    pub area_sq_ft: f64,
    pub capacity_estimate: u32,
    pub polygon_points: Vec<Point2D>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CadDecomposeRequest {
    pub svg_content: String,
    #[serde(default = "default_scale")]
    pub scale_factor_sq_ft: f64, // square feet per viewBox square unit
}

fn default_scale() -> f64 {
    1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CadDecomposeResponse {
    pub success: bool,
    pub view_box: Option<BoundingBox>,
    pub total_spaces_extracted: usize,
    pub gross_area_sq_ft: f64,
    pub parse_duration_microseconds: u128,
    pub hotspots: Vec<NormalizedHotspot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CadCollisionCheckRequest {
    pub hotspots: Vec<NormalizedHotspot>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CollisionPair {
    pub space_a: String,
    pub space_b: String,
    pub overlap_area_estimate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CadCollisionCheckResponse {
    pub has_collisions: bool,
    pub collisions_count: usize,
    pub collision_pairs: Vec<CollisionPair>,
}
