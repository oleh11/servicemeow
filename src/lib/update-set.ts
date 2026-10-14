import { db } from "./db";

export interface UpdateChangeItem {
  id: string;
  type: "sys_script_client" | "sys_ui_policy" | "sys_script" | "sys_dictionary" | (string & {});
  action: "insert" | "update" | "delete";
  recordId: string;
  name: string;
  data: any;
  recordedAt: string;
}

export async function getActiveUpdateSet() {
  let active = await db.sysUpdateSet.findFirst({
    where: { isCurrent: true, state: "in_progress" },
  });

  if (!active) {
    active = await db.sysUpdateSet.findFirst({
      where: { state: "in_progress" },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (!active) {
    active = await db.sysUpdateSet.create({
      data: {
        name: "Default",
        state: "in_progress",
        isCurrent: true,
        application: "global",
        description: "Default System Configuration Update Set",
        payloadJson: "[]",
      },
    });
  } else if (!active.isCurrent) {
    await db.sysUpdateSet.update({
      where: { id: active.id },
      data: { isCurrent: true },
    });
  }

  return active;
}

export async function setActiveUpdateSet(id: string) {
  await db.sysUpdateSet.updateMany({
    data: { isCurrent: false },
  });

  const updated = await db.sysUpdateSet.update({
    where: { id },
    data: { isCurrent: true, state: "in_progress" },
  });

  return updated;
}

export async function recordUpdateChange(params: {
  type: string;
  action: "insert" | "update" | "delete";
  recordId: string;
  name: string;
  data: any;
}) {
  try {
    const activeSet = await getActiveUpdateSet();
    let changes: UpdateChangeItem[] = [];
    try {
      changes = JSON.parse(activeSet.payloadJson || "[]");
    } catch {
      changes = [];
    }

    const newChange: UpdateChangeItem = {
      id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      action: params.action,
      recordId: params.recordId,
      name: params.name,
      data: params.data,
      recordedAt: new Date().toISOString(),
    };

    changes.push(newChange);

    await db.sysUpdateSet.update({
      where: { id: activeSet.id },
      data: {
        payloadJson: JSON.stringify(changes),
      },
    });

    return newChange;
  } catch (err) {
    console.error("Failed to record update change:", err);
    return null;
  }
}

export async function exportUpdateSet(id: string, format: "json" | "xml" = "json") {
  const updateSet = await db.sysUpdateSet.findUnique({
    where: { id },
  });

  if (!updateSet) {
    throw new Error(`Update set ${id} not found`);
  }

  let changes: UpdateChangeItem[] = [];
  try {
    changes = JSON.parse(updateSet.payloadJson || "[]");
  } catch {
    changes = [];
  }

  if (format === "xml") {
    // Generate valid XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sys_update_set id="${updateSet.id}">\n`;
    xml += `  <name>${escapeXml(updateSet.name)}</name>\n`;
    xml += `  <state>${escapeXml(updateSet.state)}</state>\n`;
    xml += `  <description>${escapeXml(updateSet.description || "")}</description>\n`;
    xml += `  <exported_at>${new Date().toISOString()}</exported_at>\n`;
    xml += `  <changes count="${changes.length}">\n`;

    for (const c of changes) {
      xml += `    <change id="${c.id}">\n`;
      xml += `      <type>${escapeXml(c.type)}</type>\n`;
      xml += `      <action>${escapeXml(c.action)}</action>\n`;
      xml += `      <name>${escapeXml(c.name)}</name>\n`;
      xml += `      <record_id>${escapeXml(c.recordId)}</record_id>\n`;
      xml += `      <payload><![CDATA[${JSON.stringify(c.data)}]]></payload>\n`;
      xml += `      <recorded_at>${c.recordedAt}</recorded_at>\n`;
      xml += `    </change>\n`;
    }

    xml += `  </changes>\n`;
    xml += `</sys_update_set>`;
    return { format: "xml", content: xml, filename: `${updateSet.name.replace(/\s+/g, "_")}.xml` };
  } else {
    const jsonPayload = {
      sys_update_set: {
        id: updateSet.id,
        name: updateSet.name,
        state: updateSet.state,
        description: updateSet.description,
        exported_at: new Date().toISOString(),
        changes,
      },
    };
    return {
      format: "json",
      content: JSON.stringify(jsonPayload, null, 2),
      filename: `${updateSet.name.replace(/\s+/g, "_")}.json`,
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

export function previewUpdateSet(payloadRaw: string) {
  let changes: UpdateChangeItem[] = [];
  let setName = "Imported Update Set";

  if (payloadRaw.trim().startsWith("<?xml") || payloadRaw.trim().startsWith("<sys_update_set")) {
    // Parse XML
    const nameMatch = payloadRaw.match(/<name>(.*?)<\/name>/);
    if (nameMatch) setName = nameMatch[1];
    
    const changeMatches = payloadRaw.matchAll(/<change id="(.*?)">([\s\S]*?)<\/change>/g);
    for (const m of changeMatches) {
      const cId = m[1];
      const body = m[2];
      const typeMatch = body.match(/<type>(.*?)<\/type>/);
      const actionMatch = body.match(/<action>(.*?)<\/action>/);
      const cNameMatch = body.match(/<name>(.*?)<\/name>/);
      const recIdMatch = body.match(/<record_id>(.*?)<\/record_id>/);
      const payloadMatch = body.match(/<payload><!\[CDATA\[([\s\S]*?)\]\]><\/payload>/);

      let data: any = {};
      try {
        if (payloadMatch) data = JSON.parse(payloadMatch[1]);
      } catch {}

      changes.push({
        id: cId,
        type: (typeMatch ? typeMatch[1] : "sys_unknown") as any,
        action: (actionMatch ? actionMatch[1] : "insert") as any,
        name: cNameMatch ? cNameMatch[1] : "Unnamed",
        recordId: recIdMatch ? recIdMatch[1] : "",
        data,
        recordedAt: new Date().toISOString(),
      });
    }
  } else {
    // Parse JSON
    try {
      const parsed = JSON.parse(payloadRaw);
      if (parsed.sys_update_set) {
        setName = parsed.sys_update_set.name || setName;
        changes = parsed.sys_update_set.changes || [];
      } else if (Array.isArray(parsed)) {
        changes = parsed;
      }
    } catch (e: any) {
      throw new Error(`Invalid JSON payload: ${e.message}`);
    }
  }

  const typesCount: Record<string, number> = {};
  for (const c of changes) {
    typesCount[c.type] = (typesCount[c.type] || 0) + 1;
  }

  return {
    name: setName,
    totalChanges: changes.length,
    typesCount,
    changes,
  };
}

export async function commitUpdateSet(name: string, payloadRaw: string) {
  const preview = previewUpdateSet(payloadRaw);
  let applied = 0;

  for (const change of preview.changes) {
    try {
      if (change.type === "sys_script_client") {
        if (change.action === "delete") {
          await db.sysClientScript.deleteMany({ where: { name: change.name } });
        } else {
          const existing = await db.sysClientScript.findFirst({ where: { name: change.name } });
          if (existing) {
            await db.sysClientScript.update({
              where: { id: existing.id },
              data: {
                tableName: change.data.tableName || existing.tableName,
                type: change.data.type || existing.type,
                fieldName: change.data.fieldName ?? existing.fieldName,
                scriptBody: change.data.scriptBody || existing.scriptBody,
                active: change.data.active ?? existing.active,
                description: change.data.description ?? existing.description,
              },
            });
          } else {
            await db.sysClientScript.create({
              data: {
                name: change.name,
                tableName: change.data.tableName || "incident",
                type: change.data.type || "onLoad",
                fieldName: change.data.fieldName || null,
                scriptBody: change.data.scriptBody || "",
                active: change.data.active ?? true,
                description: change.data.description || null,
              },
            });
          }
        }
        applied++;
      } else if (change.type === "sys_ui_policy") {
        if (change.action === "delete") {
          await db.sysUiPolicy.deleteMany({ where: { name: change.name } });
        } else {
          const existing = await db.sysUiPolicy.findFirst({ where: { name: change.name } });
          if (existing) {
            await db.sysUiPolicy.update({
              where: { id: existing.id },
              data: {
                tableName: change.data.tableName || existing.tableName,
                conditionField: change.data.conditionField || existing.conditionField,
                conditionOperator: change.data.conditionOperator || existing.conditionOperator,
                conditionValue: change.data.conditionValue || existing.conditionValue,
                active: change.data.active ?? existing.active,
              },
            });
          } else {
            await db.sysUiPolicy.create({
              data: {
                name: change.name,
                tableName: change.data.tableName || "incident",
                conditionField: change.data.conditionField || "state",
                conditionOperator: change.data.conditionOperator || "=",
                conditionValue: change.data.conditionValue || "6",
                active: change.data.active ?? true,
              },
            });
          }
        }
        applied++;
      } else if (change.type === "sys_script") {
        if (change.action === "delete") {
          await db.sysScript.deleteMany({ where: { name: change.name } });
        } else {
          const existing = await db.sysScript.findFirst({ where: { name: change.name } });
          if (existing) {
            await db.sysScript.update({
              where: { id: existing.id },
              data: {
                tableName: change.data.tableName || existing.tableName,
                when: change.data.when || existing.when,
                actionsJson: typeof change.data.actionsJson === "string" ? change.data.actionsJson : JSON.stringify(change.data.actionsJson || {}),
                active: change.data.active ?? existing.active,
              },
            });
          } else {
            await db.sysScript.create({
              data: {
                name: change.name,
                tableName: change.data.tableName || "incident",
                when: change.data.when || "before_update",
                actionsJson: typeof change.data.actionsJson === "string" ? change.data.actionsJson : JSON.stringify(change.data.actionsJson || {}),
                active: change.data.active ?? true,
              },
            });
          }
        }
        applied++;
      } else if (change.type === "sys_db_object") {
        if (change.action === "delete") {
          await db.sysDbObject.deleteMany({ where: { name: change.name } });
        } else {
          const existing = await db.sysDbObject.findUnique({ where: { name: change.name } });
          if (existing) {
            await db.sysDbObject.update({
              where: { id: existing.id },
              data: {
                label: change.data.label || existing.label,
                superClass: change.data.superClass !== undefined ? change.data.superClass : existing.superClass,
                description: change.data.description || existing.description,
              },
            });
          } else {
            await db.sysDbObject.create({
              data: {
                name: change.name,
                label: change.data.label || change.name,
                superClass: change.data.superClass || null,
                description: change.data.description || null,
                isCustom: change.data.isCustom ?? true,
              },
            });
          }
        }
        applied++;
      } else if (change.type === "sys_dictionary") {
        const tblName = change.data?.tableName;
        const colName = change.data?.columnName;
        if (tblName && colName) {
          if (change.action === "delete") {
            await db.sysDictionary.deleteMany({
              where: { tableName: tblName, columnName: colName },
            });
          } else {
            const existing = await db.sysDictionary.findUnique({
              where: { tableName_columnName: { tableName: tblName, columnName: colName } },
            });
            if (existing) {
              await db.sysDictionary.update({
                where: { id: existing.id },
                data: {
                  columnLabel: change.data.columnLabel || existing.columnLabel,
                  columnType: change.data.columnType || existing.columnType,
                  isMandatory: change.data.isMandatory !== undefined ? change.data.isMandatory : existing.isMandatory,
                  isReadOnly: change.data.isReadOnly !== undefined ? change.data.isReadOnly : existing.isReadOnly,
                  defaultVal: change.data.defaultVal !== undefined ? change.data.defaultVal : existing.defaultVal,
                },
              });
            } else {
              await db.sysDictionary.create({
                data: {
                  tableName: tblName,
                  columnName: colName,
                  columnLabel: change.data.columnLabel || colName,
                  columnType: change.data.columnType || "string",
                  isMandatory: change.data.isMandatory ?? false,
                  isReadOnly: change.data.isReadOnly ?? false,
                  defaultVal: change.data.defaultVal || null,
                  isCustom: change.data.isCustom ?? true,
                },
              });
            }
          }
          applied++;
        }
      }
    } catch (e) {
      console.error(`Error applying change ${change.name}:`, e);
    }
  }

  // Create committed update set record
  const committedRecord = await db.sysUpdateSet.create({
    data: {
      name: preview.name || name,
      state: "committed",
      description: `Committed update set on ${new Date().toLocaleString()}`,
      payloadJson: JSON.stringify(preview.changes),
    },
  });

  return {
    updateSetId: committedRecord.id,
    name: committedRecord.name,
    totalChanges: preview.totalChanges,
    applied,
  };
}
