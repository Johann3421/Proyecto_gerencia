import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string;
}

/**
 * Create a single notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      taskId: params.taskId ?? null,
    },
  });
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createBulkNotifications(
  notifications: CreateNotificationParams[]
) {
  return db.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      taskId: n.taskId ?? null,
    })),
  });
}

/**
 * Notify all supervisors of a given area/department about a new task
 */
export async function notifySupervisors(
  areaId: string,
  departmentId: string | null,
  taskId: string,
  title: string,
  body: string
) {
  const where: Record<string, unknown> = {
    role: "SUPERVISOR",
    areaId,
    isActive: true,
    deletedAt: null,
  };
  if (departmentId) {
    where.departmentId = departmentId;
  }

  const supervisors = await db.user.findMany({
    where,
    select: { id: true },
  });

  if (supervisors.length === 0) return;

  return createBulkNotifications(
    supervisors.map((s) => ({
      userId: s.id,
      type: "APPROVAL_REQUESTED" as NotificationType,
      title,
      body,
      taskId,
    }))
  );
}

/**
 * Notify the assigned user about a task event
 */
export async function notifyAssignee(
  assigneeId: string,
  type: NotificationType,
  title: string,
  body: string,
  taskId: string
) {
  return createNotification({
    userId: assigneeId,
    type,
    title,
    body,
    taskId,
  });
}

/**
 * Create a task audit log entry
 */
export async function createTaskLog(
  taskId: string,
  userId: string,
  action: string,
  fromValue?: string,
  toValue?: string,
  metadata?: Record<string, string | number | boolean | null>
) {
  return db.taskLog.create({
    data: {
      taskId,
      userId,
      action,
      fromValue: fromValue ?? null,
      toValue: toValue ?? null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

/**
 * Notify users mentioned in a comment with @
 */
export async function notifyMentions(
  mentionedUserIds: string[],
  authorName: string,
  taskId: string,
  taskTitle: string
) {
  if (mentionedUserIds.length === 0) return;

  return createBulkNotifications(
    mentionedUserIds.map((userId) => ({
      userId,
      type: "COMMENT_MENTION" as NotificationType,
      title: `${authorName} te mencionó en un comentario`,
      body: `En la tarea: ${taskTitle}`,
      taskId,
    }))
  );
}

/**
 * Notify chain for approval resolution (approved/rejected)
 */
export async function notifyApprovalChain(
  taskId: string,
  taskTitle: string,
  status: "APPROVED" | "REJECTED",
  resolverName: string,
  involvedUserIds: string[]
) {
  const type = status === "APPROVED" ? "TASK_APPROVED" : "TASK_REJECTED";
  const statusText = status === "APPROVED" ? "aprobada" : "rechazada";

  return createBulkNotifications(
    involvedUserIds.map((userId) => ({
      userId,
      type: type as NotificationType,
      title: `Tarea ${statusText}: ${taskTitle}`,
      body: `${resolverName} ${status === "APPROVED" ? "aprobó" : "rechazó"} la tarea`,
      taskId,
    }))
  );
}
