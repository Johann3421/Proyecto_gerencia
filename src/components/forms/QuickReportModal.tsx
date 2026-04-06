"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { useUIStore } from "@/store/ui-store";
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
  { value: "stock_shortage", label: "Falta de stock", icon: Package, color: "var(--warning)", bg: "var(--warning-bg)" },
  { value: "damaged_equipment", label: "Equipo dañado", icon: Wrench, color: "var(--danger)", bg: "var(--danger-bg)" },
  { value: "blocked_process", label: "Proceso bloqueado", icon: Ban, color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
  { value: "accident", label: "Accidente", icon: AlertTriangle, color: "var(--danger)", bg: "var(--danger-bg)" },
  { value: "other", label: "Otro", icon: HelpCircle, color: "var(--text-secondary)", bg: "rgba(144,144,168,0.08)" },
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
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 bottom-4 top-auto z-50 mx-auto max-w-lg lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
              Reportar problema
            </h2>
            {!submitted && (
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Paso {step} de 3</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="flex gap-1 px-5 pt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: "100px",
                  background: s <= step ? "#4f46e5" : "var(--bg-elevated)",
                  transition: "background 0.2s",
                }}
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
      <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
        ¿Qué ocurrió?
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REPORT_TYPES.map((rt) => {
          const Icon = rt.icon;
          const isSelected = type === rt.value;
          return (
            <button
              key={rt.value}
              onClick={() => onSelect(rt.value)}
              className="flex w-full items-center gap-3 text-left"
              style={{
                padding: 16,
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${isSelected ? "#818cf8" : "var(--border-default)"}`,
                background: isSelected ? "rgba(99,102,241,0.08)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: rt.bg,
                  color: rt.color,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                {rt.label}
              </span>
              <ChevronRight className="ml-auto h-4 w-4" style={{ color: "var(--text-muted)" }} />
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
          Describe el problema
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Ej: Sin papel bond A4 para impresión..."
          rows={4}
          style={{
            width: "100%",
            resize: "none",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            padding: "10px 14px",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#818cf8";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(129,140,248,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-default)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <p style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>
          Mínimo 10 caracteres ({details.length}/2000)
        </p>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
          Foto (opcional)
        </label>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2"
          style={{
            border: "2px dashed var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            fontSize: 14,
            color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
        >
          <Camera className="h-5 w-5" />
          Tomar foto o seleccionar imagen
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1"
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={details.trim().length < 10}
          className="flex flex-1 items-center justify-center gap-1"
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            background: "#4f46e5",
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            opacity: details.trim().length < 10 ? 0.5 : 1,
          }}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
        Confirmar reporte
      </h3>

      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="flex items-center gap-2" style={{ fontSize: 14 }}>
          <span style={{ color: "var(--text-muted)" }}>Tipo:</span>
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            {selectedType?.label}
          </span>
        </div>
        <div style={{ fontSize: 14 }}>
          <span style={{ color: "var(--text-muted)" }}>Detalle:</span>
          <p style={{ marginTop: 4, color: "var(--text-primary)" }}>{details}</p>
        </div>
        {photoUrl && (
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            📷 Foto adjunta
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-1"
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            fontSize: 14,
            fontWeight: 500,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-1"
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            background: "#4f46e5",
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            opacity: isLoading ? 0.5 : 1,
          }}
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
      <div
        className="flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          borderRadius: "100%",
          background: "var(--success-bg)",
        }}
      >
        <CheckCircle2 size={32} style={{ color: "var(--success)" }} />
      </div>
      <h3 style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
        ¡Reporte enviado!
      </h3>
      <p style={{ marginTop: 4, fontSize: 14, color: "var(--text-muted)" }}>
        Tu reporte fue enviado. Te notificaremos cuando sea atendido.
      </p>
      <button
        onClick={onClose}
        style={{
          marginTop: 24,
          padding: "10px 24px",
          borderRadius: "var(--radius-md)",
          background: "#4f46e5",
          color: "white",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        Cerrar
      </button>
    </div>
  );
}
