// Resume Product v0.1 — frozen error protocol

export const ErrorCode = Object.freeze({
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  STEP_REQUIRED: "STEP_REQUIRED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  GENERATION_BLOCKED: "GENERATION_BLOCKED",
  FIT_REQUIRED: "FIT_REQUIRED",
  EXPORT_BLOCKED: "EXPORT_BLOCKED",
  ROLEKB_MISSING: "ROLEKB_MISSING",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

export function makeError(code, message, required_step = null, details = {}) {
  return { error: { code, message, required_step, details } };
}