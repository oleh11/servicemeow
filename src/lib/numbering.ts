import { getNextTaskNumber } from "./reference-resolver";

export type NumberPrefix =
  | "INC"
  | "CHG"
  | "PRB"
  | "REQ"
  | "RITM"
  | "TASK"
  | "SCTASK"
  | "CTASK"
  | "DOC"
  | "KB"
  | "RES"
  | (string & {});

const PREFIX_TABLE_MAP: Record<string, string> = {
  INC: "incident",
  CHG: "change_request",
  PRB: "problem",
  REQ: "sc_request",
  RITM: "sc_req_item",
  TASK: "sc_task",
  SCTASK: "sc_task",
  CTASK: "change_task",
  DOC: "kb_knowledge",
  KB: "kb_knowledge",
  KBB: "kb_knowledge_base",
  RES: "cmn_reservation",
  STRY: "rm_story",
  SPNT: "rm_sprint",
  EPIC: "rm_epic",
  PRJ: "rm_project",
};

const TABLE_PREFIX_MAP: Record<string, string> = {
  incident: "INC",
  change_request: "CHG",
  problem: "PRB",
  sc_request: "REQ",
  sc_req_item: "RITM",
  sc_task: "TASK",
  change_task: "CTASK",
  cmn_reservation: "RES",
  kb_knowledge: "KB",
  kb_knowledge_base: "KBB",
  task: "TASK",
  rm_story: "STRY",
  rm_sprint: "SPNT",
  rm_epic: "EPIC",
  rm_project: "PRJ",
};

export async function getNextNumber(prefixOrTable: NumberPrefix, customPrefix?: string): Promise<string> {
  let tableName: string;
  let prefix: string;

  if (PREFIX_TABLE_MAP[prefixOrTable]) {
    tableName = PREFIX_TABLE_MAP[prefixOrTable];
    prefix = customPrefix || (prefixOrTable === "SCTASK" ? "TASK" : prefixOrTable);
  } else if (TABLE_PREFIX_MAP[prefixOrTable]) {
    tableName = prefixOrTable;
    prefix = customPrefix || TABLE_PREFIX_MAP[prefixOrTable];
  } else if (customPrefix) {
    tableName = prefixOrTable;
    prefix = customPrefix;
  } else {
    tableName = prefixOrTable;
    prefix = prefixOrTable.startsWith("u_")
      ? prefixOrTable.toUpperCase().replace(/^U_/, "")
      : prefixOrTable.substring(0, 3).toUpperCase();
  }

  return getNextTaskNumber(tableName, prefix);
}
