use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptValidateRequest {
    pub script: String,
    #[serde(default = "default_max_fuel")]
    pub fuel_limit: u64,
}

fn default_max_fuel() -> u64 {
    1_000_000
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityFinding {
    pub rule: String,
    pub severity: String, // "critical", "high", "medium", "low"
    pub description: String,
    pub line_number: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptValidateResponse {
    pub is_safe: bool,
    pub estimated_fuel: u64,
    pub ast_complexity_score: u32,
    pub validation_duration_us: u128,
    pub security_findings: Vec<SecurityFinding>,
    pub sanitized_script: Option<String>,
}
