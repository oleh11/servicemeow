pub mod geometry;
pub mod parser;
pub mod types;

pub use geometry::{calculate_polygon_area, check_aabb_overlap, compute_bounding_box, normalize_to_percentage};
pub use parser::decompose_svg;
pub use types::*;
