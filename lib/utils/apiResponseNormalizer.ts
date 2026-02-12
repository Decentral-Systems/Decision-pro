/**
 * Re-export for tooling that expects this path (e.g. apply worktree).
 * Source: lib/utils/api-response-normalizer.ts
 */
export {
  type NormalizedError,
  normalizeApiResponse,
  normalizeErrorResponse,
  isSuccessResponse,
  extractResponseData,
  validateApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./api-response-normalizer";
