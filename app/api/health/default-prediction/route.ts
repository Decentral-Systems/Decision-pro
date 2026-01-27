import { NextResponse } from "next/server";

/**
 * Proxy health check to Default Prediction Service (port 4002)
 */
export async function GET() {
  try {
    const response = await fetch("http://196.188.249.48:4002/health", {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { status: "unhealthy", error: "Service returned non-200 status" },
      { status: response.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message || "Failed to connect to service",
      },
      { status: 503 }
    );
  }
}
