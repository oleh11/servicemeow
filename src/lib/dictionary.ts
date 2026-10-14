import { db } from "./db";

export interface TableMeta {
  id?: string;
  name: string;
  label: string;
  superClass: string | null;
  description: string | null;
  isCustom: boolean;
}

export interface ColumnMeta {
  id?: string;
  tableName: string;
  columnName: string;
  columnLabel: string;
  columnType: string;
  isMandatory: boolean;
  isReadOnly: boolean;
  referenceTable?: string | null;
  defaultVal?: string | null;
  isCustom: boolean;
}

export async function getTableList(): Promise<TableMeta[]> {
  return db.sysDbObject.findMany({
    orderBy: { label: "asc" },
  });
}

export async function getTableSchema(tableName: string) {
  const table = await db.sysDbObject.findUnique({
    where: { name: tableName },
  });

  const columns = await db.sysDictionary.findMany({
    where: {
      OR: [
        { tableName },
        ...(table?.superClass ? [{ tableName: table.superClass }] : []),
      ],
    },
    orderBy: { columnLabel: "asc" },
  });

  const choices = await db.sysChoice.findMany({
    where: {
      OR: [
        { tableName },
        ...(table?.superClass ? [{ tableName: table.superClass }] : []),
      ],
    },
    orderBy: { sequence: "asc" },
  });

  return { table, columns, choices };
}

export async function addCustomField(params: {
  tableName: string;
  columnName: string;
  columnLabel: string;
  columnType: string;
  isMandatory?: boolean;
  isReadOnly?: boolean;
  referenceTable?: string;
  defaultVal?: string;
}) {
  const normalizedColName = params.columnName.startsWith("u_")
    ? params.columnName
    : `u_${params.columnName}`;

  return db.sysDictionary.create({
    data: {
      tableName: params.tableName,
      columnName: normalizedColName,
      columnLabel: params.columnLabel,
      columnType: params.columnType,
      isMandatory: params.isMandatory ?? false,
      isReadOnly: params.isReadOnly ?? false,
      referenceTable: params.referenceTable,
      defaultVal: params.defaultVal,
      isCustom: true,
    },
  });
}

export async function updateColumn(params: {
  id?: string;
  tableName?: string;
  columnName?: string;
  columnLabel?: string;
  isMandatory?: boolean;
  isReadOnly?: boolean;
  defaultVal?: string | null;
  columnType?: string;
}) {
  const data: any = {};
  if (params.columnLabel !== undefined) data.columnLabel = params.columnLabel;
  if (params.isMandatory !== undefined) data.isMandatory = params.isMandatory;
  if (params.isReadOnly !== undefined) data.isReadOnly = params.isReadOnly;
  if (params.defaultVal !== undefined) data.defaultVal = params.defaultVal;
  if (params.columnType !== undefined) data.columnType = params.columnType;

  if (params.id) {
    return db.sysDictionary.update({
      where: { id: params.id },
      data,
    });
  }

  if (params.tableName && params.columnName) {
    return db.sysDictionary.update({
      where: {
        tableName_columnName: {
          tableName: params.tableName,
          columnName: params.columnName,
        },
      },
      data,
    });
  }

  throw new Error("Cannot update column without id or tableName and columnName");
}

export async function createTable(params: {
  name: string;
  label: string;
  superClass?: string | null;
  description?: string | null;
}) {
  let cleanName = params.name.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
  if (!cleanName.startsWith("u_")) {
    cleanName = `u_${cleanName}`;
  }

  const existing = await db.sysDbObject.findUnique({
    where: { name: cleanName },
  });

  if (existing) {
    throw new Error(`Table with name '${cleanName}' already exists.`);
  }

  const superClass = params.superClass && params.superClass !== "none" ? params.superClass : null;

  // 1. Register in sys_db_object
  const table = await db.sysDbObject.create({
    data: {
      name: cleanName,
      label: params.label,
      superClass,
      description: params.description || `Custom Application Table: ${params.label}`,
      isCustom: true,
    },
  });

  // 2. Seed default columns
  const defaultCols: any[] = [];

  if (superClass === "task") {
    defaultCols.push(
      { tableName: cleanName, columnName: "number", columnLabel: "Number", columnType: "string", isReadOnly: true, isCustom: false },
      { tableName: cleanName, columnName: "short_description", columnLabel: "Short Description", columnType: "string", isMandatory: true, isCustom: false },
      { tableName: cleanName, columnName: "description", columnLabel: "Description", columnType: "text", isCustom: false },
      { tableName: cleanName, columnName: "priority", columnLabel: "Priority", columnType: "choice", defaultVal: "3", isCustom: false },
      { tableName: cleanName, columnName: "state", columnLabel: "State", columnType: "choice", defaultVal: "1", isCustom: false },
      { tableName: cleanName, columnName: "assigned_to", columnLabel: "Assigned to", columnType: "reference", referenceTable: "sys_user", isCustom: false },
      { tableName: cleanName, columnName: "assignment_group", columnLabel: "Assignment group", columnType: "reference", referenceTable: "sys_user_group", isCustom: false },
      { tableName: cleanName, columnName: "active", columnLabel: "Active", columnType: "boolean", defaultVal: "true", isCustom: false }
    );
  } else {
    defaultCols.push(
      { tableName: cleanName, columnName: "sys_id", columnLabel: "Sys ID", columnType: "string", isReadOnly: true, isCustom: false },
      { tableName: cleanName, columnName: "name", columnLabel: "Name", columnType: "string", isMandatory: true, isCustom: false },
      { tableName: cleanName, columnName: "short_description", columnLabel: "Short Description", columnType: "string", isCustom: false },
      { tableName: cleanName, columnName: "description", columnLabel: "Description", columnType: "text", isCustom: false },
      { tableName: cleanName, columnName: "active", columnLabel: "Active", columnType: "boolean", defaultVal: "true", isCustom: false },
      { tableName: cleanName, columnName: "sys_created_on", columnLabel: "Created", columnType: "datetime", isReadOnly: true, isCustom: false },
      { tableName: cleanName, columnName: "sys_updated_on", columnLabel: "Updated", columnType: "datetime", isReadOnly: true, isCustom: false }
    );
  }

  await db.sysDictionary.createMany({
    data: defaultCols,
  });

  // 3. Seed default security ACLs for this table
  await db.sysSecurityAcl.createMany({
    data: [
      {
        name: `${cleanName}.read`,
        operation: "read",
        tableName: cleanName,
        fieldName: "*",
        roleRequired: "employee",
        description: `Allow read access to ${params.label}`,
      },
      {
        name: `${cleanName}.write`,
        operation: "write",
        tableName: cleanName,
        fieldName: "*",
        roleRequired: "itil",
        description: `Allow write access to ${params.label} for ITIL fulfillers`,
      },
      {
        name: `${cleanName}.create`,
        operation: "create",
        tableName: cleanName,
        fieldName: "*",
        roleRequired: "itil",
        description: `Allow create access to ${params.label}`,
      },
      {
        name: `${cleanName}.delete`,
        operation: "delete",
        tableName: cleanName,
        fieldName: "*",
        roleRequired: "admin",
        description: `Only Admin can delete records from ${params.label}`,
      },
    ],
  });

  return table;
}
