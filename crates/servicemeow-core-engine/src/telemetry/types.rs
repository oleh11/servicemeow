use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub id: Option<String>,
    pub event_type: String, // e.g. "ci.ping_failure", "log.stacktrace", "monitor.alert", "sla.breach_warning"
    pub source: String,     // e.g. "workflow-daemon", "datadog", "prometheus", "edge-router"
    pub severity: String,   // "info", "warn", "error", "critical"
    pub task_id: Option<String>,
    pub ci_id: Option<String>,
    pub payload: serde_json::Value,
    #[serde(default = "Utc::now")]
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: Option<String>,
    pub table_name: String,
    pub record_id: String,
    pub field_name: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub user_id: Option<String>,
    #[serde(default = "Utc::now")]
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchIngestRequest {
    pub telemetry_events: Vec<TelemetryEvent>,
    #[serde(default)]
    pub audit_events: Vec<AuditEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchIngestResponse {
    pub success: bool,
    pub batch_id: String,
    pub telemetry_count: usize,
    pub audit_count: usize,
    pub duration_microseconds: u128,
    pub throughput_events_per_sec: f64,
    pub critical_anomalies_detected: usize,
    pub sample_anomalies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryStats {
    pub total_ingested_events: u64,
    pub active_anomaly_count: u64,
    pub avg_throughput_per_sec: f64,
    pub uptime_seconds: u64,
}
