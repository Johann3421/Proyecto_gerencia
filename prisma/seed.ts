import { PrismaClient, RoleType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const AREAS_DATA = [
  {
    name: "Administración",
    slug: "administracion",
    icon: "building-2",
    color: "#6366f1",
    description: "Gestión administrativa, finanzas y recursos humanos",
    departments: [
      { name: "Finanzas", slug: "finanzas" },
      { name: "Contabilidad", slug: "contabilidad" },
      { name: "Recursos Humanos", slug: "recursos-humanos" },
      { name: "Asuntos Legales", slug: "asuntos-legales" },
      { name: "Tesorería", slug: "tesoreria" },
    ],
  },
  {
    name: "Tecnología",
    slug: "tecnologia",
    icon: "cpu",
    color: "#0ea5e9",
    description: "Soporte técnico, desarrollo y mantenimiento de sistemas",
    departments: [
      { name: "Soporte Técnico", slug: "soporte-tecnico" },
      { name: "Servicio Post-Venta", slug: "servicio-post-venta" },
      { name: "Desarrollo de Software", slug: "desarrollo-software" },
      { name: "Infraestructura", slug: "infraestructura" },
    ],
  },
  {
    name: "Comercial",
    slug: "comercial",
    icon: "trending-up",
    color: "#10b981",
    description: "Ventas, marketing y atención al cliente",
    departments: [
      { name: "Ventas", slug: "ventas" },
      { name: "Marketing", slug: "marketing" },
      { name: "Atención al Cliente", slug: "atencion-cliente" },
      { name: "Comercio Electrónico", slug: "comercio-electronico" },
    ],
  },
  {
    name: "Logística",
    slug: "logistica",
    icon: "package",
    color: "#f59e0b",
    description: "Compras, almacén, inventarios y distribución",
    departments: [
      { name: "Compras", slug: "compras" },
      { name: "Almacén", slug: "almacen" },
      { name: "Inventarios", slug: "inventarios" },
      { name: "Distribución/Transporte", slug: "distribucion-transporte" },
      { name: "Mantenimiento", slug: "mantenimiento" },
    ],
  },
  {
    name: "Producción",
    slug: "produccion",
    icon: "factory",
    color: "#ef4444",
    description: "Fabricación, ensamblaje y control de calidad",
    departments: [
      { name: "Fabricación/Ensamblaje", slug: "fabricacion-ensamblaje" },
      { name: "Control de Calidad", slug: "control-calidad" },
      { name: "Ingeniería de Hardware", slug: "ingenieria-hardware" },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.taskLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.areaKPI.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.area.deleteMany();
  await prisma.tag.deleteMany();

  console.log("📦 Creating areas and departments...");

  const createdAreas: Record<string, { id: string; departments: Record<string, string> }> = {};

  for (const areaData of AREAS_DATA) {
    const area = await prisma.area.create({
      data: {
        name: areaData.name,
        slug: areaData.slug,
        icon: areaData.icon,
        color: areaData.color,
        description: areaData.description,
      },
    });

    const deptMap: Record<string, string> = {};
    for (const dept of areaData.departments) {
      const created = await prisma.department.create({
        data: {
          name: dept.name,
          slug: dept.slug,
          areaId: area.id,
        },
      });
      deptMap[dept.slug] = created.id;
    }

    createdAreas[areaData.slug] = { id: area.id, departments: deptMap };
    console.log(`  ✅ ${areaData.name} (${Object.keys(deptMap).length} departamentos)`);
  }

  console.log("\n👥 Creating test users...");

  const passwordHash = await bcrypt.hash("nexus2024", 12);

  // SUPER_ADMIN — acceso global
  const superAdmin = await prisma.user.create({
    data: {
      name: "Carlos Mendoza",
      email: "admin@nexus.lat",
      passwordHash,
      role: RoleType.SUPER_ADMIN,
      avatar: null,
    },
  });
  console.log(`  ✅ SUPER_ADMIN: ${superAdmin.email}`);

  // ADMIN_AREA — Logística
  const adminArea = await prisma.user.create({
    data: {
      name: "María García",
      email: "maria.garcia@nexus.lat",
      passwordHash,
      role: RoleType.ADMIN_AREA,
      areaId: createdAreas["logistica"].id,
    },
  });
  console.log(`  ✅ ADMIN_AREA (Logística): ${adminArea.email}`);

  // SUPERVISOR — Logística > Almacén
  const supervisor = await prisma.user.create({
    data: {
      name: "Roberto Sánchez",
      email: "roberto.sanchez@nexus.lat",
      passwordHash,
      role: RoleType.SUPERVISOR,
      areaId: createdAreas["logistica"].id,
      departmentId: createdAreas["logistica"].departments["almacen"],
    },
  });
  console.log(`  ✅ SUPERVISOR (Logística/Almacén): ${supervisor.email}`);

  // OPERARIO — Logística > Almacén
  const operarioAlmacen = await prisma.user.create({
    data: {
      name: "Juan Pérez",
      email: "juan.perez@nexus.lat",
      passwordHash,
      role: RoleType.OPERARIO,
      areaId: createdAreas["logistica"].id,
      departmentId: createdAreas["logistica"].departments["almacen"],
    },
  });
  console.log(`  ✅ OPERARIO (Logística/Almacén): ${operarioAlmacen.email}`);

  // OPERARIO — Logística > Compras
  const operarioCompras = await prisma.user.create({
    data: {
      name: "Ana Torres",
      email: "ana.torres@nexus.lat",
      passwordHash,
      role: RoleType.OPERARIO,
      areaId: createdAreas["logistica"].id,
      departmentId: createdAreas["logistica"].departments["compras"],
    },
  });
  console.log(`  ✅ OPERARIO (Logística/Compras): ${operarioCompras.email}`);

  // AUDITOR — acceso global
  const auditor = await prisma.user.create({
    data: {
      name: "Patricia Flores",
      email: "patricia.flores@nexus.lat",
      passwordHash,
      role: RoleType.AUDITOR,
    },
  });
  console.log(`  ✅ AUDITOR: ${auditor.email}`);

  // Additional users for other areas
  const adminTech = await prisma.user.create({
    data: {
      name: "Luis Ramírez",
      email: "luis.ramirez@nexus.lat",
      passwordHash,
      role: RoleType.ADMIN_AREA,
      areaId: createdAreas["tecnologia"].id,
    },
  });
  console.log(`  ✅ ADMIN_AREA (Tecnología): ${adminTech.email}`);

  const supervisorTech = await prisma.user.create({
    data: {
      name: "Diana López",
      email: "diana.lopez@nexus.lat",
      passwordHash,
      role: RoleType.SUPERVISOR,
      areaId: createdAreas["tecnologia"].id,
      departmentId: createdAreas["tecnologia"].departments["soporte-tecnico"],
    },
  });
  console.log(`  ✅ SUPERVISOR (Tecnología/Soporte): ${supervisorTech.email}`);

  console.log("\n🏷️ Creating tags...");

  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "Urgente", color: "#ef4444" } }),
    prisma.tag.create({ data: { name: "Compras", color: "#f59e0b" } }),
    prisma.tag.create({ data: { name: "Mantenimiento", color: "#6366f1" } }),
    prisma.tag.create({ data: { name: "Inventario", color: "#10b981" } }),
    prisma.tag.create({ data: { name: "Documentación", color: "#8b5cf6" } }),
    prisma.tag.create({ data: { name: "Capacitación", color: "#0ea5e9" } }),
  ]);
  console.log(`  ✅ ${tags.length} tags creados`);

  console.log("\n📋 Creating sample tasks...");

  // Sample flow: Stock report
  const stockTask = await prisma.task.create({
    data: {
      title: "Falta de stock: Papel bond A4",
      description: "Sin papel bond A4 para impresión. Estante vacío en almacén principal.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      areaId: createdAreas["logistica"].id,
      departmentId: createdAreas["logistica"].departments["almacen"],
      assignedToId: operarioCompras.id,
      createdById: operarioAlmacen.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      tags: { connect: [{ id: tags[1].id }, { id: tags[3].id }] },
    },
  });

  await prisma.taskLog.createMany({
    data: [
      {
        taskId: stockTask.id,
        userId: operarioAlmacen.id,
        action: "CREATED",
        toValue: "PENDING",
      },
      {
        taskId: stockTask.id,
        userId: supervisor.id,
        action: "STATUS_CHANGED",
        fromValue: "PENDING",
        toValue: "IN_PROGRESS",
      },
      {
        taskId: stockTask.id,
        userId: supervisor.id,
        action: "ASSIGNED",
        toValue: operarioCompras.id,
      },
    ],
  });

  await prisma.comment.create({
    data: {
      taskId: stockTask.id,
      authorId: supervisor.id,
      content: "Proceder con compra urgente, máximo S/500. @Ana Torres por favor gestionar con proveedor habitual.",
      mentions: [operarioCompras.id],
    },
  });

  console.log("  ✅ Tarea de stock con flujo de ejemplo");

  // More sample tasks
  const sampleTasks = [
    {
      title: "Actualizar inventario de mes",
      description: "Realizar conteo físico de productos en almacén",
      priority: "MEDIUM" as const,
      status: "PENDING" as const,
      areaId: createdAreas["logistica"].id,
      departmentId: createdAreas["logistica"].departments["inventarios"],
      createdById: supervisor.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Mantenimiento preventivo servidor principal",
      description: "Limpieza, actualización de firmware y verificación de backups",
      priority: "HIGH" as const,
      status: "PENDING" as const,
      areaId: createdAreas["tecnologia"].id,
      departmentId: createdAreas["tecnologia"].departments["infraestructura"],
      createdById: adminTech.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Revisar equipo dañado en línea 2",
      description: "La máquina ensambladora presenta fallas intermitentes",
      priority: "CRITICAL" as const,
      status: "BLOCKED" as const,
      areaId: createdAreas["produccion"].id,
      departmentId: createdAreas["produccion"].departments["fabricacion-ensamblaje"],
      createdById: superAdmin.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Capacitación nuevo personal de ventas",
      description: "Onboarding de 3 nuevos asesores comerciales",
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      areaId: createdAreas["comercial"].id,
      departmentId: createdAreas["comercial"].departments["ventas"],
      createdById: superAdmin.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Cierre contable del mes",
      description: "Conciliación bancaria y preparación de estados financieros",
      priority: "HIGH" as const,
      status: "AWAITING_REVIEW" as const,
      areaId: createdAreas["administracion"].id,
      departmentId: createdAreas["administracion"].departments["contabilidad"],
      createdById: superAdmin.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const taskData of sampleTasks) {
    await prisma.task.create({ data: taskData });
  }
  console.log(`  ✅ ${sampleTasks.length + 1} tareas de ejemplo creadas`);

  console.log("\n📊 Creating sample KPIs...");

  const currentPeriod = new Date().toISOString().slice(0, 7);
  for (const [slug, areaInfo] of Object.entries(createdAreas)) {
    await prisma.areaKPI.create({
      data: {
        areaId: areaInfo.id,
        period: currentPeriod,
        totalTasks: Math.floor(Math.random() * 30) + 10,
        completed: Math.floor(Math.random() * 20) + 5,
        overdue: Math.floor(Math.random() * 5),
        avgHours: parseFloat((Math.random() * 8 + 2).toFixed(1)),
      },
    });
  }
  console.log("  ✅ KPIs de ejemplo creados");

  console.log("\n🔔 Creating sample notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: supervisor.id,
        type: "TASK_ASSIGNED",
        title: "Nuevo reporte: Falta de stock en Almacén",
        body: "Juan Pérez reportó falta de papel bond A4",
        taskId: stockTask.id,
      },
      {
        userId: operarioCompras.id,
        type: "TASK_ASSIGNED",
        title: "Te asignaron una tarea urgente",
        body: "Falta de stock: Papel bond A4 — Proceder con compra",
        taskId: stockTask.id,
      },
      {
        userId: adminArea.id,
        type: "APPROVAL_REQUESTED",
        title: "Aprobación pendiente",
        body: "Roberto Sánchez solicita aprobación de compra por S/480",
        taskId: stockTask.id,
      },
    ],
  });
  console.log("  ✅ Notificaciones de ejemplo creadas");

  console.log("\n✨ Seed completed successfully!");
  console.log("\n📝 Test credentials (all users):");
  console.log("   Password: nexus2024");
  console.log("\n   Emails:");
  console.log("   - admin@nexus.lat (SUPER_ADMIN)");
  console.log("   - maria.garcia@nexus.lat (ADMIN_AREA - Logística)");
  console.log("   - roberto.sanchez@nexus.lat (SUPERVISOR - Almacén)");
  console.log("   - juan.perez@nexus.lat (OPERARIO - Almacén)");
  console.log("   - ana.torres@nexus.lat (OPERARIO - Compras)");
  console.log("   - patricia.flores@nexus.lat (AUDITOR)");
  console.log("   - luis.ramirez@nexus.lat (ADMIN_AREA - Tecnología)");
  console.log("   - diana.lopez@nexus.lat (SUPERVISOR - Soporte)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
