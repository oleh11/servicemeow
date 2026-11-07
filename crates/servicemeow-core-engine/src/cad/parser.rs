use std::time::Instant;
use quick_xml::events::Event;
use quick_xml::reader::Reader;

use super::geometry::{calculate_polygon_area, compute_bounding_box, infer_room_category, normalize_to_percentage};
use super::types::{BoundingBox, CadDecomposeResponse, NormalizedHotspot, Point2D};

pub fn decompose_svg(svg_content: &str, scale_factor: f64) -> Result<CadDecomposeResponse, String> {
    let start_time = Instant::now();
    let mut reader = Reader::from_str(svg_content);
    reader.config_mut().trim_text(true);

    let mut view_box: Option<BoundingBox> = None;
    let mut raw_rects: Vec<(BoundingBox, String, String)> = Vec::new(); // (box, id, class)
    let mut raw_polygons: Vec<(Vec<Point2D>, String, String)> = Vec::new(); // (points, id, class)
    let mut raw_texts: Vec<(Point2D, String)> = Vec::new(); // (coord, text)

    let mut current_text_coord: Option<Point2D> = None;
    let mut in_text_element = false;

    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) | Ok(Event::Empty(ref e)) => {
                let name = e.name();
                match name.as_ref() {
                    b"svg" => {
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"viewBox" || attr.key.as_ref() == b"viewbox" {
                                if let Ok(val) = std::str::from_utf8(&attr.value) {
                                    let parts: Vec<f64> = val
                                        .split(|c: char| c == ' ' || c == ',')
                                        .filter_map(|s| s.parse::<f64>().ok())
                                        .collect();
                                    if parts.len() >= 4 {
                                        view_box = Some(BoundingBox {
                                            x: parts[0],
                                            y: parts[1],
                                            width: parts[2],
                                            height: parts[3],
                                        });
                                    }
                                }
                            }
                        }
                    }
                    b"rect" => {
                        let mut x = 0.0;
                        let mut y = 0.0;
                        let mut w = 0.0;
                        let mut h = 0.0;
                        let mut id = String::new();
                        let mut class_name = String::new();

                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"x" => { if let Ok(s) = std::str::from_utf8(&attr.value) { x = s.parse().unwrap_or(0.0); } }
                                b"y" => { if let Ok(s) = std::str::from_utf8(&attr.value) { y = s.parse().unwrap_or(0.0); } }
                                b"width" => { if let Ok(s) = std::str::from_utf8(&attr.value) { w = s.parse().unwrap_or(0.0); } }
                                b"height" => { if let Ok(s) = std::str::from_utf8(&attr.value) { h = s.parse().unwrap_or(0.0); } }
                                b"id" => { if let Ok(s) = std::str::from_utf8(&attr.value) { id = s.to_string(); } }
                                b"class" => { if let Ok(s) = std::str::from_utf8(&attr.value) { class_name = s.to_string(); } }
                                _ => {}
                            }
                        }

                        // Filter out whole-canvas background rects
                        if w > 10.0 && h > 10.0 {
                            raw_rects.push((BoundingBox { x, y, width: w, height: h }, id, class_name));
                        }
                    }
                    b"polygon" => {
                        let mut points = Vec::new();
                        let mut id = String::new();
                        let mut class_name = String::new();

                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"points" => {
                                    if let Ok(s) = std::str::from_utf8(&attr.value) {
                                        points = parse_polygon_points(s);
                                    }
                                }
                                b"id" => { if let Ok(s) = std::str::from_utf8(&attr.value) { id = s.to_string(); } }
                                b"class" => { if let Ok(s) = std::str::from_utf8(&attr.value) { class_name = s.to_string(); } }
                                _ => {}
                            }
                        }

                        if points.len() >= 3 {
                            raw_polygons.push((points, id, class_name));
                        }
                    }
                    b"text" => {
                        in_text_element = true;
                        let mut tx = 0.0;
                        let mut ty = 0.0;
                        for attr in e.attributes().flatten() {
                            match attr.key.as_ref() {
                                b"x" => { if let Ok(s) = std::str::from_utf8(&attr.value) { tx = s.parse().unwrap_or(0.0); } }
                                b"y" => { if let Ok(s) = std::str::from_utf8(&attr.value) { ty = s.parse().unwrap_or(0.0); } }
                                _ => {}
                            }
                        }
                        current_text_coord = Some(Point2D { x: tx, y: ty });
                    }
                    _ => {}
                }
            }
            Ok(Event::Text(ref e)) => {
                if in_text_element {
                    if let Ok(text) = e.unescape() {
                        let trimmed = text.trim();
                        if !trimmed.is_empty() {
                            if let Some(coord) = current_text_coord.clone() {
                                raw_texts.push((coord, trimmed.to_string()));
                            }
                        }
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                if e.name().as_ref() == b"text" {
                    in_text_element = false;
                    current_text_coord = None;
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("SVG XML parse error: {}", e)),
            _ => {}
        }
        buf.clear();
    }

    // Default view box fallback
    let vb = view_box.unwrap_or(BoundingBox { x: 0.0, y: 0.0, width: 1000.0, height: 800.0 });

    let mut hotspots: Vec<NormalizedHotspot> = Vec::new();
    let mut space_counter = 101;

    // 1. Process Polygons
    for (points, id, _class_name) in raw_polygons {
        if let Some(bbox) = compute_bounding_box(&points) {
            // Ignore boundary container polygon
            if bbox.width >= vb.width * 0.98 && bbox.height >= vb.height * 0.98 {
                continue;
            }

            let area_raw = calculate_polygon_area(&points);
            let area_sq_ft = (area_raw * scale_factor).max(15.0);

            // Match text inside polygon bounding box
            let matched_label = raw_texts.iter().find(|(pt, _)| {
                pt.x >= bbox.x && pt.x <= bbox.x + bbox.width && pt.y >= bbox.y && pt.y <= bbox.y + bbox.height
            });

            let space_number = if let Some((_, text)) = matched_label {
                text.clone()
            } else if !id.is_empty() {
                id.clone()
            } else {
                format!("RM-{}", space_counter)
            };

            let name = if space_number.starts_with("RM-") {
                format!("Space {}", space_number)
            } else {
                format!("Room {}", space_number)
            };

            let (category, capacity) = infer_room_category(&name, area_sq_ft);

            hotspots.push(NormalizedHotspot {
                id: format!("poly-{}", space_counter),
                name,
                space_number,
                room_category: category,
                floorplan_x: normalize_to_percentage(bbox.x - vb.x, vb.width),
                floorplan_y: normalize_to_percentage(bbox.y - vb.y, vb.height),
                floorplan_width: normalize_to_percentage(bbox.width, vb.width),
                floorplan_height: normalize_to_percentage(bbox.height, vb.height),
                area_sq_ft,
                capacity_estimate: capacity,
                polygon_points: points,
            });

            space_counter += 1;
        }
    }

    // 2. Process Rectangles
    for (bbox, id, _class_name) in raw_rects {
        // Skip background or giant floor envelopes
        if bbox.width >= vb.width * 0.95 && bbox.height >= vb.height * 0.95 {
            continue;
        }

        let area_sq_ft = (bbox.width * bbox.height * scale_factor).max(20.0);

        let matched_label = raw_texts.iter().find(|(pt, _)| {
            pt.x >= bbox.x && pt.x <= bbox.x + bbox.width && pt.y >= bbox.y && pt.y <= bbox.y + bbox.height
        });

        let space_number = if let Some((_, text)) = matched_label {
            text.clone()
        } else if !id.is_empty() {
            id.clone()
        } else {
            format!("RM-{}", space_counter)
        };

        let name = if space_number.starts_with("RM-") {
            format!("Office {}", space_number)
        } else {
            format!("Room {}", space_number)
        };

        let (category, capacity) = infer_room_category(&name, area_sq_ft);

        let points = vec![
            Point2D { x: bbox.x, y: bbox.y },
            Point2D { x: bbox.x + bbox.width, y: bbox.y },
            Point2D { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
            Point2D { x: bbox.x, y: bbox.y + bbox.height },
        ];

        hotspots.push(NormalizedHotspot {
            id: format!("rect-{}", space_counter),
            name,
            space_number,
            room_category: category,
            floorplan_x: normalize_to_percentage(bbox.x - vb.x, vb.width),
            floorplan_y: normalize_to_percentage(bbox.y - vb.y, vb.height),
            floorplan_width: normalize_to_percentage(bbox.width, vb.width),
            floorplan_height: normalize_to_percentage(bbox.height, vb.height),
            area_sq_ft,
            capacity_estimate: capacity,
            polygon_points: points,
        });

        space_counter += 1;
    }

    let gross_area: f64 = hotspots.iter().map(|h| h.area_sq_ft).sum();
    let duration = start_time.elapsed().as_micros();

    Ok(CadDecomposeResponse {
        success: true,
        view_box: Some(vb),
        total_spaces_extracted: hotspots.len(),
        gross_area_sq_ft: (gross_area * 100.0).round() / 100.0,
        parse_duration_microseconds: duration,
        hotspots,
    })
}

fn parse_polygon_points(points_str: &str) -> Vec<Point2D> {
    let mut points = Vec::new();
    let tokens: Vec<&str> = points_str
        .split(|c: char| c.is_whitespace() || c == ',')
        .filter(|s| !s.is_empty())
        .collect();

    let mut i = 0;
    while i + 1 < tokens.len() {
        if let (Ok(x), Ok(y)) = (tokens[i].parse::<f64>(), tokens[i + 1].parse::<f64>()) {
            points.push(Point2D { x, y });
        }
        i += 2;
    }
    points
}
