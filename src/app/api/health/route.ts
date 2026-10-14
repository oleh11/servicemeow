import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Quick probe to SQLite database
    const userCount = await db.user.count();
    const tableCount = await db.sysDbObject.count();

    return NextResponse.json({
      status: "healthy",
      service: "ServiceMeow Purr-ITSM",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: true,
        users: userCount,
        tables: tableCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
