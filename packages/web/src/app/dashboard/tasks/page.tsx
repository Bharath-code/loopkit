"use client";

/**
 * /dashboard/tasks — Full task CRUD with optimistic updates.
 *
 * This is the user-visible side of the bidirectional sync. A user
 * editing here triggers Convex mutations; the next `loopkit track --sync`
 * will pull these changes into the local tasks.md.
 *
 * Sections: This Week, Backlog. Each task is a row with:
 *   - status checkbox (open ⇄ done)
 *   - title (inline-edit on click)
 *   - cut button (archive)
 *   - "last modified" badge (CLI vs Web)
 *
 * Real-time updates via Convex's useQuery subscription — when the CLI
 * pushes new state, this view updates within ~100ms.
 */

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonCard } from "@/components/skeletons";
import {
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  X,
  Plus,
  Terminal,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "open" | "done" | "snoozed" | "cut";

interface SyncTask {
  _id: string;
  cliTaskId: number;
  title: string;
  status: TaskStatus;
  section: "week" | "backlog";
  createdAt: string;
  closedAt?: string;
  closedVia?: string;
  snoozedUntil?: string;
  updatedAt: string;
  lastModifiedBy: "cli" | "web";
}

export default function DashboardTasksPage() {
  const projects = useQuery(api.projects.list);
  const activeProject = projects?.[0];
  const projectId = activeProject?._id as Id<"projects"> | undefined;

  const tasks = useQuery(
    api.tasks.listByProject,
    projectId ? { projectId, limit: 500 } : "skip",
  );

  const counts = useQuery(
    api.tasks.countByStatus,
    projectId ? { projectId } : "skip",
  );

  const upsert = useMutation(api.tasks.upsert);
  const deleteByCliId = useMutation(api.tasks.deleteByCliId);
  const markDone = useMutation(api.tasks.markDone);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newWeekTitle, setNewWeekTitle] = useState("");
  const [newBacklogTitle, setNewBacklogTitle] = useState("");

  const { weekTasks, backlogTasks, nextWeekId, nextBacklogId } = useMemo(() => {
    const all = (tasks ?? []) as SyncTask[];
    const week = all.filter((t) => t.section === "week" && t.status !== "cut");
    const backlog = all.filter((t) => t.section === "backlog" && t.status !== "cut");
    const maxWeekId = all
      .filter((t) => t.section === "week")
      .reduce((m, t) => Math.max(m, t.cliTaskId), 0);
    const maxBacklogId = all
      .filter((t) => t.section === "backlog")
      .reduce((m, t) => Math.max(m, t.cliTaskId), 0);
    return {
      weekTasks: week,
      backlogTasks: backlog,
      nextWeekId: maxWeekId + 1,
      nextBacklogId: maxBacklogId + 1,
    };
  }, [tasks]);

  const startEdit = useCallback((task: SyncTask) => {
    setEditingId(task._id);
    setEditingTitle(task.title);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingTitle("");
  }, []);

  const saveEdit = useCallback(
    async (task: SyncTask) => {
      if (!projectId) return;
      const newTitle = editingTitle.trim();
      if (!newTitle || newTitle === task.title) {
        cancelEdit();
        return;
      }
      await upsert({
        projectId,
        cliTaskId: task.cliTaskId,
        title: newTitle,
        status: task.status,
        section: task.section,
        createdAt: task.createdAt,
        closedAt: task.closedAt,
        closedVia: task.closedVia,
        snoozedUntil: task.snoozedUntil,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: "web",
      });
      cancelEdit();
    },
    [projectId, upsert, editingTitle, cancelEdit],
  );

  const toggleStatus = useCallback(
    async (task: SyncTask) => {
      if (!projectId) return;
      if (task.status === "done") {
        // Re-open
        await upsert({
          projectId,
          cliTaskId: task.cliTaskId,
          title: task.title,
          status: "open",
          section: task.section,
          createdAt: task.createdAt,
          closedAt: undefined,
          closedVia: undefined,
          snoozedUntil: task.snoozedUntil,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: "web",
        });
      } else {
        await markDone({
          projectId,
          cliTaskId: task.cliTaskId,
        });
      }
    },
    [projectId, upsert, markDone],
  );

  const cutTask = useCallback(
    async (task: SyncTask) => {
      if (!projectId) return;
      await upsert({
        projectId,
        cliTaskId: task.cliTaskId,
        title: task.title,
        status: "cut",
        section: task.section,
        createdAt: task.createdAt,
        closedAt: new Date().toISOString(),
        closedVia: undefined,
        snoozedUntil: task.snoozedUntil,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: "web",
      });
    },
    [projectId, upsert],
  );

  const hardDelete = useCallback(
    async (task: SyncTask) => {
      if (!projectId) return;
      await deleteByCliId({
        projectId,
        cliTaskId: task.cliTaskId,
      });
    },
    [projectId, deleteByCliId],
  );

  const addTask = useCallback(
    async (section: "week" | "backlog", title: string) => {
      if (!projectId) return;
      const trimmed = title.trim();
      if (!trimmed) return;
      const id =
        section === "week" ? nextWeekId : nextBacklogId;
      await upsert({
        projectId,
        cliTaskId: id,
        title: trimmed,
        status: "open",
        section,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModifiedBy: "web",
      });
      if (section === "week") setNewWeekTitle("");
      else setNewBacklogTitle("");
    },
    [projectId, upsert, nextWeekId, nextBacklogId],
  );

  if (!projects) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center">
        <p className="text-zinc-400 text-sm">
          No projects yet. Run{" "}
          <code className="text-violet-400">loopkit init</code> in your CLI to
          get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-up">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-title text-white mb-2">Tasks</h1>
          <p className="text-zinc-400 text-sm">
            Two-way sync with <code className="text-violet-400">loopkit track</code>.
            Edits here appear in the CLI on next{" "}
            <code className="text-violet-400">--sync</code>.
          </p>
        </div>

        {counts && (
          <div className="flex items-center gap-3 text-xs">
            <CountChip label="Open" value={counts.open} color="text-amber-400" />
            <CountChip label="Done" value={counts.done} color="text-emerald-400" />
            <CountChip label="Cut" value={counts.cut} color="text-zinc-500" />
          </div>
        )}
      </header>

      {/* ─── This Week ──────────────────────────────────────── */}
      <TaskSection
        title="This Week"
        subtitle="Active commitments. Aim for 3-5."
        tasks={weekTasks}
        editingId={editingId}
        editingTitle={editingTitle}
        newTitle={newWeekTitle}
        onNewTitleChange={setNewWeekTitle}
        onAdd={(t) => addTask("week", t)}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onEditingTitleChange={setEditingTitle}
        onToggle={toggleStatus}
        onCut={cutTask}
        onDelete={hardDelete}
        emptyHint="No tasks yet. Add your first one above, or run `loopkit track --add` in the CLI."
      />

      {/* ─── Backlog ───────────────────────────────────────── */}
      <TaskSection
        title="Backlog"
        subtitle="Future ideas. Move to This Week when ready."
        tasks={backlogTasks}
        editingId={editingId}
        editingTitle={editingTitle}
        newTitle={newBacklogTitle}
        onNewTitleChange={setNewBacklogTitle}
        onAdd={(t) => addTask("backlog", t)}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
        onEditingTitleChange={setEditingTitle}
        onToggle={toggleStatus}
        onCut={cutTask}
        onDelete={hardDelete}
        emptyHint="Backlog is empty. Capture ideas here so they don't get lost."
      />

      {/* ─── Sync hint ─────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-3">
        <Terminal className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
        <div className="text-sm text-zinc-400">
          <p className="mb-1">
            <span className="text-zinc-300 font-medium">Syncing from the CLI:</span>
          </p>
          <code className="text-xs font-mono text-cyan-300 block bg-zinc-950 px-2 py-1 rounded mt-1">
            loopkit track --sync
          </code>
          <p className="text-xs text-zinc-500 mt-2">
            Last-write-wins conflicts. CLI is the canonical seed for new tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

function CountChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/40">
      <span className="text-zinc-500">{label}:</span>{" "}
      <span className={cn("font-mono font-medium", color)}>{value}</span>
    </div>
  );
}

function TaskSection({
  title,
  subtitle,
  tasks,
  editingId,
  editingTitle,
  newTitle,
  onNewTitleChange,
  onAdd,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingTitleChange,
  onToggle,
  onCut,
  onDelete,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  tasks: SyncTask[];
  editingId: string | null;
  editingTitle: string;
  newTitle: string;
  onNewTitleChange: (s: string) => void;
  onAdd: (s: string) => void | Promise<void>;
  onStartEdit: (t: SyncTask) => void;
  onSaveEdit: (t: SyncTask) => void | Promise<void>;
  onCancelEdit: () => void;
  onEditingTitleChange: (s: string) => void;
  onToggle: (t: SyncTask) => void | Promise<void>;
  onCut: (t: SyncTask) => void | Promise<void>;
  onDelete: (t: SyncTask) => void | Promise<void>;
  emptyHint: string;
}) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          {title}
          <span className="text-xs text-zinc-500 font-normal">
            ({tasks.length})
          </span>
        </h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </header>

      <Card className="p-3">
        {/* Add row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(newTitle);
          }}
          className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/30 border border-zinc-800/50 focus-within:border-violet-500/50 transition-colors"
        >
          <Plus className="h-4 w-4 text-zinc-500 shrink-0" />
          <Input
            value={newTitle}
            onChange={(e) => onNewTitleChange(e.target.value)}
            placeholder={`Add a ${title.toLowerCase()} task...`}
            className="flex-1 bg-transparent border-0 text-sm h-7 px-0 focus-visible:ring-0 placeholder:text-zinc-600"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={!newTitle.trim()}
            className="h-7 px-2 text-xs"
          >
            Add
          </Button>
        </form>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-zinc-600 italic">{emptyHint}</p>
          </div>
        ) : (
          <ul className="mt-2 space-y-1">
            {tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                isEditing={editingId === task._id}
                editingTitle={editingTitle}
                onEditingTitleChange={onEditingTitleChange}
                onStartEdit={() => onStartEdit(task)}
                onSaveEdit={() => onSaveEdit(task)}
                onCancelEdit={onCancelEdit}
                onToggle={() => onToggle(task)}
                onCut={() => onCut(task)}
                onDelete={() => onDelete(task)}
              />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function TaskRow({
  task,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onCut,
  onDelete,
}: {
  task: SyncTask;
  isEditing: boolean;
  editingTitle: string;
  onEditingTitleChange: (s: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: () => void;
  onCut: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "done";
  const isSnoozed = task.status === "snoozed";

  return (
    <li
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg transition-colors",
        "hover:bg-zinc-900/50",
        isDone && "opacity-60",
        isSnoozed && "opacity-50",
      )}
    >
      {/* Status checkbox */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isDone ? "Mark as open" : "Mark as done"}
        className="shrink-0 text-zinc-500 hover:text-emerald-400 transition-colors"
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* ID */}
      <span className="font-mono text-xs text-zinc-600 shrink-0 w-8">
        #{task.cliTaskId}
      </span>

      {/* Title (inline-edit) */}
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSaveEdit();
          }}
          className="flex-1 flex items-center gap-2"
        >
          <Input
            autoFocus
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancelEdit();
            }}
            className="h-7 text-sm"
          />
          <Button type="submit" size="sm" variant="ghost" className="h-7 px-2">
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancelEdit}
            className="h-7 px-2"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          className={cn(
            "flex-1 text-left text-sm flex items-center gap-2 group/title",
            isDone && "line-through text-zinc-500",
            !isDone && "text-zinc-200",
          )}
        >
          <span className="flex-1">{task.title}</span>
          <Pencil className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover/title:text-zinc-400 transition-opacity" />
        </button>
      )}

      {/* Modified-by badge */}
      <span
        className={cn(
          "shrink-0 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider",
          task.lastModifiedBy === "cli"
            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            : "bg-violet-500/10 text-violet-400 border border-violet-500/20",
        )}
        title={`Last modified by ${task.lastModifiedBy === "cli" ? "the CLI" : "the dashboard"}`}
      >
        {task.lastModifiedBy === "cli" ? "CLI" : "WEB"}
      </span>

      {/* Cut (archive) */}
      <button
        type="button"
        onClick={onCut}
        aria-label="Cut (archive)"
        className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-500 hover:text-amber-400 transition-all"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      {/* Hard delete */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete permanently"
        className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-500 hover:text-red-400 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
