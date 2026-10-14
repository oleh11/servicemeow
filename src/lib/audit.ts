import { db } from "./db";

export interface LogAuditEntry {
  tableName: string;
  documentId: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  userId?: string | null;
  userName?: string | null;
}

export async function logAudit(entry: LogAuditEntry | LogAuditEntry[]) {
  const entries = Array.isArray(entry) ? entry : [entry];
  if (entries.length === 0) return [];

  const created = [];
  for (const item of entries) {
    const oldStr = item.oldValue !== undefined && item.oldValue !== null ? String(item.oldValue) : null;
    const newStr = item.newValue !== undefined && item.newValue !== null ? String(item.newValue) : null;
    
    // Skip if unchanged
    if (oldStr === newStr) continue;

    const record = await db.sysAudit.create({
      data: {
        tableName: item.tableName,
        documentId: item.documentId,
        fieldName: item.fieldName,
        oldValue: oldStr,
        newValue: newStr,
        userId: item.userId || null,
        userName: item.userName || "System",
      },
    });
    created.push(record);
  }
  return created;
}

export async function getAuditHistory(tableName: string, documentId: string) {
  return await db.sysAudit.findMany({
    where: {
      tableName,
      documentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
