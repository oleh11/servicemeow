import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTableList, getTableSchema, addCustomField } from "@/lib/dictionary";

export async function GET(request: NextRequest) {
  try {
    const table = request.nextUrl.searchParams.get("table");
    if (table) {
      const schema = await getTableSchema(table);
      return NextResponse.json({ result: schema });
    }

    const tables = await getTableList();
    return NextResponse.json({ result: tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newField = await addCustomField(body);
    return NextResponse.json({ result: newField }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
