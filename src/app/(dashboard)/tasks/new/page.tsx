"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { PRIORITY_CONFIG } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Plus,
  Tag,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import type { Priority } from "@prisma/client";

const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function NewTaskPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [areaId, setAreaId] = useState(session?.user?.areaId ?? "");
  const [departmentId, setDepartmentId] = useState(
    session?.user?.departmentId ?? ""
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const utils = trpc.useUtils();

  const { data: users } = trpc.users.list.useQuery({
    areaId: areaId || undefined,
    limit: 100,
  });

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: (task) => {
      utils.tasks.list.invalidate();
      router.push(`/tasks/${task.id}`);
    },
  });

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !areaId) return;

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      areaId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedToId: assignedToId || undefined,
      departmentId: departmentId || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/tasks"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Nueva tarea
          </h1>
          <p className="text-sm text-zinc-500">
            Completa los detalles de la tarea
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descripción breve de la tarea"
            required
            maxLength={200}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales, instrucciones..."
            rows={4}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        {/* Priority + Due Date row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Prioridad
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((p) => {
                const conf = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      priority === p
                        ? `border-current ${conf?.color ?? ""} ${conf?.bgColor ?? ""}`
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {conf?.label ?? p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              Fecha límite
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <User className="mr-1 inline h-3.5 w-3.5" />
            Asignar a
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Sin asignar</option>
            {users?.users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Tag className="mr-1 inline h-3.5 w-3.5" />
            Etiquetas
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Agregar etiqueta..."
              className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim()}
              className="rounded-lg border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {createTask.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30">
            {createTask.error.message}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <Link
            href="/tasks"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!title.trim() || !areaId || createTask.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {createTask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Crear tarea
          </button>
        </div>
      </form>
    </div>
  );
}
