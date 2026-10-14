export interface UiPolicyAction {
  id?: string;
  fieldName: string;
  mandatory: string; // "true" | "false" | "ignore"
  readOnly: string;  // "true" | "false" | "ignore"
  visible: string;   // "true" | "false" | "ignore"
}

export interface UiPolicy {
  id: string;
  name: string;
  tableName: string;
  shortDescription?: string | null;
  active: boolean;
  order: number;
  conditionField: string;
  conditionOperator: string; // "=", "!=", "in"
  conditionValue: string;
  reverseIfFalse: boolean;
  actions: UiPolicyAction[];
}

export interface FieldUiState {
  mandatory?: boolean;
  readOnly?: boolean;
  visible?: boolean;
}

export interface ComputedUiPolicyState {
  fields: Record<string, FieldUiState>;
  triggeredPolicies: { id: string; name: string }[];
}

/**
 * Evaluates whether a UI policy's condition is met.
 */
export function checkUiPolicyCondition(
  policy: UiPolicy,
  formValues: Record<string, any>
): boolean {
  const currentVal = formValues[policy.conditionField];
  const targetVal = policy.conditionValue;

  if (currentVal === undefined || currentVal === null) {
    return false;
  }

  const curStr = String(currentVal).toLowerCase().trim();
  const targetStr = String(targetVal).toLowerCase().trim();

  switch (policy.conditionOperator) {
    case "=":
      return curStr === targetStr;
    case "!=":
      return curStr !== targetStr;
    case "in": {
      const parts = targetStr.split(",").map((s) => s.trim());
      return parts.includes(curStr);
    }
    default:
      return curStr === targetStr;
  }
}

/**
 * Computes dynamic form behavior across all active UI policies.
 */
export function computeUiPolicies(
  policies: UiPolicy[],
  formValues: Record<string, any>
): ComputedUiPolicyState {
  const fields: Record<string, FieldUiState> = {};
  const triggeredPolicies: { id: string; name: string }[] = [];

  for (const policy of policies) {
    if (!policy.active) continue;

    const conditionMet = checkUiPolicyCondition(policy, formValues);

    if (conditionMet) {
      triggeredPolicies.push({ id: policy.id, name: policy.name });

      for (const action of policy.actions) {
        if (!fields[action.fieldName]) fields[action.fieldName] = {};

        if (action.mandatory === "true") fields[action.fieldName].mandatory = true;
        else if (action.mandatory === "false") fields[action.fieldName].mandatory = false;

        if (action.readOnly === "true") fields[action.fieldName].readOnly = true;
        else if (action.readOnly === "false") fields[action.fieldName].readOnly = false;

        if (action.visible === "true") fields[action.fieldName].visible = true;
        else if (action.visible === "false") fields[action.fieldName].visible = false;
      }
    } else if (policy.reverseIfFalse) {
      // Apply reversed effects if specified
      for (const action of policy.actions) {
        if (!fields[action.fieldName]) fields[action.fieldName] = {};

        if (action.mandatory === "true") fields[action.fieldName].mandatory = false;
        if (action.readOnly === "true") fields[action.fieldName].readOnly = false;
        if (action.visible === "false") fields[action.fieldName].visible = true;
      }
    }
  }

  return { fields, triggeredPolicies };
}
