use super::types::{BoundingBox, CollisionPair, NormalizedHotspot, Point2D};

/// Computes the area of a polygon using the Shoelace formula (Gauss's area formula).
pub fn calculate_polygon_area(points: &[Point2D]) -> f64 {
    let n = points.len();
    if n < 3 {
        return 0.0;
    }
    let mut area = 0.0;
    for i in 0..n {
        let j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    (area.abs() / 2.0).round()
}

/// Computes the minimum bounding box encompassing a list of points.
pub fn compute_bounding_box(points: &[Point2D]) -> Option<BoundingBox> {
    if points.is_empty() {
        return None;
    }
    let mut min_x = f64::MAX;
    let mut max_x = f64::MIN;
    let mut min_y = f64::MAX;
    let mut max_y = f64::MIN;

    for p in points {
        if p.x < min_x { min_x = p.x; }
        if p.x > max_x { max_x = p.x; }
        if p.y < min_y { min_y = p.y; }
        if p.y > max_y { max_y = p.y; }
    }

    Some(BoundingBox {
        x: min_x,
        y: min_y,
        width: (max_x - min_x).max(1.0),
        height: (max_y - min_y).max(1.0),
    })
}

/// Normalizes coordinates into 0.0 - 100.0% relative to a parent viewBox.
pub fn normalize_to_percentage(value: f64, parent_size: f64) -> f64 {
    if parent_size <= 0.0 {
        return 0.0;
    }
    let pct = (value / parent_size) * 100.0;
    (pct * 100.0).round() / 100.0 // 2 decimal precision
}

/// Checks if two axis-aligned bounding boxes overlap with tolerance.
pub fn check_aabb_overlap(a: &NormalizedHotspot, b: &NormalizedHotspot, threshold_pct: f64) -> Option<CollisionPair> {
    let x_overlap = (a.floorplan_x + a.floorplan_width).min(b.floorplan_x + b.floorplan_width)
        - a.floorplan_x.max(b.floorplan_x);
    let y_overlap = (a.floorplan_y + a.floorplan_height).min(b.floorplan_y + b.floorplan_height)
        - a.floorplan_y.max(b.floorplan_y);

    if x_overlap > threshold_pct && y_overlap > threshold_pct {
        let overlap_area = x_overlap * y_overlap;
        Some(CollisionPair {
            space_a: a.space_number.clone(),
            space_b: b.space_number.clone(),
            overlap_area_estimate: (overlap_area * 100.0).round() / 100.0,
        })
    } else {
        None
    }
}

/// Infers room category based on square footage and space naming hints.
pub fn infer_room_category(name: &str, area_sq_ft: f64) -> (String, u32) {
    let lower = name.to_lowercase();
    if lower.contains("meet") || lower.contains("conf") || lower.contains("board") {
        let cap = (area_sq_ft / 25.0).max(4.0).min(50.0) as u32;
        ("MEETING".to_string(), cap)
    } else if lower.contains("exec") || lower.contains("office") || lower.contains("suite") {
        let cap = (area_sq_ft / 100.0).max(1.0).min(6.0) as u32;
        ("OFFICE".to_string(), cap)
    } else if lower.contains("desk") || lower.contains("wkstn") || lower.contains("cube") {
        ("WKSTN".to_string(), 1)
    } else if lower.contains("open") || lower.contains("collab") {
        let cap = (area_sq_ft / 40.0).max(4.0) as u32;
        ("OPENPLAN".to_string(), cap)
    } else if lower.contains("serv") || lower.contains("mdf") || lower.contains("idf") || lower.contains("mech") {
        ("SERV".to_string(), 0)
    } else if lower.contains("vert") || lower.contains("stair") || lower.contains("elev") {
        ("VERT".to_string(), 0)
    } else {
        // Fallback by size
        if area_sq_ft > 600.0 {
            ("OPENPLAN".to_string(), (area_sq_ft / 40.0) as u32)
        } else if area_sq_ft > 200.0 {
            ("MEETING".to_string(), (area_sq_ft / 25.0) as u32)
        } else if area_sq_ft > 80.0 {
            ("OFFICE".to_string(), 1)
        } else {
            ("SUPPORT".to_string(), 1)
        }
    }
}
