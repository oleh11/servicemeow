import { getNextTaskNumber } from "./reference-resolver";

export type NumberPrefix = "INC" | "CHG" | "PRB" | "REQ" | "RITM" | "TASK" | "DOC" | "KB" | "RES" | (string & {});

const PREFIX_TABLE_MAP: Record<string, string> = {
  INC: "incident",
  CHG: "change_request",
  PRB: "problem",
  REQ: "sc_request",
  RITM: "sc_req_item",
  TASK: "task",
  DOC: "kb_knowledge",
  KB: "kb_knowledge",
  RES: "cmn_reservation",
};

export async function getNextNumber(prefixOrTable: NumberPrefix, customPrefix?: string): Promise<string> {
  let tableName: string;
  let prefix: string;

  if (PREFIX_TABLE_MAP[prefixOrTable]) {
    tableName = PREFIX_TABLE_MAP[prefixOrTable];
    prefix = customPrefix || prefixOrTable;
  } else if (customPrefix) {
    tableName = prefixOrTable;
    prefix = customPrefix;
  } else if (prefixOrTable === "cmn_reservation") {
    tableName = "cmn_reservation";
    prefix = "RES";
  } else {
    tableName = "task";
    prefix = prefixOrTable;
  }

  return getNextTaskNumber(tableName, prefix);
}
