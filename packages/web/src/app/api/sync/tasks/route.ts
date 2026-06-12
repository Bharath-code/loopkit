import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { csrfCheck } from "../../ai/_helpers";

/**
 * POST /api/sync/tasks
 * Body: { projectId, tasks: SyncTask[] }
 *
 * The CLI pushes the local tasks.md state to Convex. The handler
 * delegates to the `bulkUpsert` mutation which handles LWW per task.
 */
export async function POST(req: NextRequest) {
  try {
    const csrf = csrfCheck(req);
    if (csrf) {
      return NextResponse.json({ error: csrf.error }, { status: csrf.status });
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, tasks } = body;

    if (!projectId || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    if (tasks.length === 0) {
      return NextResponse.json({ inserted: 0, updated: 0, skipped: 0 });
    }

    if (tasks.length > 500) {
      return NextResponse.json(
        { error: "Too many tasks in one push (max 500)." },
        { status: 413 },
      );
    }

    const result = await fetchMutation(
      api.tasks.bulkUpsert,
      { projectId: projectId as Id<"projects">, tasks },
      { token },
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Sync tasks error:", err);
    return NextResponse.json(
      { error: "Failed to sync tasks." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/sync/tasks?projectId=...
 * Returns the project's tasks for the CLI to merge locally.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }

    const tasks = await fetchQuery(
      api.tasks.listByProject,
      { projectId: projectId as Id<"projects">, limit: 500 },
      { token },
    );

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Pull tasks error:", err);
    return NextResponse.json(
      { error: "Failed to pull tasks." },
      { status: 500 },
    );
  }
}
