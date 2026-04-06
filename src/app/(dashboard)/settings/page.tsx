"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { ROLE_LABELS } from "@/types";
import { User, Mail, Shield, Save, Loader2, Camera } from "lucide-react";
import type { RoleType } from "@prisma/client";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { data: me } = trpc.users.me.useQuery();

  const [name, setName] = useState(me?.name ?? session?.user?.name ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      updateSession();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
  }

  const role = session?.user?.role as RoleType | undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Configuración
        </h1>
        <p className="text-sm text-zinc-500">Tu perfil y preferencias</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Perfil
        </h2>

        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            {me?.avatar ? (
              <img
                src={me.avatar}
                alt={me.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                {(me?.name ?? session?.user?.name ?? "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">
              {me?.name ?? session?.user?.name}
            </p>
            <p className="text-sm text-zinc-500">
              {me?.email ?? session?.user?.email}
            </p>
            {role && (
              <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              value={me?.email ?? session?.user?.email ?? ""}
              disabled
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+51 999 999 999"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {updateProfile.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30">
              {updateProfile.error.message}
            </div>
          )}

          {updateProfile.isSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30">
              Perfil actualizado correctamente
            </div>
          )}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Información del sistema
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Área</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {me?.area?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Departamento</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {me?.department?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Rol</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {role ? ROLE_LABELS[role] : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Estado</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
