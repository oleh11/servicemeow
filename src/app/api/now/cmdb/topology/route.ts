import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cis = await db.configurationItem.findMany({
      include: {
        incidents: {
          where: { task: { state: { in: [1, 2, 3] } } }, // Active incidents
          include: { task: { select: { priority: true, number: true, shortDescription: true } } },
        },
        changes: {
          where: { task: { state: { in: [1, 2] } } },
          include: { task: { select: { priority: true, number: true } } },
        },
      },
    });

    const relations = await db.cIRelation.findMany();

    const nodes = cis.map((ci) => {
      const activeIncidents = ci.incidents.length;
      const maxPriority = ci.incidents.reduce(
        (min, inc) => Math.min(min, inc.task.priority),
        99
      );

      return {
        id: ci.id,
        name: ci.name,
        ciClass: ci.ciClass,
        status: ci.status,
        environment: ci.environment,
        tier: ci.tier,
        ipAddress: ci.ipAddress,
        hostName: ci.hostName,
        owner: ci.owner,
        activeIncidentCount: activeIncidents,
        criticalityHealth:
          activeIncidents > 0
            ? maxPriority === 1
              ? "critical"
              : "warning"
            : "healthy",
      };
    });

    const edges = relations.map((rel) => ({
      id: rel.id,
      source: rel.parentCiId,
      target: rel.childCiId,
      relationType: rel.relationType,
    }));

    return NextResponse.json({ result: { nodes, edges } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
