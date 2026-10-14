import { db } from "../src/lib/db";

async function main() {
  console.log("Seeding ServiceOps Enhancements (Racks, Services, Contracts)...");

  // 1. Seed Datacenter Racks
  const rack1 = await db.cmdbRack.upsert({
    where: { name: "Rack DC-A01" },
    update: {},
    create: {
      name: "Rack DC-A01",
      site: "Austin Datacenter Primary (Room 104)",
      uHeight: 42,
      maxPowerWatts: 5500,
      status: "active",
      notes: "Primary production compute and ingress routing rack.",
    },
  });

  const rack2 = await db.cmdbRack.upsert({
    where: { name: "Rack DC-B02" },
    update: {},
    create: {
      name: "Rack DC-B02",
      site: "Austin Datacenter Primary (Room 104)",
      uHeight: 42,
      maxPowerWatts: 6000,
      status: "active",
      notes: "Secondary disaster recovery and storage replication rack.",
    },
  });

  // Mount CIs to Rack 1
  const vpnCi = await db.configurationItem.findUnique({ where: { name: "GlobalProtect Corporate VPN Gateway" } });
  if (vpnCi) {
    await db.configurationItem.update({
      where: { id: vpnCi.id },
      data: { rackId: rack1.id, rackUnitStart: 41, rackUnitHeight: 1 },
    });
  }

  const webCi = await db.configurationItem.findUnique({ where: { name: "prod-web-ingress-k8s" } });
  if (webCi) {
    await db.configurationItem.update({
      where: { id: webCi.id },
      data: { rackId: rack1.id, rackUnitStart: 38, rackUnitHeight: 2 },
    });
  }

  const redisCi = await db.configurationItem.findUnique({ where: { name: "prod-cache-redis-01" } });
  if (redisCi) {
    await db.configurationItem.update({
      where: { id: redisCi.id },
      data: { rackId: rack1.id, rackUnitStart: 34, rackUnitHeight: 2 },
    });
  }

  const dbCi = await db.configurationItem.findUnique({ where: { name: "prod-db-postgres-primary" } });
  if (dbCi) {
    await db.configurationItem.update({
      where: { id: dbCi.id },
      data: { rackId: rack1.id, rackUnitStart: 28, rackUnitHeight: 4 },
    });
  }

  const authCi = await db.configurationItem.findUnique({ where: { name: "Auth0 Corporate SSO & Identity" } });
  if (authCi) {
    await db.configurationItem.update({
      where: { id: authCi.id },
      data: { rackId: rack1.id, rackUnitStart: 24, rackUnitHeight: 2 },
    });
  }

  console.log(`[PASS] Mounted 5 CIs into 42U rack '${rack1.name}'.`);

  // 2. Seed Services
  const services = [
    {
      name: "Auth0 Identity & Corporate SSO",
      category: "Security & Access",
      status: "operational",
      description: "Enterprise SAML, OAuth2, and multi-factor authentication services.",
      uptimePercent: 99.99,
    },
    {
      name: "Customer E-Commerce Web Platform",
      category: "Customer Applications",
      status: "operational",
      description: "Public employee catalog checkout, cart, and storefront APIs.",
      uptimePercent: 99.95,
    },
    {
      name: "SAP Enterprise ERP & Core Billing",
      category: "Financial Systems",
      status: "operational",
      description: "Automated billing runs, financial ledgers, and invoice generation.",
      uptimePercent: 99.92,
    },
    {
      name: "GlobalProtect Corporate VPN Gateway",
      category: "Network Infrastructure",
      status: "operational",
      description: "Secure remote worker tunnels and split-tunnel ingress gateways.",
      uptimePercent: 99.98,
    },
    {
      name: "PostgreSQL Primary HA Database Cluster",
      category: "Databases & Storage",
      status: "operational",
      description: "Multi-AZ replication cluster with sub-second failover standby.",
      uptimePercent: 99.99,
    },
    {
      name: "Redis In-Memory Session Cache",
      category: "Caching & Acceleration",
      status: "operational",
      description: "Distributed volatile memory cluster for session token state.",
      uptimePercent: 100.0,
    },
  ];

  for (const s of services) {
    await db.cmnService.upsert({
      where: { name: s.name },
      update: s,
      create: s,
    });
  }
  console.log(`[PASS] Seeded ${services.length} CmnService status offerings.`);

  // 3. Seed ITAM Contracts
  const contracts = [
    {
      contractNumber: "CTR-2026-001",
      name: "AWS Enterprise Tier 24x7 Support Agreement",
      vendor: "Amazon Web Services",
      contractType: "service",
      cost: 120000.0,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "active",
      terms: "15-minute TAM response SLA for Critical P1 infrastructure disruptions.",
    },
    {
      contractNumber: "CTR-2026-002",
      name: "CrowdStrike Falcon Complete Managed EDR",
      vendor: "CrowdStrike Inc.",
      contractType: "software_license",
      cost: 48000.0,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-02-28"),
      status: "active",
      terms: "Autonomous endpoint threat hunting and malware containment across 1,500 nodes.",
    },
    {
      contractNumber: "CTR-2026-003",
      name: "Cisco SmartNet 24x7 Core Switching Hardware Care",
      vendor: "Cisco Systems",
      contractType: "maintenance",
      cost: 32500.0,
      startDate: new Date("2025-11-01"),
      endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
      status: "expiring_soon",
      terms: "4-hour on-site chassis and optic replacement for Nexus 9000 core switches.",
    },
    {
      contractNumber: "CTR-2026-004",
      name: "Oracle Enterprise Database EE CPU Licensing",
      vendor: "Oracle Corporation",
      contractType: "software_license",
      cost: 92000.0,
      startDate: new Date("2026-02-15"),
      endDate: new Date("2027-02-14"),
      status: "active",
      terms: "Unlimited deployment on 16 vCPU DB host clusters with Partitioning Option.",
    },
    {
      contractNumber: "CTR-2025-099",
      name: "Legacy Juniper SRX Edge Router Lease",
      vendor: "Juniper Networks",
      contractType: "hardware_lease",
      cost: 14000.0,
      startDate: new Date("2024-09-01"),
      endDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      status: "expired",
      terms: "Decommissioned hardware lease awaiting vendor RMA collection.",
    },
  ];

  for (const c of contracts) {
    await db.astContract.upsert({
      where: { contractNumber: c.contractNumber },
      update: c,
      create: c,
    });
  }
  console.log(`[PASS] Seeded ${contracts.length} AstContract ITAM agreements.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
