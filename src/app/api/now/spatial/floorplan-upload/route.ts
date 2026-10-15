import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const roles = session.roles || (session.primaryRole ? [session.primaryRole] : []);
    const isAuthorized = session.isAdmin || roles.includes("workplace_admin");
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Workplace Administrator privileges required to upload CAD drawings" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let floorId = "";
    let fileUrl = "";
    let fileType = "svg";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      floorId = body.floorId || body.floor_id;
      const fileData = body.fileData || body.file_data; // base64 or raw SVG content
      const fileName = body.fileName || body.file_name || `floorplan_${Date.now()}.svg`;
      const directUrl = body.url || body.fileUrl;

      if (!floorId) {
        return NextResponse.json({ error: "floorId is required" }, { status: 400 });
      }

      if (directUrl) {
        fileUrl = directUrl;
        fileType = directUrl.endsWith(".svg") ? "svg" : "image";
      } else if (fileData) {
        // Sanitize filename
        const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const floorplansDir = path.resolve(process.cwd(), "public/floorplans");
        if (!fs.existsSync(floorplansDir)) {
          fs.mkdirSync(floorplansDir, { recursive: true });
        }

        const filePath = path.join(floorplansDir, safeName);
        if (fileData.startsWith("data:")) {
          const base64Content = fileData.split(",")[1];
          fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
        } else {
          // Plain text / SVG content
          fs.writeFileSync(filePath, fileData, "utf8");
        }
        fileUrl = `/floorplans/${safeName}`;
        fileType = safeName.endsWith(".svg") ? "svg" : "image";
      } else {
        return NextResponse.json({ error: "Either directUrl or fileData is required" }, { status: 400 });
      }
    } else {
      // Multipart form data
      const formData = await request.formData();
      floorId = (formData.get("floorId") as string) || (formData.get("floor_id") as string);
      const file = formData.get("file") as File | null;
      const directUrl = formData.get("url") as string | null;

      if (!floorId) {
        return NextResponse.json({ error: "floorId is required" }, { status: 400 });
      }

      if (directUrl) {
        fileUrl = directUrl;
        fileType = directUrl.endsWith(".svg") ? "svg" : "image";
      } else if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
        const floorplansDir = path.resolve(process.cwd(), "public/floorplans");
        if (!fs.existsSync(floorplansDir)) {
          fs.mkdirSync(floorplansDir, { recursive: true });
        }
        const filePath = path.join(floorplansDir, safeName);
        fs.writeFileSync(filePath, buffer);
        fileUrl = `/floorplans/${safeName}`;
        fileType = safeName.endsWith(".svg") ? "svg" : "image";
      } else {
        return NextResponse.json({ error: "No file or URL provided" }, { status: 400 });
      }
    }

    // Update the Floor record
    const updateData =
      fileType === "svg"
        ? { floorplanSvgUrl: fileUrl }
        : { floorplanImageUrl: fileUrl };

    const updatedFloor = await db.cmnFloor.update({
      where: { id: floorId },
      data: updateData,
      include: {
        building: true,
        spaces: true,
      },
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      fileType,
      floor: updatedFloor,
    });
  } catch (err: any) {
    console.error("Failed to upload CAD drawing:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process floorplan upload" },
      { status: 500 }
    );
  }
}
