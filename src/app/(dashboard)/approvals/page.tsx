"use client";

import { trpc } from "@/lib/trpc-client";
import { useSession } from "next-auth/react";
import {
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const { data: session } = useSession();

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    status: "AWAITING_REVIEW",
    limit: 50,
  });

  const pendingTasks = tasks?.tasks ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Aprobaciones
        </h1>
        <p className="text-sm text-zinc-500">
          {pendingTasks.length} tareas esperando revisión
        </p>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
          <p className="font-medium text-zinc-600 dark:text-zinc-400">
            No hay aprobaciones pendientes
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Las solicitudes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                  >
                    {task.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {task.assignedTo && (
                      <span className="flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                          {task.assignedTo.name?.[0]}
                        </span>
                        {task.assignedTo.name}
                      </span>
                    )}
                    {task.area && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                        {task.area.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(new Date(task.dueDate))}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-400">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
