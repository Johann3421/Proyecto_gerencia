"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { cn, formatRelativeDate, formatDueDate } from "@/lib/utils";
import { STATUS_CONFIG } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";
import {
  ArrowLeft,
  User,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  GitBranch,
  Image,
  FileText,
  Shield,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  useSession();
  const { can } = usePermissions();
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 0" }}>
        <XCircle size={48} color="var(--text-4)" />
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>Tarea no encontrada</p>
        <Link href="/tasks" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
          Volver a tareas
        </Link>
      </div>
    );
  }

  const due = formatDueDate(task.dueDate);
  const pendingApproval = task.approvals.find((a) => a.status === "PENDING");

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate({ taskId: task!.id, status: newStatus as never });
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Extract @mentions (simple userId detection)
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
    <div style={{ paddingBottom: 64, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24, marginTop: 12 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: "50%", background: "var(--surface)",
            border: "1px solid var(--border)", color: "var(--text-2)", transition: "all 0.1s", cursor: "pointer", marginTop: 4
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-alt)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--text-2)"; }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: 11, fontWeight: 600, color: task.area.color, backgroundColor: `${task.area.color}15`, border: `1px solid ${task.area.color}30` }}>
              {task.area.name}
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", margin: "0 0 4px 0", letterSpacing: "-0.4px", lineHeight: 1.3 }}>
            {task.title}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>ID Ticket: #{task.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr", '@media (min-width: 1024px)': { gridTemplateColumns: "1fr 340px" } } as any}>
        
        {/* Left: Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Description */}
          {task.description && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "24px 28px" }}>
              <h2 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                Descripción de la tarea
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-2)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Pending approval banner */}
          {pendingApproval && can("approvals", "resolve") && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--r)", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--warn)" }}>
                <Shield size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Aprobación pendiente obligatoria</span>
              </div>
              {pendingApproval.notes && (
                <p style={{ margin: "12px 0 0 0", fontSize: 14, color: "#92400e" }}>
                  {pendingApproval.notes}
                </p>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => handleApproval("APPROVED")}
                  disabled={resolveApproval.isPending}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 6, background: "var(--ok)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: resolveApproval.isPending ? 0.7 : 1 }}
                >
                  <CheckCircle2 size={16} /> Aprobar
                </button>
                <button
                  onClick={() => handleApproval("REJECTED")}
                  disabled={resolveApproval.isPending}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 6, background: "var(--bad)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: resolveApproval.isPending ? 0.7 : 1 }}
                >
                  <XCircle size={16} /> Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div style={{ borderBottom: "1px solid var(--border)", display: "flex", gap: 24, marginTop: 8 }}>
            <button
              onClick={() => setActiveTab("timeline")}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 4px", background: "none", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                borderBottom: activeTab === "timeline" ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === "timeline" ? "var(--text-1)" : "var(--text-3)",
              }}
            >
              <MessageSquare size={16} /> Timeline ({task.logs.length + task.comments.length})
            </button>
            <button
              onClick={() => setActiveTab("evidence")}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 4px", background: "none", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                borderBottom: activeTab === "evidence" ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === "evidence" ? "var(--text-1)" : "var(--text-3)",
              }}
            >
              <Paperclip size={16} /> Evidencias ({task.evidence.length})
            </button>
          </div>

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 12 }}>
              
              {/* Comment input form */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  U
                </div>
                <form onSubmit={handleSubmitComment} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Dejar un comentario en el ticket..."
                    style={{
                      width: "100%", minHeight: 60, padding: "12px 16px",
                      fontSize: 14, background: "var(--surface)", border: "1px solid var(--border-light)",
                      borderRadius: 8, outline: "none", color: "var(--text-1)", resize: "none",
                      transition: "border-color 0.15s"
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)" }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--border-light)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || addComment.isPending}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "0 20px", height: 36,
                        background: "var(--text-1)", color: "#fff", border: "none", borderRadius: 8,
                        fontSize: 13, fontWeight: 600, cursor: (!commentText.trim() || addComment.isPending) ? "not-allowed" : "pointer",
                        opacity: (!commentText.trim() || addComment.isPending) ? 0.5 : 1
                      }}
                    >
                      <Send size={14} /> Comentar
                    </button>
                  </div>
                </form>
              </div>

              {/* Event logic */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 18 }}>
                {[
                  ...task.logs.map((log) => ({ type: "log" as const, date: new Date(log.createdAt), data: log })),
                  ...task.comments.map((comment) => ({ type: "comment" as const, date: new Date(comment.createdAt), data: comment })),
                ]
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((entry, i, arr) => (
                    <div key={i} style={{ display: "flex", gap: 20, position: "relative", paddingBottom: i === arr.length - 1 ? 0 : 32 }}>
                      {/* Line */}
                      {i !== arr.length - 1 && (
                        <div style={{ position: "absolute", left: 15, top: 32, bottom: -8, width: 2, background: "var(--border-light)" }} />
                      )}
                      
                      {/* Icon */}
                      <div style={{ position: "relative", zIndex: 2 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: entry.type === "comment" ? "var(--surface-alt)" : "var(--surface)", 
                          border: entry.type === "comment" ? "1px solid var(--border)" : "2px solid var(--border-light)",
                          color: entry.type === "comment" ? "var(--text-1)" : "var(--text-3)"
                        }}>
                          {entry.type === "comment" ? (
                            <MessageSquare size={14} />
                          ) : entry.data.action === "STATUS_CHANGED" ? (
                            <Activity size={14} />
                          ) : entry.data.action === "ASSIGNED" ? (
                            <User size={14} />
                          ) : entry.data.action === "EVIDENCE_UPLOADED" ? (
                            <Image size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        {entry.type === "comment" ? (
                          <div style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--text-2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                                {entry.data.author.name.charAt(0)}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                                {entry.data.author.name}
                              </span>
                              <span style={{ fontSize: 12, color: "var(--text-4)" }}>
                                {formatRelativeDate(entry.date)}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                              {entry.data.content}
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-1)" }}>
                                {entry.data.user.name}
                              </span>{" "}
                              {getLogDescription(entry.data.action, entry.data.fromValue, entry.data.toValue)}
                            </p>
                            <span style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 500 }}>
                              {formatRelativeDate(entry.date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {activeTab === "evidence" && (
            <div style={{ paddingTop: 12 }}>
              {task.evidence.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 64, background: "var(--surface-alt)", border: "1px dashed var(--border)", borderRadius: "var(--r)" }}>
                  <Paperclip size={32} color="var(--border)" style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>No se adjuntaron evidencias</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                  {task.evidence.map((ev) => (
                    <a
                      key={ev.id} href={ev.fileUrl} target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration: "none", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.1s" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)" }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)" }}
                    >
                      {ev.fileType.startsWith("image/") ? (
                        <div style={{ width: "100%", height: 140, background: "var(--surface-alt)" }}>
                          <img src={ev.fileUrl} alt={ev.caption ?? ev.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: 140, background: "var(--surface-alt)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={40} color="var(--text-4)" />
                        </div>
                      )}
                      <div style={{ padding: 12 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ev.fileName}
                        </p>
                        {ev.caption && (
                          <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.caption}</p>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Status actions box */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Control de ejecución
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {task.status === "PENDING" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={updateStatus.isPending}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "var(--text-1)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: updateStatus.isPending ? "not-allowed" : "pointer", opacity: updateStatus.isPending ? 0.7 : 1 }}
                >
                  <PlayCircle size={16} /> Iniciar trabajo ahora
                </button>
              )}
              {task.status === "IN_PROGRESS" && (
                <>
                  <button
                    onClick={() => handleStatusChange("AWAITING_REVIEW")}
                    disabled={updateStatus.isPending}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "var(--ok)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: updateStatus.isPending ? "not-allowed" : "pointer", opacity: updateStatus.isPending ? 0.7 : 1 }}
                  >
                    <CheckCircle2 size={16} /> Enviar a revisión
                  </button>
                  <button
                    onClick={() => handleStatusChange("BLOCKED")}
                    disabled={updateStatus.isPending}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--bad)", color: "var(--bad)", fontSize: 13, fontWeight: 600, cursor: updateStatus.isPending ? "not-allowed" : "pointer", opacity: updateStatus.isPending ? 0.7 : 1 }}
                  >
                    <XCircle size={16} /> Reportar bloqueo
                  </button>
                </>
              )}
              {task.status === "APPROVED" && (
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={updateStatus.isPending}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: updateStatus.isPending ? "not-allowed" : "pointer", opacity: updateStatus.isPending ? 0.7 : 1 }}
                >
                  <CheckCircle2 size={16} /> Cerrar ticket (Completar)
                </button>
              )}
              {task.status === "REJECTED" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={updateStatus.isPending}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "var(--warn)", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: updateStatus.isPending ? "not-allowed" : "pointer", opacity: updateStatus.isPending ? 0.7 : 1 }}
                >
                  <PlayCircle size={16} /> Reiniciar por rechazo
                </button>
              )}
              {task.status === "COMPLETED" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "var(--ok)", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Ticket 100% finalizado
                </div>
              )}
            </div>
          </div>

          {/* Properties box */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Propiedades
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Responsable</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
                  {task.assignedTo?.name ?? "Sin asignar"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Solicitante</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
                  {task.createdBy.name}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Segmento</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: task.area.color }}>
                  {task.area.name}
                </span>
              </div>
              {task.department && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "var(--text-3)" }}>Departamento</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
                    {task.department.name}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Vencimiento</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: due.isOverdue ? "var(--bad)" : due.isUrgent ? "var(--warn)" : "var(--text-1)" }}>
                  {due.text}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>Aperturado</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)" }}>
                  {formatRelativeDate(task.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Subtasks box */}
          {task.subtasks.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20 }}>
              <h3 style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                <GitBranch size={14} /> Sub-tareas ({task.subtasks.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {task.subtasks.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/tasks/${sub.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none",
                      padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8, transition: "background 0.1s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-alt)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sub.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags box */}
          {task.tags.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20 }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Etiquetas
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30`
                    }}
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
      <div className="nexus-skeleton" style={{ width: 192, height: 32 }} />
      <div className="nexus-skeleton" style={{ width: 384, height: 24 }} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="nexus-skeleton" style={{ height: 128, borderRadius: "var(--radius-lg)" }} />
          <div className="nexus-skeleton" style={{ height: 256, borderRadius: "var(--radius-lg)" }} />
        </div>
        <div className="space-y-4">
          <div className="nexus-skeleton" style={{ height: 192, borderRadius: "var(--radius-lg)" }} />
          <div className="nexus-skeleton" style={{ height: 192, borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    </div>
  );
}
