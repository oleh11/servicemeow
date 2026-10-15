import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        tickets: [],
        catalog: [],
        knowledge: [],
        cmdb: [],
        spaces: [],
      });
    }

    // Inspect caller persona to strictly enforce Rule 1 (Persona Segregation)
    const session = await getServerSession(req);
    const isEmployee = session?.user.role === "employee";
    const employeeUserId = session?.user.id;

    // Task conditions based on persona
    const taskWhere: any = {
      OR: [
        { number: { contains: query } },
        { shortDescription: { contains: query } },
        { description: { contains: query } },
      ],
    };

    if (isEmployee && employeeUserId) {
      taskWhere.AND = [
        {
          OR: [
            { openedById: employeeUserId },
            { incident: { callerId: employeeUserId } },
          ],
        },
      ];
    }

    // Parallel multi-domain search across ITIL tasks, catalog, knowledge base, CMDB CIs, and spaces
    const [tasks, catalogItems, articles, cis, spaces] = await Promise.all([
      db.task.findMany({
        where: taskWhere,
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          number: true,
          shortDescription: true,
          sysClassName: true,
          priority: true,
          state: true,
          updatedAt: true,
        },
      }),

      db.catalogItem.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: query } },
            { shortDescription: { contains: query } },
            { category: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          shortDescription: true,
          category: true,
          price: true,
          icon: true,
        },
      }),

      db.knowledgeArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query } },
            { category: { contains: query } },
            { content: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          number: true,
          title: true,
          category: true,
          views: true,
        },
      }),

      !isEmployee
        ? db.configurationItem.findMany({
            where: {
              OR: [
                { name: { contains: query } },
                { ciClass: { contains: query } },
                { hostName: { contains: query } },
                { ipAddress: { contains: query } },
              ],
            },
            take: 5,
            select: {
              id: true,
              name: true,
              ciClass: true,
              status: true,
              tier: true,
            },
          })
        : Promise.resolve([]),

      db.cmnSpace.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { spaceNumber: { contains: query } },
            { spaceType: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          spaceNumber: true,
          spaceType: true,
          status: true,
          capacity: true,
        },
      }),
    ]);

    // Prioritize ticket number prefix/exact matches over accidental body text matches
    const qLower = query.toLowerCase();
    const rankedTasks = [...tasks].sort((a, b) => {
      const aNum = (a.number || "").toLowerCase();
      const bNum = (b.number || "").toLowerCase();
      const aStarts = aNum.startsWith(qLower);
      const bStarts = bNum.startsWith(qLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      const aContains = aNum.includes(qLower);
      const bContains = bNum.includes(qLower);
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      return 0;
    }).slice(0, 6);

    return NextResponse.json({
      tickets: rankedTasks,
      catalog: catalogItems,
      knowledge: articles,
      cmdb: cis,
      spaces,
    });
  } catch (error) {
    console.error("Search API failed:", error);
    return NextResponse.json(
      { error: "Failed to execute search query" },
      { status: 500 }
    );
  }
}
