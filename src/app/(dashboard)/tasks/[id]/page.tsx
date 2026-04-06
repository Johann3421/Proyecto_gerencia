"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { cn, formatRelativeDate, formatDueDate } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG, ROLE_LABELS } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  AlertTriangle,
  GitBranch,
  Image,
  FileText,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { can, isRole } = usePermissions();
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "evidence">("timeline");

  const taskId = params.id as string;
  const utils = trpc.useUtils();

  const { data: task, isLoading } = trpc.tasks.byId.useQuery(
    { id: taskId },
    { enabled: !!taskId }
  );

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.byId.invalidate({ id: taskId });
      utils.tasks.list.invalidate();
    },
  });

  const addComment = trpc.tasks.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.tasks.byId.invalidate({ id: taskId });
    },
  });

  const resolveApproval = trpc.tasks.resolveApproval.useMutation({
    onSuccess: () => {
      utils.tasks.byId.invalidate({ id: taskId });
      utils.tasks.list.invalidate();
    },
  });

  if (isLoading) return <TaskDetailSkeleton />;
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-zinc-300" />
        <p className="text-sm text-zinc-500">Tarea no encontrada</p>
        <Link href="/tasks" className="text-sm text-indigo-600 hover:underline">
          Volver a tareas
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const due = formatDueDate(task.dueDate);
  const pendingApproval = task.approvals.find((a) => a.status === "PENDING");

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate({ taskId: task!.id, status: newStatus as never });
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Extract @mentions (simple userId detection)
    const mentionPattern = /@(\w+)/g;
    addComment.mutate({
      taskId: task!.id,
      content: commentText,
    });
  }

  function handleApproval(status: "APPROVED" | "REJECTED") {
    if (!pendingApproval) return;
    resolveApproval.mutate({
      approvalId: pendingApproval.id,
      status,
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", priorityCfg.bgColor, priorityCfg.color,
                task.priority === "CRITICAL" && "animate-pulse"
              )}
            >
              {task.priority === "CRITICAL" && <AlertTriangle className="mr-1 inline h-3 w-3" />}
              {priorityCfg.label}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusCfg.bgColor, statusCfg.color)}>
              {statusCfg.label}
            </span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: task.area.color }}>
              {task.area.name}
            </span>
          </div>
          <h1 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
            {task.title}
          </h1>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {task.description && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Descripción
              </h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                {task.description}
              </p>
            </div>
          )}

          {/* Pending approval banner */}
          {pendingApproval && can("approvals", "resolve") && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-semibold">Aprobación pendiente</span>
              </div>
              {pendingApproval.notes && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-300">
                  {pendingApproval.notes}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleApproval("APPROVED")}
                  disabled={resolveApproval.isPending}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleApproval("REJECTED")}
                  disabled={resolveApproval.isPending}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === "timeline"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Timeline ({task.logs.length + task.comments.length})
            </button>
            <button
              onClick={() => setActiveTab("evidence")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === "evidence"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Paperclip className="h-4 w-4" />
              Evidencias ({task.evidence.length})
            </button>
          </div>

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              {/* Merged and sorted timeline */}
              {[
                ...task.logs.map((log) => ({
                  type: "log" as const,
                  date: new Date(log.createdAt),
                  data: log,
                })),
                ...task.comments.map((comment) => ({
                  type: "comment" as const,
                  date: new Date(comment.createdAt),
                  data: comment,
                })),
              ]
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        entry.type === "comment" ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                      )}>
                        {entry.type === "comment" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : entry.data.action === "STATUS_CHANGED" ? (
                          <PlayCircle className="h-4 w-4" />
                        ) : entry.data.action === "ASSIGNED" ? (
                          <User className="h-4 w-4" />
                        ) : entry.data.action === "EVIDENCE_UPLOADED" ? (
                          <Image className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      {i < task.logs.length + task.comments.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      {entry.type === "comment" ? (
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                              {entry.data.author.name.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {entry.data.author.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {formatRelativeDate(entry.date)}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                            {entry.data.content}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {entry.data.user.name}
                            </span>{" "}
                            {getLogDescription(entry.data.action, entry.data.fromValue, entry.data.toValue)}
                          </p>
                          <p className="mt-0.5 text-[10px] text-zinc-400">
                            {formatRelativeDate(entry.date)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addComment.isPending}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Evidence */}
          {activeTab === "evidence" && (
            <div>
              {task.evidence.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 p-8 dark:border-zinc-700">
                  <Paperclip className="h-10 w-10 text-zinc-300" />
                  <p className="mt-2 text-sm text-zinc-500">Sin evidencias adjuntas</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {task.evidence.map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                    >
                      {ev.fileType.startsWith("image/") ? (
                        <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                          <img
                            src={ev.fileUrl}
                            alt={ev.caption ?? ev.fileName}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-zinc-50 dark:bg-zinc-900">
                          <FileText className="h-8 w-8 text-zinc-400" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {ev.fileName}
                        </p>
                        {ev.caption && (
                          <p className="mt-0.5 truncate text-[10px] text-zinc-500">{ev.caption}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Status actions */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Acciones
            </h3>
            <div className="space-y-2">
              {task.status === "PENDING" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={updateStatus.isPending}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4" />
                  Iniciar tarea
                </button>
              )}
              {task.status === "IN_PROGRESS" && (
                <>
                  <button
                    onClick={() => handleStatusChange("AWAITING_REVIEW")}
                    disabled={updateStatus.isPending}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Clock className="h-4 w-4" />
                    Enviar a revisión
                  </button>
                  <button
                    onClick={() => handleStatusChange("BLOCKED")}
                    disabled={updateStatus.isPending}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Marcar bloqueada
                  </button>
                </>
              )}
              {task.status === "APPROVED" && (
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={updateStatus.isPending}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar completada
                </button>
              )}
              {task.status === "REJECTED" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={updateStatus.isPending}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4" />
                  Retomar tarea
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Detalles
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Asignado a</dt>
                <dd className="font-medium text-zinc-900 dark:text-white">
                  {task.assignedTo?.name ?? "Sin asignar"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Creado por</dt>
                <dd className="font-medium text-zinc-900 dark:text-white">
                  {task.createdBy.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Área</dt>
                <dd className="font-medium" style={{ color: task.area.color }}>
                  {task.area.name}
                </dd>
              </div>
              {task.department && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Departamento</dt>
                  <dd className="font-medium text-zinc-900 dark:text-white">
                    {task.department.name}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zinc-500">Fecha límite</dt>
                <dd className={cn("font-medium",
                  due.isOverdue ? "text-red-600" : due.isUrgent ? "text-amber-600" : "text-zinc-900 dark:text-white"
                )}>
                  {due.text}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Creado</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {formatRelativeDate(task.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <GitBranch className="h-3.5 w-3.5" />
                Sub-tareas ({task.subtasks.length})
              </h3>
              <div className="space-y-2">
                {task.subtasks.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/tasks/${sub.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 p-2 text-xs hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <span className="truncate text-zinc-700 dark:text-zinc-300">{sub.title}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px]",
                      STATUS_CONFIG[sub.status].bgColor,
                      STATUS_CONFIG[sub.status].color
                    )}>
                      {STATUS_CONFIG[sub.status].label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Etiquetas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full px-2.5 py-1 text-[10px] font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────

function getLogDescription(action: string, fromValue: string | null, toValue: string | null): string {
  switch (action) {
    case "CREATED":
      return "creó esta tarea";
    case "STATUS_CHANGED":
      return `cambió el estado de ${STATUS_CONFIG[fromValue as keyof typeof STATUS_CONFIG]?.label ?? fromValue} a ${STATUS_CONFIG[toValue as keyof typeof STATUS_CONFIG]?.label ?? toValue}`;
    case "ASSIGNED":
      return "asignó esta tarea";
    case "COMMENTED":
      return "comentó";
    case "EVIDENCE_UPLOADED":
      return `subió evidencia: ${toValue ?? "archivo"}`;
    case "APPROVAL_REQUESTED":
      return "solicitó aprobación";
    case "APPROVAL_APPROVED":
      return "aprobó la tarea";
    case "APPROVAL_REJECTED":
      return "rechazó la tarea";
    case "DELETED":
      return "eliminó esta tarea";
    default:
      return action.toLowerCase().replace(/_/g, " ");
  }
}

function TaskDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-6 w-96 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
