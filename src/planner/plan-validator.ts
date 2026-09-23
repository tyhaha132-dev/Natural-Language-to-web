import type { PlanResult } from "../orchestrator/plan-result.js";

export interface PlanValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PlanValidator {
  validate(plan: PlanResult): PlanValidationResult;
}

export function createPlanValidator(): PlanValidator {
  return {
    validate(plan: PlanResult): PlanValidationResult {
      const errors: string[] = [];

      if (plan.prompt.trim().length === 0) {
        errors.push("Plan prompt cannot be empty");
      }

      if (plan.plan.trim().length === 0) {
        errors.push("Plan content cannot be empty");
      }

      if (plan.plannedAt.trim().length === 0) {
        errors.push("Plan timestamp cannot be empty");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
  };
}
