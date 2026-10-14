import { db } from "./db";
import { calculatePriority } from "./sla";
import { getNextNumber } from "./numbering";

export interface CsvParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Robust RFC 4180 CSV parser supporting quoted strings with commas, escaped quotes, and newlines
 */
export function parseCsv(csvText: string): CsvParsedData {
  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let isFieldQuoted = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < csvText.length && csvText[i + 1] === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        isFieldQuoted = true;
      } else if (char === ",") {
        currentRow.push(isFieldQuoted ? currentField : currentField.trim());
        currentField = "";
        isFieldQuoted = false;
      } else if (char === "\r" || char === "\n") {
        if (char === "\r" && i + 1 < csvText.length && csvText[i + 1] === "\n") {
          i++;
        }
        currentRow.push(isFieldQuoted ? currentField : currentField.trim());
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
          rawRows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        isFieldQuoted = false;
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & row if remaining
  if (currentField.length > 0 || isFieldQuoted || currentRow.length > 0) {
    currentRow.push(isFieldQuoted ? currentField : currentField.trim());
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rawRows[0].map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const rowVals = rawRows[r];
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = rowVals[idx] !== undefined ? rowVals[idx] : "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export interface CreateImportSetParams {
  targetTable: string;
  csvContent: string;
  name?: string;
}

export async function createImportSet({
  targetTable,
  csvContent,
  name,
}: CreateImportSetParams) {
  const parsed = parseCsv(csvContent);
  const count = await db.sysImportSet.count();
  const number = `ISET${String(count + 1001).padStart(7, "0")}`;

  const importSet = await db.sysImportSet.create({
    data: {
      number,
      tableName: `u_imp_${targetTable}`,
      targetTable,
      state: "loaded",
      rowsCount: parsed.rows.length,
      rows: {
        create: parsed.rows.map((row, idx) => ({
          rowNumber: idx + 1,
          status: "pending",
          rawDataJson: JSON.stringify(row),
        })),
      },
    },
    include: {
      rows: true,
    },
  });

  return { importSet, headers: parsed.headers };
}

export interface TransformMapping {
  sourceField: string;
  targetField: string;
  coalesce?: boolean;
}

export interface ExecuteTransformParams {
  importSetId: string;
  transformMapName?: string;
  mappings: TransformMapping[];
}

export async function executeTransform({
  importSetId,
  transformMapName,
  mappings,
}: ExecuteTransformParams) {
  const importSet = await db.sysImportSet.findUnique({
    where: { id: importSetId },
    include: { rows: { orderBy: { rowNumber: "asc" } } },
  });

  if (!importSet) {
    throw new Error(`Import Set ${importSetId} not found`);
  }

  // Create or record transform map
  const transformMap = await db.sysTransformMap.create({
    data: {
      name: transformMapName || `${importSet.targetTable} Transform Map`,
      sourceTable: importSet.tableName,
      targetTable: importSet.targetTable,
      importSetId: importSet.id,
      entries: {
        create: mappings.map((m) => ({
          sourceField: m.sourceField,
          targetField: m.targetField,
          coalesce: !!m.coalesce,
        })),
      },
    },
  });

  const coalesceMappings = mappings.filter((m) => m.coalesce);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const row of importSet.rows) {
    try {
      const rawData = JSON.parse(row.rawDataJson);
      const mappedRecord: Record<string, any> = {};

      for (const map of mappings) {
        if (rawData[map.sourceField] !== undefined && rawData[map.sourceField] !== "") {
          mappedRecord[map.targetField] = rawData[map.sourceField];
        }
      }

      const targetTable = importSet.targetTable;

      if (targetTable === "incident" || targetTable === "task") {
        let existingTask: any = null;

        // Check coalesce match
        if (coalesceMappings.length > 0) {
          const whereClause: any = targetTable === "incident" ? { sysClassName: "incident" } : {};
          for (const c of coalesceMappings) {
            const val = mappedRecord[c.targetField];
            if (val !== undefined && val !== "") {
              if (c.targetField === "id" || c.targetField === "sys_id") whereClause.id = val;
              else if (c.targetField === "number") whereClause.number = val;
              else if (c.targetField === "short_description" || c.targetField === "shortDescription") {
                whereClause.shortDescription = val;
              }
            }
          }
          if (Object.keys(whereClause).length > (targetTable === "incident" ? 1 : 0)) {
            existingTask = await db.task.findFirst({ where: whereClause });
          }
        }

        if (existingTask) {
          // Update existing
          const updateData: any = {};
          if (mappedRecord.short_description || mappedRecord.shortDescription) {
            updateData.shortDescription = mappedRecord.short_description || mappedRecord.shortDescription;
          }
          if (mappedRecord.description !== undefined) updateData.description = mappedRecord.description;
          if (mappedRecord.state !== undefined) updateData.state = parseInt(mappedRecord.state, 10);
          if (mappedRecord.priority !== undefined) updateData.priority = parseInt(mappedRecord.priority, 10);
          if (mappedRecord.impact !== undefined) updateData.impact = parseInt(mappedRecord.impact, 10);
          if (mappedRecord.urgency !== undefined) updateData.urgency = parseInt(mappedRecord.urgency, 10);
          if (mappedRecord.close_notes || mappedRecord.closeNotes) {
            updateData.closeNotes = mappedRecord.close_notes || mappedRecord.closeNotes;
          }
          if (mappedRecord.close_code || mappedRecord.closeCode) {
            updateData.closeCode = mappedRecord.close_code || mappedRecord.closeCode;
          }
          if (mappedRecord.assigned_to_id || mappedRecord.assigned_to) {
            updateData.assignedToId = mappedRecord.assigned_to_id || mappedRecord.assigned_to;
          }

          const upTask = await db.task.update({
            where: { id: existingTask.id },
            data: updateData,
          });

          if (targetTable === "incident" && (mappedRecord.category || mappedRecord.subcategory || mappedRecord.caller_name)) {
            const incData: any = {};
            if (mappedRecord.category) incData.category = mappedRecord.category;
            if (mappedRecord.subcategory) incData.subcategory = mappedRecord.subcategory;
            if (mappedRecord.caller_name || mappedRecord.callerName) {
              incData.callerName = mappedRecord.caller_name || mappedRecord.callerName;
            }
            await db.incident.updateMany({
              where: { taskId: upTask.id },
              data: incData,
            });
          }

          await db.sysImportSetRow.update({
            where: { id: row.id },
            data: { status: "updated", targetId: upTask.id },
          });
          updated++;
        } else {
          // Insert new task
          const number = mappedRecord.number || (await getNextNumber("INC"));
          const impact = mappedRecord.impact ? parseInt(mappedRecord.impact, 10) : 2;
          const urgency = mappedRecord.urgency ? parseInt(mappedRecord.urgency, 10) : 2;
          const priority = mappedRecord.priority ? parseInt(mappedRecord.priority, 10) : calculatePriority(impact, urgency);

          const newTask = await db.task.create({
            data: {
              number,
              sysClassName: targetTable,
              shortDescription: mappedRecord.short_description || mappedRecord.shortDescription || "Imported Incident",
              description: mappedRecord.description || null,
              priority,
              impact,
              urgency,
              state: mappedRecord.state ? parseInt(mappedRecord.state, 10) : 1,
              closeNotes: mappedRecord.close_notes || mappedRecord.closeNotes || null,
              closeCode: mappedRecord.close_code || mappedRecord.closeCode || null,
              ...(targetTable === "incident"
                ? {
                    incident: {
                      create: {
                        category: mappedRecord.category || "inquiry",
                        callerName: mappedRecord.caller_name || mappedRecord.callerName || "System Import",
                      },
                    },
                  }
                : {}),
            },
          });

          await db.sysImportSetRow.update({
            where: { id: row.id },
            data: { status: "inserted", targetId: newTask.id },
          });
          inserted++;
        }
      } else if (targetTable === "cmdb_ci") {
        let existingCi: any = null;
        if (coalesceMappings.length > 0) {
          const matchWhere: any = {};
          for (const c of coalesceMappings) {
            const val = mappedRecord[c.targetField];
            if (val !== undefined && val !== "") {
              matchWhere[c.targetField] = val;
            }
          }
          if (Object.keys(matchWhere).length > 0) {
            existingCi = await db.configurationItem.findFirst({ where: matchWhere });
          }
        }

        if (existingCi) {
          const upCi = await db.configurationItem.update({
            where: { id: existingCi.id },
            data: {
              name: mappedRecord.name || existingCi.name,
              status: mappedRecord.status || existingCi.status,
              environment: mappedRecord.environment || existingCi.environment,
              ipAddress: mappedRecord.ipAddress || existingCi.ipAddress,
            },
          });
          await db.sysImportSetRow.update({
            where: { id: row.id },
            data: { status: "updated", targetId: upCi.id },
          });
          updated++;
        } else {
          const newCi = await db.configurationItem.create({
            data: {
              name: mappedRecord.name || `CI-${Date.now()}`,
              ciClass: mappedRecord.ciClass || "server",
              status: mappedRecord.status || "in_service",
              environment: mappedRecord.environment || "production",
              ipAddress: mappedRecord.ipAddress || null,
            },
          });
          await db.sysImportSetRow.update({
            where: { id: row.id },
            data: { status: "inserted", targetId: newCi.id },
          });
          inserted++;
        }
      } else {
        // Standalone Custom Table with Coalesce Upsert Support
        let existingCustom: any = null;
        if (coalesceMappings.length > 0) {
          const candidates = await db.sysCustomRecord.findMany({
            where: { tableName: targetTable },
          });
          for (const cand of candidates) {
            try {
              const data = JSON.parse(cand.dataJson);
              const match = coalesceMappings.every((c) => {
                const targetVal = mappedRecord[c.targetField];
                return (
                  targetVal !== undefined &&
                  targetVal !== "" &&
                  String(data[c.targetField] ?? "") === String(targetVal)
                );
              });
              if (match) {
                existingCustom = cand;
                break;
              }
            } catch {}
          }
        }

        if (existingCustom) {
          let currentData: any = {};
          try {
            currentData = JSON.parse(existingCustom.dataJson);
          } catch {}
          const merged = { ...currentData, ...mappedRecord };
          const upCustom = await db.sysCustomRecord.update({
            where: { id: existingCustom.id },
            data: { dataJson: JSON.stringify(merged) },
          });
          await db.sysImportSetRow.update({
            where: { id: row.id },
            data: { status: "updated", targetId: upCustom.id },
          });
          updated++;
        } else {
          const newCustom = await db.sysCustomRecord.create({
            data: {
              tableName: targetTable,
              dataJson: JSON.stringify(mappedRecord),
            },
          });
          await db.sysImportSetRow.update({
            where: { id: row.id },
            data: { status: "inserted", targetId: newCustom.id },
          });
          inserted++;
        }
      }
    } catch (err: any) {
      await db.sysImportSetRow.update({
        where: { id: row.id },
        data: { status: "error", errorMessage: err.message },
      });
      errors++;
    }
  }

  // Update import set state
  await db.sysImportSet.update({
    where: { id: importSetId },
    data: { state: "transformed" },
  });

  return {
    transformMapId: transformMap.id,
    inserted,
    updated,
    errors,
    total: importSet.rows.length,
  };
}
