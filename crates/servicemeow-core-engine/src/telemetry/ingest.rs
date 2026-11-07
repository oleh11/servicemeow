use std::collections::VecDeque;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use uuid::Uuid;

use super::types::{AuditEvent, BatchIngestRequest, BatchIngestResponse, TelemetryEvent, TelemetryStats};

pub struct TelemetryPipeline {
    recent_events: Arc<RwLock<VecDeque<TelemetryEvent>>>,
    recent_audits: Arc<RwLock<VecDeque<AuditEvent>>>,
    total_ingested: AtomicU64,
    critical_anomalies: AtomicU64,
    start_time: Instant,
    max_capacity: usize,
}

impl TelemetryPipeline {
    pub fn new(max_capacity: usize) -> Self {
        Self {
            recent_events: Arc::new(RwLock::new(VecDeque::with_capacity(max_capacity))),
            recent_audits: Arc::new(RwLock::new(VecDeque::with_capacity(max_capacity))),
            total_ingested: AtomicU64::new(0),
            critical_anomalies: AtomicU64::new(0),
            start_time: Instant::now(),
            max_capacity,
        }
    }

    pub async fn ingest_batch(&self, request: BatchIngestRequest) -> BatchIngestResponse {
        let start = Instant::now();
        let batch_id = Uuid::new_v4().to_string();

        let tele_len = request.telemetry_events.len();
        let audit_len = request.audit_events.len();
        let total_items = tele_len + audit_len;

        let mut sample_anomalies = Vec::new();
        let mut anomaly_count = 0usize;

        // 1. Process Telemetry Events
        {
            let mut buffer = self.recent_events.write().await;
            for mut event in request.telemetry_events {
                // Ensure ID
                if event.id.is_none() {
                    event.id = Some(Uuid::new_v4().to_string());
                }

                // Detect anomalies & critical events
                let is_critical = event.severity == "critical" 
                    || event.event_type.contains("panic") 
                    || event.event_type.contains("deadlock")
                    || event.event_type.contains("ping_failure");

                if is_critical {
                    anomaly_count += 1;
                    if sample_anomalies.len() < 5 {
                        sample_anomalies.push(format!(
                            "[{}] {} from {}: {:?}",
                            event.severity.to_uppercase(),
                            event.event_type,
                            event.source,
                            event.payload
                        ));
                    }
                }

                if buffer.len() >= self.max_capacity {
                    buffer.pop_front();
                }
                buffer.push_back(event);
            }
        }

        // 2. Process Audit Events
        {
            let mut buffer = self.recent_audits.write().await;
            for mut audit in request.audit_events {
                if audit.id.is_none() {
                    audit.id = Some(Uuid::new_v4().to_string());
                }
                if buffer.len() >= self.max_capacity {
                    buffer.pop_front();
                }
                buffer.push_back(audit);
            }
        }

        self.total_ingested.fetch_add(total_items as u64, Ordering::Relaxed);
        self.critical_anomalies.fetch_add(anomaly_count as u64, Ordering::Relaxed);

        let elapsed = start.elapsed().as_micros();
        let duration_secs = (elapsed as f64) / 1_000_000.0;
        let throughput = if duration_secs > 0.0 {
            (total_items as f64) / duration_secs
        } else {
            total_items as f64 * 1_000_000.0
        };

        BatchIngestResponse {
            success: true,
            batch_id,
            telemetry_count: tele_len,
            audit_count: audit_len,
            duration_microseconds: elapsed,
            throughput_events_per_sec: (throughput * 100.0).round() / 100.0,
            critical_anomalies_detected: anomaly_count,
            sample_anomalies,
        }
    }

    pub fn get_stats(&self) -> TelemetryStats {
        let total = self.total_ingested.load(Ordering::Relaxed);
        let anomalies = self.critical_anomalies.load(Ordering::Relaxed);
        let uptime = self.start_time.elapsed().as_secs();
        let avg_throughput = if uptime > 0 {
            (total as f64) / (uptime as f64)
        } else {
            total as f64
        };

        TelemetryStats {
            total_ingested_events: total,
            active_anomaly_count: anomalies,
            avg_throughput_per_sec: (avg_throughput * 100.0).round() / 100.0,
            uptime_seconds: uptime,
        }
    }
}
