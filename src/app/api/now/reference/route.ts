import { NextRequest, NextResponse } from "next/server";
import {
  getDynamicReferenceCandidates,
  resolveDotWalk,
  resolveReference,
} from "@/lib/reference-resolver";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Check if dot-walk evaluation requested
    const dotWalkPath = searchParams.get("sysparm_dot_walk") || searchParams.get("dot_walk");
    const rootTable = searchParams.get("sysparm_root_table") || searchParams.get("table") || "incident";
    const recordId = searchParams.get("sysparm_record_id") || searchParams.get("record_id");

    if (dotWalkPath && recordId) {
      const result = await resolveDotWalk(rootTable, recordId, dotWalkPath);
      return NextResponse.json({ result });
    }

    // Direct reference single lookup
    const singleLookupId = searchParams.get("sysparm_ref_id") || searchParams.get("ref_id");
    const targetTable = searchParams.get("table") || searchParams.get("sysparm_table") || "sys_user";

    if (singleLookupId) {
      const resolved = await resolveReference(targetTable, singleLookupId);
      return NextResponse.json({ result: resolved });
    }

    // Reference candidates with dynamic qualifiers and search
    const search = searchParams.get("search") || searchParams.get("sysparm_search") || "";
    const dependentField = searchParams.get("dependent_field") || searchParams.get("sysparm_dependent_field") || undefined;
    const dependentValue = searchParams.get("dependent_value") || searchParams.get("sysparm_dependent_value") || undefined;
    const page = parseInt(searchParams.get("page") || searchParams.get("sysparm_page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || searchParams.get("sysparm_limit") || "20", 10);

    const candidates = await getDynamicReferenceCandidates(targetTable, {
      search,
      dependentField,
      dependentValue,
      page,
      limit,
    });

    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error("Reference API error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve reference" }, { status: 500 });
  }
}
