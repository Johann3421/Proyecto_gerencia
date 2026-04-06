"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { ROLE_LABELS } from "@/types";
import {
  Users,
  Search,
  ChevronDown,
  Mail,
  Shield,
  Loader2,
  UserCircle,
} from "lucide-react";
import type { RoleType } from "@prisma/client";

const ROLE_OPTIONS: RoleType[] = [
  "SUPER_ADMIN",
  "ADMIN_AREA",
  "SUPERVISOR",
  "OPERARIO",
  "AUDITOR",
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  ADMIN_AREA: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  SUPERVISOR: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  OPERARIO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  AUDITOR: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleType | "">("");

  const { data, isLoading } = trpc.users.list.useQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    limit: 100,
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Equipo
        </h1>
        <p className="text-sm text-zinc-500">
          {data?.pagination?.total ?? 0} miembros del equipo
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleType | "")}
            className="h-10 appearance-none rounded-xl border border-zinc-200 bg-white px-4 pr-8 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Todos los roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <Users className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="font-medium text-zinc-600 dark:text-zinc-400">
            No se encontraron miembros
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    {user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-zinc-900 dark:text-white">
                    {user.name}
                  </h3>
                  <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    ROLE_COLORS[user.role] ?? "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {ROLE_LABELS[user.role as RoleType] ?? user.role}
                </span>
                {user.area && (
                  <span className="truncate rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {user.area.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
