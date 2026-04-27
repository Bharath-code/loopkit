import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

/**
 * Verify the currently authenticated user owns the given project.
 * Returns the userId if authorized, or null if not.
 */
export async function getAuthenticatedUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

/**
 * Check if the authenticated user owns the specified project.
 * Returns true if the user is the owner, false otherwise.
 */
export async function userOwnsProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">
): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;

  const project = await ctx.db.get(projectId);
  if (!project) return false;

  return project.userId === userId;
}

/**
 * Assert that the authenticated user owns the project.
 * Throws an error if not authorized (useful for mutations).
 */
export async function assertProjectOwner(
  ctx: MutationCtx,
  projectId: Id<"projects">
): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: authentication required");
  }

  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.userId !== userId) {
    throw new Error("Forbidden: you do not own this project");
  }
}
