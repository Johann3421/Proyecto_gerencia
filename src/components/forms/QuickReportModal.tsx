"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Package,
  Wrench,
  Ban,
  AlertTriangle,
  HelpCircle,
  Camera,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const REPORT_TYPES = [
  { value: "stock_shortage", label: "Falta de stock", icon: Package, color: "text-amber-500 bg-amber-50" },
  { value: "damaged_equipment", label: "Equipo dañado", icon: Wrench, color: "text-red-500 bg-red-50" },
  { value: "blocked_process", label: "Proceso bloqueado", icon: Ban, color: "text-orange-500 bg-orange-50" },
  { value: "accident", label: "Accidente", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  { value: "other", label: "Otro", icon: HelpCircle, color: "text-zinc-500 bg-zinc-50" },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["value"];

export function QuickReportModal() {
  const { data: session } = useSession();
  const { setQuickReportModalOpen } = useUIStore();
  const utils = trpc.useUtils();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ReportType | null>(null);
  const [details, setDetails] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const quickReport = trpc.tasks.quickReport.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.tasks.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const selectedType = REPORT_TYPES.find((t) => t.value === type);

  function handleSubmit() {
    if (!type || !details.trim() || !session?.user) return;

    quickReport.mutate({
      type,
      details,
      photoUrl: photoUrl || undefined,
      areaId: session.user.areaId ?? "",
      departmentId: session.user.departmentId ?? undefined,
    });
  }

  function handleClose() {
    setQuickReportModalOpen(false);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 top-auto z-50 mx-auto max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Reportar problema
            </h2>
            {!submitted && (
              <p className="text-xs text-zinc-500">Paso {step} de 3</p>
            )}
          </div>
          <button onClick={handleClose} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="flex gap-1 px-5 pt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
                )}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {submitted ? (
            <SuccessState onClose={handleClose} />
          ) : step === 1 ? (
            <Step1 type={type} onSelect={(t) => { setType(t); setStep(2); }} />
          ) : step === 2 ? (
            <Step2
              details={details}
              setDetails={setDetails}
              photoUrl={photoUrl}
              setPhotoUrl={setPhotoUrl}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          ) : (
            <Step3
              selectedType={selectedType}
              details={details}
              photoUrl={photoUrl}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              isLoading={quickReport.isPending}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Step 1: Type selection ──────────────────────────

function Step1({ type, onSelect }: { type: ReportType | null; onSelect: (t: ReportType) => void }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        ¿Qué ocurrió?
      </h3>
      <div className="space-y-2">
        {REPORT_TYPES.map((rt) => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.value}
              onClick={() => onSelect(rt.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all hover:border-indigo-300 hover:shadow-sm",
                type === rt.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-zinc-200 dark:border-zinc-700"
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", rt.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {rt.label}
              </span>
              <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Details ─────────────────────────────────

function Step2({
  details,
  setDetails,
  photoUrl,
  setPhotoUrl,
  onBack,
  onNext,
}: {
  details: string;
  setDetails: (v: string) => void;
  photoUrl: string;
  setPhotoUrl: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Describe el problema
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Ej: Sin papel bond A4 para impresión..."
          rows={4}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-[10px] text-zinc-400">
          Mínimo 10 caracteres ({details.length}/2000)
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Foto (opcional)
        </label>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 p-6 text-sm text-zinc-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700"
        >
          <Camera className="h-5 w-5" />
          Tomar foto o seleccionar imagen
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={details.trim().length < 10}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirm ─────────────────────────────────

function Step3({
  selectedType,
  details,
  photoUrl,
  onBack,
  onSubmit,
  isLoading,
}: {
  selectedType: (typeof REPORT_TYPES)[number] | undefined;
  details: string;
  photoUrl: string;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Confirmar reporte
      </h3>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500">Tipo:</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {selectedType?.label}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-zinc-500">Detalle:</span>
          <p className="mt-1 text-zinc-800 dark:text-zinc-200">{details}</p>
        </div>
        {photoUrl && (
          <div className="text-sm">
            <span className="text-zinc-500">📷 Foto adjunta</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Enviar reporte
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Success state ───────────────────────────────────

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
        ¡Reporte enviado!
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Tu reporte fue enviado. Te notificaremos cuando sea atendido.
      </p>
      <button
        onClick={onClose}
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Cerrar
      </button>
    </div>
  );
}
