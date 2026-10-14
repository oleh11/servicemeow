import { getNextTaskNumber } from "./reference-resolver";

export type NumberPrefix = "INC" | "CHG" | "PRB" | "REQ" | "RITM" | "TASK" | "DOC" | "KB" | (string & {});

const PREFIX_TABLE_MAP: Record<string, string> = {
  INC: "incident",
  CHG: "change_request",
  PRB: "problem",
  REQ: "sc_request",
  RITM: "sc_req_item",
  TASK: "task",
  DOC: "kb_knowledge",
  KB: "kb_knowledge",
};

export async function getNextNumber(prefix: NumberPrefix): Promise<string> {
  const tableName = PREFIX_TABLE_MAP[prefix] || "task";
  return getNextTaskNumber(tableName, prefix);
}
