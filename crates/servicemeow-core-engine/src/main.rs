use clap::{Parser, Subcommand};
use std::net::SocketAddr;
use std::time::Instant;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use servicemeow_core_engine::cad::decompose_svg;
use servicemeow_core_engine::server::create_router;
use servicemeow_core_engine::telemetry::{BatchIngestRequest, TelemetryEvent, TelemetryPipeline};

#[derive(Parser)]
#[command(name = "servicemeow-core-engine")]
#[command(author = "ServiceMeow Platform Engineering")]
#[command(version = "0.1.0")]
#[command(about = "High-performance Rust micro-engine for ServiceMeow ESM", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the Axum 0.8 high-performance daemon
    Daemon {
        #[arg(short, long, default_value = "127.0.0.1")]
        host: String,

        #[arg(short, long, default_value_t = 8080)]
        port: u16,
    },
    /// Run microsecond performance benchmarks
    Bench {
        #[arg(short, long, default_value_t = 10_000)]
        iterations: usize,
    },
    /// Decompose an SVG file and output normalized hotspot JSON
    Decompose {
        #[arg(short, long)]
        file: String,

        #[arg(short, long, default_value_t = 1.0)]
        scale: f64,
    },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "servicemeow_core_engine=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Daemon { host, port } => {
            let app = create_router();
            let addr: SocketAddr = format!("{}:{}", host, port).parse()?;
            println!("🐾 ServiceMeow Core Rust Engine listening on http://{}", addr);
            println!("   Health Endpoint: http://{}/health", addr);
            println!("   CAD Decompose:   POST http://{}/api/v1/cad/decompose", addr);
            println!("   Telemetry Ingest: POST http://{}/api/v1/telemetry/ingest", addr);

            let listener = tokio::net::TcpListener::bind(addr).await?;
            axum::serve(listener, app).await?;
        }
        Commands::Bench { iterations } => {
            println!("⚡ Running ServiceMeow Core Rust Engine Benchmarks ({} iterations)...", iterations);

            // 1. Benchmark CAD Vector Decomposition
            let sample_svg = r#"<svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
                <rect x="50" y="50" width="200" height="150" id="CONF-101" />
                <text x="100" y="100">CONF-101</text>
                <rect x="300" y="50" width="250" height="200" id="OR-201" />
                <text x="350" y="120">OR-201</text>
                <polygon points="600,50 800,50 850,250 600,250" id="LAB-301" />
                <text x="650" y="100">LAB-301</text>
            </svg>"#;

            let start_cad = Instant::now();
            let mut total_hotspots = 0;
            for _ in 0..iterations {
                let res = decompose_svg(sample_svg, 1.0).unwrap();
                total_hotspots += res.total_spaces_extracted;
            }
            let cad_duration = start_cad.elapsed();
            let cad_per_op = cad_duration.as_micros() as f64 / iterations as f64;
            println!("   [CAD Decompose] {} ops ({} hotspots extracted) in {:?} (~{:.2} µs / op)", iterations, total_hotspots, cad_duration, cad_per_op);
            println!("   [CAD Throughput] {:.0} SVG blueprints decomposed / sec", (iterations as f64) / cad_duration.as_secs_f64());

            // 2. Benchmark Telemetry Ingestion
            let pipeline = TelemetryPipeline::new(100_000);
            let mut events = Vec::with_capacity(1000);
            for i in 0..1000 {
                events.push(TelemetryEvent {
                    id: None,
                    event_type: if i % 10 == 0 { "ci.ping_failure".into() } else { "log.info".into() },
                    source: "bench-generator".into(),
                    severity: if i % 10 == 0 { "critical".into() } else { "info".into() },
                    task_id: Some("INC0010042".into()),
                    ci_id: Some("ci-db-01".into()),
                    payload: serde_json::json!({ "load": 94.2, "iteration": i }),
                    timestamp: chrono::Utc::now(),
                });
            }

            let start_tele = Instant::now();
            let batches = iterations / 100;
            for _ in 0..batches {
                pipeline.ingest_batch(BatchIngestRequest {
                    telemetry_events: events.clone(),
                    audit_events: vec![],
                }).await;
            }
            let tele_duration = start_tele.elapsed();
            let total_events = batches * 1000;
            let tele_throughput = (total_events as f64) / tele_duration.as_secs_f64();
            println!("   [Telemetry Ingest] {} events processed in {:?}", total_events, tele_duration);
            println!("   [Telemetry Throughput] {:.0} events / sec", tele_throughput);
            println!("✅ Benchmarks completed successfully.");
        }
        Commands::Decompose { file, scale } => {
            let content = std::fs::read_to_string(&file)?;
            let result = decompose_svg(&content, scale).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
            println!("{}", serde_json::to_string_pretty(&result)?);
        }
    }

    Ok(())
}
