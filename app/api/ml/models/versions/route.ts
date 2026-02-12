import { NextResponse } from "next/server";

/**
 * Placeholder so tooling can resolve this path (e.g. apply worktree).
 * Use GET /api/ml/models/[id]/versions for model-specific versions.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Model ID required. Use GET /api/ml/models/:id/versions" },
    { status: 400 }
  );
}
