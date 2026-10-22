use std::time::Instant;
use super::types::{ScriptValidateRequest, ScriptValidateResponse, SecurityFinding};

pub fn validate_and_meter_script(request: &ScriptValidateRequest) -> ScriptValidateResponse {
    let start = Instant::now();
    let mut findings = Vec::new();
    let lines: Vec<&str> = request.script.lines().collect();

    let mut loop_count = 0u32;
    let mut func_count = 0u32;

    for (idx, line) in lines.iter().enumerate() {
        let line_num = idx + 1;
        let trimmed = line.trim();

        // 1. Check for Prototype Pollution Attempts
        if trimmed.contains("__proto__") {
            findings.push(SecurityFinding {
                rule: "NO_PROTO_MUTATION".to_string(),
                severity: "critical".to_string(),
                description: "Direct mutation of __proto__ is forbidden to prevent prototype pollution.".to_string(),
                line_number: Some(line_num),
            });
        }
        if trimmed.contains("constructor") && (trimmed.contains("prototype") || trimmed.contains("assign")) {
            findings.push(SecurityFinding {
                rule: "NO_CONSTRUCTOR_POLLUTION".to_string(),
                severity: "critical".to_string(),
                description: "Direct access to constructor.prototype is restricted.".to_string(),
                line_number: Some(line_num),
            });
        }

        // 2. Check for Process / Host Escape Vectors
        if trimmed.contains("process.env") || trimmed.contains("process.exit") || trimmed.contains("process.binding") {
            findings.push(SecurityFinding {
                rule: "NO_HOST_PROCESS".to_string(),
                severity: "critical".to_string(),
                description: "Direct access to host Node.js process APIs is forbidden.".to_string(),
                line_number: Some(line_num),
            });
        }
        if trimmed.contains("require(") || trimmed.contains("import(") {
            findings.push(SecurityFinding {
                rule: "NO_DYNAMIC_IMPORT".to_string(),
                severity: "high".to_string(),
                description: "Dynamic module imports are not permitted inside script includes.".to_string(),
                line_number: Some(line_num),
            });
        }

        // 3. Check for Eval
        if trimmed.contains("eval(") || trimmed.contains("Function(") {
            findings.push(SecurityFinding {
                rule: "NO_EVAL".to_string(),
                severity: "critical".to_string(),
                description: "Arbitrary string-to-code compilation (eval/Function) is forbidden.".to_string(),
                line_number: Some(line_num),
            });
        }

        // Complexity tracking
        if trimmed.starts_with("for ") || trimmed.starts_with("while ") || trimmed.contains(".forEach") || trimmed.contains(".map") {
            loop_count += 1;
        }
        if trimmed.contains("function") || trimmed.contains("=>") {
            func_count += 1;
        }
    }

    let char_count = request.script.len() as u64;
    let estimated_fuel = 1000 + (char_count * 2) + ((loop_count as u64) * 10000) + ((func_count as u64) * 500);
    let ast_complexity = (lines.len() as u32) + (loop_count * 5) + (func_count * 3);

    let is_safe = !findings.iter().any(|f| f.severity == "critical");

    let sanitized_script = if is_safe {
        Some(request.script.clone())
    } else {
        None
    };

    let duration = start.elapsed().as_micros();

    ScriptValidateResponse {
        is_safe,
        estimated_fuel,
        ast_complexity_score: ast_complexity,
        validation_duration_us: duration,
        security_findings: findings,
        sanitized_script,
    }
}
