import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from "@react-email/components";

interface DailyDigestProps {
  userName: string;
  overdueTasks: { id: string; title: string; dueDate: string }[];
  topTasks: { id: string; title: string; priority: string; dueDate: string | null }[];
  pendingApprovals: number;
  yesterdayCompleted: number;
  yesterdayTotal: number;
  appUrl: string;
}

export default function DailyDigest({
  userName = "Juan",
  overdueTasks = [],
  topTasks = [],
  pendingApprovals = 0,
  yesterdayCompleted = 5,
  yesterdayTotal = 6,
  appUrl = "https://nexus.lat",
}: DailyDigestProps) {
  const completionPct =
    yesterdayTotal > 0
      ? Math.round((yesterdayCompleted / yesterdayTotal) * 100)
      : 0;

  return (
    <Html>
      <Head />
      <Preview>
        NEXUS — Tus tareas del día · {overdueTasks.length > 0 ? `⚠️ ${overdueTasks.length} vencida(s)` : "Todo al día ✓"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logo}>NEXUS</Text>
            <Heading style={heading}>Buenos días, {userName} 👋</Heading>
            <Text style={subheading}>
              Aquí tienes tu resumen del día — {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
          </Section>

          {/* Yesterday's achievement */}
          {yesterdayTotal > 0 && (
            <Section style={achievementSection}>
              <Text style={achievementTitle}>📊 Tu resumen de ayer</Text>
              <Text style={achievementText}>
                Completaste {yesterdayCompleted}/{yesterdayTotal} tareas — {completionPct}% ✓
              </Text>
              <div style={progressBarBg}>
                <div
                  style={{
                    ...progressBarFill,
                    width: `${completionPct}%`,
                  }}
                />
              </div>
            </Section>
          )}

          <Hr style={divider} />

          {/* Overdue tasks */}
          {overdueTasks.length > 0 && (
            <Section>
              <Text style={sectionTitle}>⚠️ Tareas vencidas ({overdueTasks.length})</Text>
              {overdueTasks.map((task) => (
                <Section key={task.id} style={taskCard}>
                  <Row>
                    <Column>
                      <Text style={taskTitle}>{task.title}</Text>
                      <Text style={taskMeta}>Venció: {task.dueDate}</Text>
                    </Column>
                    <Column align="right">
                      <Button
                        href={`${appUrl}/tasks/${task.id}`}
                        style={smallButton}
                      >
                        Ver →
                      </Button>
                    </Column>
                  </Row>
                </Section>
              ))}
              <Hr style={divider} />
            </Section>
          )}

          {/* Top 3 priority tasks */}
          <Section>
            <Text style={sectionTitle}>📋 Tus 3 tareas más importantes hoy</Text>
            {topTasks.length === 0 ? (
              <Text style={emptyState}>🎯 No hay tareas pendientes — ¡Todo en orden!</Text>
            ) : (
              topTasks.map((task, i) => (
                <Section key={task.id} style={taskCard}>
                  <Row>
                    <Column style={{ width: "30px" }}>
                      <Text style={taskNumber}>{i + 1}</Text>
                    </Column>
                    <Column>
                      <Text style={taskTitle}>{task.title}</Text>
                      <Text style={taskMeta}>
                        Prioridad: {task.priority} {task.dueDate ? `· Vence: ${task.dueDate}` : ""}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))
            )}
          </Section>

          {/* Pending approvals */}
          {pendingApprovals > 0 && (
            <>
              <Hr style={divider} />
              <Section style={approvalSection}>
                <Text style={sectionTitle}>🔔 Aprobaciones pendientes</Text>
                <Text style={approvalText}>
                  Tienes {pendingApprovals} aprobacion{pendingApprovals > 1 ? "es" : ""} esperando tu revisión
                </Text>
                <Button href={`${appUrl}/approvals`} style={primaryButton}>
                  Ver aprobaciones
                </Button>
              </Section>
            </>
          )}

          <Hr style={divider} />

          {/* CTA */}
          <Section style={{ textAlign: "center" as const, padding: "20px 0" }}>
            <Button href={appUrl} style={primaryButton}>
              Abrir NEXUS
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este es un resumen diario automático de NEXUS.
              Recibes este email porque tienes una cuenta activa.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "560px",
  borderRadius: "12px",
  overflow: "hidden" as const,
};

const headerSection = {
  backgroundColor: "#4f46e5",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700" as const,
  letterSpacing: "4px",
  margin: "0 0 16px",
};

const heading = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: "700" as const,
  margin: "0 0 8px",
};

const subheading = {
  color: "#c7d2fe",
  fontSize: "14px",
  margin: "0",
};

const achievementSection = {
  padding: "20px 24px",
  backgroundColor: "#fefce8",
  borderBottom: "1px solid #fef08a",
};

const achievementTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#713f12",
  margin: "0 0 4px",
};

const achievementText = {
  fontSize: "13px",
  color: "#854d0e",
  margin: "0 0 8px",
};

const progressBarBg = {
  height: "6px",
  backgroundColor: "#fef08a",
  borderRadius: "3px",
  overflow: "hidden" as const,
};

const progressBarFill = {
  height: "6px",
  backgroundColor: "#eab308",
  borderRadius: "3px",
};

const divider = {
  borderColor: "#e4e4e7",
  margin: "0",
};

const sectionTitle = {
  fontSize: "15px",
  fontWeight: "600" as const,
  color: "#18181b",
  margin: "20px 24px 12px",
};

const taskCard = {
  padding: "12px 24px",
  borderBottom: "1px solid #f4f4f5",
};

const taskNumber = {
  fontSize: "14px",
  fontWeight: "700" as const,
  color: "#a1a1aa",
  margin: "0",
};

const taskTitle = {
  fontSize: "14px",
  fontWeight: "500" as const,
  color: "#18181b",
  margin: "0 0 2px",
};

const taskMeta = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0",
};

const emptyState = {
  fontSize: "14px",
  color: "#71717a",
  textAlign: "center" as const,
  padding: "20px 24px",
};

const approvalSection = {
  padding: "0 0 8px",
};

const approvalText = {
  fontSize: "13px",
  color: "#52525b",
  margin: "0 24px 12px",
};

const primaryButton = {
  backgroundColor: "#4f46e5",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block" as const,
  padding: "10px 24px",
};

const smallButton = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  color: "#4f46e5",
  fontSize: "12px",
  fontWeight: "500" as const,
  textDecoration: "none",
  padding: "4px 12px",
};

const footer = {
  padding: "20px 24px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "11px",
  color: "#a1a1aa",
  margin: "0",
};
