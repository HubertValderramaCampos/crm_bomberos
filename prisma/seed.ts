// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const dbPath = path.resolve(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔥 Iniciando seed de datos - CIA. B. V. Puente Piedra...");

  // ─── LIMPIEZA (para re-ejecución segura) ─────────────────────────────────────
  await prisma.guardiaBombero.deleteMany();
  await prisma.guardia.deleteMany();
  await prisma.emergenciaBombero.deleteMany();
  await prisma.emergenciaVehiculo.deleteMany();
  await prisma.emergencia.deleteMany();
  await prisma.evaluacionSalud.deleteMany();
  await prisma.fichaMedica.deleteMany();
  await prisma.itemBotiquin.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.certificacion.deleteMany();
  await prisma.itemInventario.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.comunicado.deleteMany();
  await prisma.evento.deleteMany();

  // ─── USUARIOS ────────────────────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "jefe@cbpp.pe" },
      update: {},
      create: { email: "jefe@cbpp.pe", password: hash("bomberos2026"), rol: "JEFE_COMPANIA" },
    }),
    prisma.user.upsert({
      where: { email: "admin@cbpp.pe" },
      update: {},
      create: { email: "admin@cbpp.pe", password: hash("bomberos2026"), rol: "ADMINISTRACION" },
    }),
    prisma.user.upsert({
      where: { email: "ssgenerales@cbpp.pe" },
      update: {},
      create: { email: "ssgenerales@cbpp.pe", password: hash("bomberos2026"), rol: "SERVICIOS_GENERALES" },
    }),
    prisma.user.upsert({
      where: { email: "instruccion@cbpp.pe" },
      update: {},
      create: { email: "instruccion@cbpp.pe", password: hash("bomberos2026"), rol: "INSTRUCCION" },
    }),
    prisma.user.upsert({
      where: { email: "sanidad@cbpp.pe" },
      update: {},
      create: { email: "sanidad@cbpp.pe", password: hash("bomberos2026"), rol: "SANIDAD" },
    }),
    prisma.user.upsert({
      where: { email: "operaciones@cbpp.pe" },
      update: {},
      create: { email: "operaciones@cbpp.pe", password: hash("bomberos2026"), rol: "OPERACIONES" },
    }),
    prisma.user.upsert({
      where: { email: "imagen@cbpp.pe" },
      update: {},
      create: { email: "imagen@cbpp.pe", password: hash("bomberos2026"), rol: "IMAGEN" },
    }),
  ]);

  console.log("✅ Usuarios creados:", users.length);

  // ─── BOMBEROS ────────────────────────────────────────────────────────────────
  const bomberosData = [
    { cip: "PP-0001", dni: "41234567", nombres: "Christian Pool", apellidos: "Zamudio Lara", grado: "CORONEL", areaPrincipal: "JEFE_COMPANIA", userId: users[0].id, telefono: "987654321", grupoSanguineo: "O+", fechaIngreso: new Date("2005-03-15"), fechaNacimiento: new Date("1975-06-20") },
    { cip: "PP-0012", dni: "42345678", nombres: "María Elena", apellidos: "Torres Huanca", grado: "MAYOR", areaPrincipal: "ADMINISTRACION", userId: users[1].id, telefono: "976543210", grupoSanguineo: "A+", fechaIngreso: new Date("2010-01-10"), fechaNacimiento: new Date("1980-03-15") },
    { cip: "PP-0023", dni: "43456789", nombres: "Jorge Luis", apellidos: "Flores Condori", grado: "CAPITAN", areaPrincipal: "SERVICIOS_GENERALES", userId: users[2].id, telefono: "965432109", grupoSanguineo: "B+", fechaIngreso: new Date("2012-05-20"), fechaNacimiento: new Date("1982-09-10") },
    { cip: "PP-0034", dni: "44567890", nombres: "Ana Lucía", apellidos: "Vargas Chipana", grado: "TENIENTE", areaPrincipal: "INSTRUCCION", userId: users[3].id, telefono: "954321098", grupoSanguineo: "O-", fechaIngreso: new Date("2014-08-05"), fechaNacimiento: new Date("1985-12-25") },
    { cip: "PP-0045", dni: "45678901", nombres: "Roberto César", apellidos: "Paredes Ccoa", grado: "ALFEREZ", areaPrincipal: "SANIDAD", userId: users[4].id, telefono: "943210987", grupoSanguineo: "A-", fechaIngreso: new Date("2016-02-28"), fechaNacimiento: new Date("1988-07-14") },
    { cip: "PP-0056", dni: "46789012", nombres: "Luis Miguel", apellidos: "Sánchez Puma", grado: "SARGENTO_PRIMERO", areaPrincipal: "OPERACIONES", userId: users[5].id, telefono: "932109876", grupoSanguineo: "AB+", fechaIngreso: new Date("2013-11-12"), fechaNacimiento: new Date("1983-04-02") },
    { cip: "PP-0067", dni: "47890123", nombres: "Diana Carolina", apellidos: "Ramos Apaza", grado: "TENIENTE", areaPrincipal: "IMAGEN", userId: users[6].id, telefono: "921098765", grupoSanguineo: "B-", fechaIngreso: new Date("2015-06-18"), fechaNacimiento: new Date("1987-11-30") },
    { cip: "PP-0078", dni: "48901234", nombres: "Pedro Ángel", apellidos: "Castillo Huancho", grado: "SARGENTO_SEGUNDO", areaPrincipal: "OPERACIONES", telefono: "910987654", grupoSanguineo: "O+", fechaIngreso: new Date("2018-03-25"), fechaNacimiento: new Date("1990-08-17") },
    { cip: "PP-0089", dni: "49012345", nombres: "Rosa Maribel", apellidos: "López Ticona", grado: "CABO", areaPrincipal: "INSTRUCCION", telefono: "909876543", grupoSanguineo: "A+", fechaIngreso: new Date("2019-07-10"), fechaNacimiento: new Date("1992-02-28") },
    { cip: "PP-0090", dni: "40123456", nombres: "Andrés Felipe", apellidos: "Mamani Coila", grado: "BOMBERO_PRIMERO", areaPrincipal: "OPERACIONES", telefono: "898765432", grupoSanguineo: "O+", fechaIngreso: new Date("2020-01-15"), fechaNacimiento: new Date("1994-05-11") },
    { cip: "PP-0101", dni: "41234568", nombres: "Claudia Beatriz", apellidos: "Gutierrez Chura", grado: "BOMBERO_RASO", areaPrincipal: "SANIDAD", telefono: "887654321", grupoSanguineo: "B+", fechaIngreso: new Date("2022-04-20"), fechaNacimiento: new Date("1998-09-05") },
    { cip: "PP-0112", dni: "42345679", nombres: "Marcos Antonio", apellidos: "Rojas Quispe", grado: "SARGENTO_PRIMERO", areaPrincipal: "OPERACIONES", telefono: "876543210", grupoSanguineo: "A+", fechaIngreso: new Date("2011-09-08"), fechaNacimiento: new Date("1981-01-22") },
    { cip: "PP-0123", dni: "43456780", nombres: "Silvia Rocío", apellidos: "Medina Ccori", grado: "CABO", areaPrincipal: "ADMINISTRACION", telefono: "865432109", grupoSanguineo: "O-", fechaIngreso: new Date("2017-12-01"), fechaNacimiento: new Date("1989-06-30") },
    { cip: "PP-0134", dni: "44567891", nombres: "Edgar Manuel", apellidos: "Cruz Yupanqui", grado: "BOMBERO_PRIMERO", areaPrincipal: "SERVICIOS_GENERALES", telefono: "854321098", grupoSanguineo: "AB-", fechaIngreso: new Date("2021-03-14"), fechaNacimiento: new Date("1995-10-18") },
    { cip: "PP-0145", dni: "45678902", nombres: "Nelly Pilar", apellidos: "Tito Condori", grado: "BOMBERO_RASO", areaPrincipal: "IMAGEN", telefono: "843210987", grupoSanguineo: "A-", fechaIngreso: new Date("2023-01-09"), fechaNacimiento: new Date("2000-03-27") },
    { cip: "PP-0156", dni: "46789013", nombres: "Jhonatan David", apellidos: "Herrera Mamani", grado: "ALFEREZ", areaPrincipal: "OPERACIONES", telefono: "832109876", grupoSanguineo: "O+", fechaIngreso: new Date("2016-08-22"), fechaNacimiento: new Date("1986-12-14") },
    { cip: "PP-0167", dni: "47890124", nombres: "Carmen Rosa", apellidos: "Flores Ticona", grado: "BOMBERO_PRIMERO", areaPrincipal: "INSTRUCCION", telefono: "821098765", grupoSanguineo: "B+", fechaIngreso: new Date("2020-09-30"), fechaNacimiento: new Date("1993-07-08") },
    { cip: "PP-0178", dni: "48901235", nombres: "Wilmer Joel", apellidos: "Aguilar Pari", grado: "CABO", areaPrincipal: "OPERACIONES", telefono: "810987654", grupoSanguineo: "A+", fechaIngreso: new Date("2019-02-17"), fechaNacimiento: new Date("1991-04-20") },
    { cip: "PP-0189", dni: "49012346", nombres: "Yaneth Gloria", apellidos: "Catacora Huanca", grado: "SARGENTO_SEGUNDO", areaPrincipal: "SANIDAD", telefono: "809876543", grupoSanguineo: "O+", fechaIngreso: new Date("2015-10-05"), fechaNacimiento: new Date("1984-08-16") },
    { cip: "PP-0190", dni: "40123457", nombres: "Ricardo Efraín", apellidos: "Cáceres Luque", grado: "BOMBERO_RASO", areaPrincipal: "SERVICIOS_GENERALES", telefono: "798765432", grupoSanguineo: "B-", fechaIngreso: new Date("2023-06-12"), fechaNacimiento: new Date("2001-01-31") },
  ];

  const bomberos = await Promise.all(
    bomberosData.map((b) =>
      prisma.bombero.upsert({        where: { cip: b.cip },
        update: { nombres: b.nombres, apellidos: b.apellidos },
        create: {
          ...b,
          direccion: "Av. Lima Norte, Puente Piedra",
          estado: b.grado === "BOMBERO_RASO" && b.cip === "PP-0145" ? "BAJA_TEMPORAL" : "ACTIVO",
        },
      })
    )
  );
  console.log("✅ Bomberos creados:", bomberos.length);

  // ─── VEHÍCULOS ───────────────────────────────────────────────────────────────
  const vehiculos = await Promise.all([
    prisma.vehiculo.upsert({
      where: { placa: "A3B-421" },
      update: {},
      create: { placa: "A3B-421", nombre: "Autobomba B-31", tipo: "AUTOBOMBA", marca: "Mercedes-Benz", modelo: "Atego 1725", anio: 2018, estado: "OPERATIVO", kilometraje: 48200, ultimaRevision: new Date("2026-01-15"), proximaRevision: new Date("2026-07-15"), observaciones: "Unidad principal de combate" },
    }),
    prisma.vehiculo.upsert({
      where: { placa: "A3C-112" },
      update: {},
      create: { placa: "A3C-112", nombre: "Autotanque T-31", tipo: "AUTOTANQUE", marca: "Volvo", modelo: "FM 370", anio: 2015, estado: "OPERATIVO", kilometraje: 72500, ultimaRevision: new Date("2025-11-20"), proximaRevision: new Date("2026-05-20"), observaciones: "Capacidad 5000 litros" },
    }),
    prisma.vehiculo.upsert({
      where: { placa: "A4D-338" },
      update: {},
      create: { placa: "A4D-338", nombre: "Unidad de Rescate UR-31", tipo: "UNIDAD_RESCATE", marca: "Ford", modelo: "F-550", anio: 2020, estado: "OPERATIVO", kilometraje: 31800, ultimaRevision: new Date("2026-02-10"), proximaRevision: new Date("2026-08-10") },
    }),
    prisma.vehiculo.upsert({
      where: { placa: "B1E-554" },
      update: {},
      create: { placa: "B1E-554", nombre: "Camioneta Comando CC-31", tipo: "CAMIONETA_COMANDO", marca: "Toyota", modelo: "Hilux 4x4", anio: 2019, estado: "EN_MANTENIMIENTO", kilometraje: 55100, ultimaRevision: new Date("2025-12-01"), proximaRevision: new Date("2026-06-01"), observaciones: "En reparación de transmisión" },
    }),
  ]);
  console.log("✅ Vehículos creados:", vehiculos.length);

  // ─── EQUIPOS ─────────────────────────────────────────────────────────────────
  const equipos = await Promise.all([
    prisma.equipo.upsert({ where: { codigo: "EPP-001" }, update: {}, create: { codigo: "EPP-001", nombre: "Traje de Proximidad", categoria: "EPP", marca: "Dräger", modelo: "Proximity Suit", estado: "OPERATIVO", ubicacion: "Bodega Central" } }),
    prisma.equipo.upsert({ where: { codigo: "EPP-002" }, update: {}, create: { codigo: "EPP-002", nombre: "Traje de Combate Estructural", categoria: "EPP", marca: "Securitex", estado: "OPERATIVO", ubicacion: "Autobomba B-31" } }),
    prisma.equipo.upsert({ where: { codigo: "EPP-003" }, update: {}, create: { codigo: "EPP-003", nombre: "Casco Bombero F2 Xtreme", categoria: "EPP", marca: "MSA", estado: "OPERATIVO", ubicacion: "Bodega Central", observaciones: "10 unidades" } }),
    prisma.equipo.upsert({ where: { codigo: "SCBA-001" }, update: {}, create: { codigo: "SCBA-001", nombre: "Equipo de Respiración Autónoma", categoria: "SCBA", marca: "Scott", modelo: "Air-Pak X3 Pro", estado: "OPERATIVO", ubicacion: "Autobomba B-31" } }),
    prisma.equipo.upsert({ where: { codigo: "SCBA-002" }, update: {}, create: { codigo: "SCBA-002", nombre: "Equipo de Respiración Autónoma", categoria: "SCBA", marca: "Dräger", modelo: "PA90 Plus", estado: "EN_REPARACION", ubicacion: "Taller", observaciones: "Revisión de válvula" } }),
    prisma.equipo.upsert({ where: { codigo: "HH-001" }, update: {}, create: { codigo: "HH-001", nombre: "Quijadas de Vida", categoria: "Herramienta Hidráulica", marca: "Holmatro", modelo: "SR 3250 T", estado: "OPERATIVO", ubicacion: "Unidad de Rescate UR-31" } }),
    prisma.equipo.upsert({ where: { codigo: "HH-002" }, update: {}, create: { codigo: "HH-002", nombre: "Cilindro Hidráulico", categoria: "Herramienta Hidráulica", marca: "Holmatro", estado: "OPERATIVO", ubicacion: "Unidad de Rescate UR-31" } }),
    prisma.equipo.upsert({ where: { codigo: "MANG-001" }, update: {}, create: { codigo: "MANG-001", nombre: "Manguera Contra Incendio 2.5\"", categoria: "Manguera", estado: "OPERATIVO", ubicacion: "Autobomba B-31", observaciones: "30 metros, 8 unidades" } }),
    prisma.equipo.upsert({ where: { codigo: "MANG-002" }, update: {}, create: { codigo: "MANG-002", nombre: "Manguera Succión 4\"", categoria: "Manguera", estado: "OPERATIVO", ubicacion: "Autotanque T-31", observaciones: "6 metros, 4 unidades" } }),
    prisma.equipo.upsert({ where: { codigo: "GEN-001" }, update: {}, create: { codigo: "GEN-001", nombre: "Generador Eléctrico 5KVA", categoria: "Generador", marca: "Honda", modelo: "EU70is", estado: "OPERATIVO", ubicacion: "Bodega Central" } }),
    prisma.equipo.upsert({ where: { codigo: "TERM-001" }, update: {}, create: { codigo: "TERM-001", nombre: "Cámara Termográfica", categoria: "Detección", marca: "FLIR", modelo: "K2", estado: "OPERATIVO", ubicacion: "Autobomba B-31" } }),
    prisma.equipo.upsert({ where: { codigo: "CORD-001" }, update: {}, create: { codigo: "CORD-001", nombre: "Kit de Cuerdas para Rescate", categoria: "Rescate en Altura", marca: "Petzl", estado: "OPERATIVO", ubicacion: "Unidad de Rescate UR-31" } }),
  ]);
  console.log("✅ Equipos creados:", equipos.length);

  // ─── MANTENIMIENTOS ──────────────────────────────────────────────────────────
  await prisma.mantenimiento.createMany({
    data: [
      { tipo: "CORRECTIVO", estado: "EN_PROCESO", descripcion: "Reparación de sistema de transmisión automática", fechaProgramada: new Date("2026-03-28"), costo: 3500, proveedor: "Automotriz Norte SAC", vehiculoId: vehiculos[3].id },
      { tipo: "PREVENTIVO", estado: "PENDIENTE", descripcion: "Mantenimiento semestral - cambio de aceite, filtros y revisión de sistema contra incendio", fechaProgramada: new Date("2026-05-20"), vehiculoId: vehiculos[1].id },
      { tipo: "REVISION_PERIODICA", estado: "COMPLETADO", descripcion: "Revisión anual de válvulas y cilindros", fechaProgramada: new Date("2026-01-15"), fechaRealizada: new Date("2026-01-15"), costo: 450, proveedor: "Dräger Perú", equipoId: equipos[4].id },
      { tipo: "CORRECTIVO", estado: "EN_PROCESO", descripcion: "Cambio de válvula de demanda en falla", fechaProgramada: new Date("2026-03-30"), equipoId: equipos[4].id, proveedor: "Dräger Perú" },
      { tipo: "PREVENTIVO", estado: "PENDIENTE", descripcion: "Recarga de cilindros SCBA - inspección anual", fechaProgramada: new Date("2026-04-15"), equipoId: equipos[3].id },
    ],
  });
  console.log("✅ Mantenimientos creados");

  // ─── INVENTARIO ──────────────────────────────────────────────────────────────
  await prisma.itemInventario.createMany({
    data: [
      { codigo: "INV-001", nombre: "Foam AFFF 3%", categoria: "Agente extintor", unidad: "litros", stock: 120, stockMinimo: 50, ubicacion: "Bodega Central" },
      { codigo: "INV-002", nombre: "Polvo Químico Seco ABC", categoria: "Agente extintor", unidad: "kg", stock: 80, stockMinimo: 30, ubicacion: "Bodega Central" },
      { codigo: "INV-003", nombre: "Combustible Diesel B5", categoria: "Combustible", unidad: "litros", stock: 350, stockMinimo: 100, ubicacion: "Tanque principal" },
      { codigo: "INV-004", nombre: "Aceite Motor 15W-40", categoria: "Lubricante", unidad: "litros", stock: 25, stockMinimo: 10, ubicacion: "Bodega Central" },
      { codigo: "INV-005", nombre: "Guantes de Nitrilo", categoria: "EPP descartable", unidad: "pares", stock: 8, stockMinimo: 20, ubicacion: "Bodega Central" },
      { codigo: "INV-006", nombre: "Conos de Señalización", categoria: "Seguridad vial", unidad: "unidad", stock: 24, stockMinimo: 10, ubicacion: "Autobomba B-31" },
      { codigo: "INV-007", nombre: "Linterna de Mano LED", categoria: "Iluminación", unidad: "unidad", stock: 12, stockMinimo: 6, ubicacion: "Bodega Central" },
      { codigo: "INV-008", nombre: "Pila AA", categoria: "Suministro eléctrico", unidad: "unidad", stock: 15, stockMinimo: 30, ubicacion: "Bodega Central" },
    ],
  });
  console.log("✅ Inventario creado");

  // ─── PRESUPUESTO ─────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.partidaPresupuestal.upsert({
      where: { id: "partida-combustible-2026" },
      update: {},
      create: { id: "partida-combustible-2026", anio: 2026, descripcion: "Combustible y lubricantes para unidades", categoria: "Operativo", montoAprobado: 18000, montoEjecutado: 6200 },
    }),
    prisma.partidaPresupuestal.upsert({
      where: { id: "partida-mantenimiento-2026" },
      update: {},
      create: { id: "partida-mantenimiento-2026", anio: 2026, descripcion: "Mantenimiento de vehículos y equipos", categoria: "Mantenimiento", montoAprobado: 25000, montoEjecutado: 3950 },
    }),
    prisma.partidaPresupuestal.upsert({
      where: { id: "partida-epp-2026" },
      update: {},
      create: { id: "partida-epp-2026", anio: 2026, descripcion: "Equipos de protección personal", categoria: "Equipamiento", montoAprobado: 15000, montoEjecutado: 4800 },
    }),
    prisma.partidaPresupuestal.upsert({
      where: { id: "partida-instruccion-2026" },
      update: {},
      create: { id: "partida-instruccion-2026", anio: 2026, descripcion: "Capacitación e instrucción del personal", categoria: "Instrucción", montoAprobado: 8000, montoEjecutado: 2100 },
    }),
    prisma.partidaPresupuestal.upsert({
      where: { id: "partida-sanidad-2026" },
      update: {},
      create: { id: "partida-sanidad-2026", anio: 2026, descripcion: "Sanidad y medicamentos", categoria: "Sanidad", montoAprobado: 5000, montoEjecutado: 1350 },
    }),
  ]);
  console.log("✅ Presupuesto creado");

  // ─── DOCUMENTOS ──────────────────────────────────────────────────────────────
  await prisma.documento.createMany({
    data: [
      { id: "doc-001", titulo: "Reglamento Interno CIA. B. V. Puente Piedra", tipo: "RESOLUCION", numero: "Res. N° 001-2026/CBPP", estado: "PUBLICADO", fechaEmision: new Date("2026-01-10") },
      { id: "doc-002", titulo: "Plan Operativo Anual 2026", tipo: "INFORME", numero: "Inf. N° 005-2026/CBPP", estado: "PUBLICADO", fechaEmision: new Date("2026-01-20") },
      { id: "doc-003", titulo: "Oficio a CGBVP - Solicitud de equipamiento", tipo: "OFICIO", numero: "Of. N° 012-2026/CBPP", estado: "PUBLICADO", fechaEmision: new Date("2026-02-05") },
      { id: "doc-004", titulo: "Acta de Asamblea General de Bomberos - Marzo 2026", tipo: "ACTA", numero: "Acta N° 003-2026", estado: "PUBLICADO", fechaEmision: new Date("2026-03-15") },
      { id: "doc-005", titulo: "Convenio con Hospital Santa Rosa - Apoyo Médico", tipo: "CONVENIO", estado: "BORRADOR", fechaEmision: new Date("2026-03-28") },
      { id: "doc-006", titulo: "Memorando Interno - Turno de Guardia Semana 15", tipo: "MEMORANDO", numero: "Memo N° 018-2026", estado: "PUBLICADO", fechaEmision: new Date("2026-04-04") },
    ],
  });
  console.log("✅ Documentos creados");

  // ─── CURSOS ──────────────────────────────────────────────────────────────────
  const cursos = await Promise.all([
    prisma.curso.upsert({
      where: { id: "curso-basico-2026" },
      update: {},
      create: { id: "curso-basico-2026", nombre: "Curso Básico de Bomberos (CBB)", tipo: "FORMACION_BASICA", descripcion: "Formación fundamental obligatoria para nuevos voluntarios", instructor: "Crnl. ereclamoQuispe", entidad: "CGBVP", fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-06-30"), horas: 120, lugar: "Cuartel CIA Puente Piedra", cupoMaximo: 15 },
    }),
    prisma.curso.upsert({
      where: { id: "curso-hamat-2026" },
      update: {},
      create: { id: "curso-hamat-2026", nombre: "Manejo de Materiales Peligrosos - Nivel Operaciones", tipo: "ESPECIALIZACION", descripcion: "Respuesta a incidentes con HAZMAT", instructor: "My. Jorge Flores", entidad: "CGBVP", fechaInicio: new Date("2026-02-10"), fechaFin: new Date("2026-02-28"), horas: 40, lugar: "Escuela Nacional de Bomberos", cupoMaximo: 20 },
    }),
    prisma.curso.upsert({
      where: { id: "curso-rescate-2026" },
      update: {},
      create: { id: "curso-rescate-2026", nombre: "Rescate Vehicular y Excarcelación", tipo: "ESPECIALIZACION", descripcion: "Técnicas modernas de excarcelación con herramientas hidráulicas", instructor: "Cap. Ana Vargas", entidad: "CGBVP", fechaInicio: new Date("2026-04-07"), fechaFin: new Date("2026-04-25"), horas: 32, lugar: "Cuartel CIA Puente Piedra", cupoMaximo: 12, activo: true },
    }),
    prisma.curso.upsert({
      where: { id: "curso-primeros-auxilios-2025" },
      update: {},
      create: { id: "curso-primeros-auxilios-2025", nombre: "Primeros Auxilios y RCP con DEA", tipo: "ACTUALIZACION", descripcion: "Actualización en técnicas de primeros auxilios avanzado", instructor: "Alf. Roberto Paredes", entidad: "Cruz Roja Peruana", fechaInicio: new Date("2025-11-01"), fechaFin: new Date("2025-11-15"), horas: 24, lugar: "Cruz Roja - Lima Norte", cupoMaximo: 25, activo: false },
    }),
    prisma.curso.upsert({
      where: { id: "simulacro-2026" },
      update: {},
      create: { id: "simulacro-2026", nombre: "Simulacro Interinstitucional Lima Norte", tipo: "SIMULACRO", descripcion: "Ejercicio de respuesta conjunta con PNP y SAMU", entidad: "INDECI", fechaInicio: new Date("2026-05-15"), fechaFin: new Date("2026-05-15"), horas: 8, lugar: "Av. Panamericana Norte Km 28", cupoMaximo: 30 },
    }),
  ]);
  console.log("✅ Cursos creados:", cursos.length);

  // ─── MATRICULAS ──────────────────────────────────────────────────────────────
  await prisma.matricula.createMany({
    data: [
      { cursoId: "curso-basico-2026", bomberoId: bomberos[10].id, estado: "MATRICULADO" },
      { cursoId: "curso-basico-2026", bomberoId: bomberos[14].id, estado: "MATRICULADO" },
      { cursoId: "curso-basico-2026", bomberoId: bomberos[19].id, estado: "MATRICULADO" },
      { cursoId: "curso-hamat-2026", bomberoId: bomberos[5].id, estado: "APROBADO", notaFinal: 17 },
      { cursoId: "curso-hamat-2026", bomberoId: bomberos[7].id, estado: "APROBADO", notaFinal: 15 },
      { cursoId: "curso-hamat-2026", bomberoId: bomberos[11].id, estado: "APROBADO", notaFinal: 18 },
      { cursoId: "curso-rescate-2026", bomberoId: bomberos[3].id, estado: "MATRICULADO" },
      { cursoId: "curso-rescate-2026", bomberoId: bomberos[5].id, estado: "MATRICULADO" },
      { cursoId: "curso-primeros-auxilios-2025", bomberoId: bomberos[4].id, estado: "APROBADO", notaFinal: 19 },
      { cursoId: "curso-primeros-auxilios-2025", bomberoId: bomberos[8].id, estado: "APROBADO", notaFinal: 16 },
      { cursoId: "curso-primeros-auxilios-2025", bomberoId: bomberos[18].id, estado: "DESAPROBADO", notaFinal: 10 },
    ],
  });
  console.log("✅ Matrículas creadas");

  // ─── CERTIFICACIONES ─────────────────────────────────────────────────────────
  await prisma.certificacion.createMany({
    data: [
      { bomberoId: bomberos[0].id, nombre: "Combate de Incendios - Nivel Avanzado", entidadEmisora: "CGBVP", fechaEmision: new Date("2022-06-15"), fechaVencimiento: new Date("2026-06-15") },
      { bomberoId: bomberos[2].id, nombre: "Técnico en Rescate Vehicular", entidadEmisora: "CGBVP", fechaEmision: new Date("2023-03-20"), fechaVencimiento: new Date("2027-03-20") },
      { bomberoId: bomberos[4].id, nombre: "Paramédico Avanzado", entidadEmisora: "SAMU Perú", fechaEmision: new Date("2024-08-10"), fechaVencimiento: new Date("2026-08-10") },
      { bomberoId: bomberos[5].id, nombre: "HAZMAT - Nivel Operaciones", entidadEmisora: "CGBVP", fechaEmision: new Date("2026-02-28") },
      { bomberoId: bomberos[1].id, nombre: "Gestión Administrativa de Cuerpo de Bomberos", entidadEmisora: "CGBVP", fechaEmision: new Date("2023-11-05") },
      { bomberoId: bomberos[3].id, nombre: "Instrucción y Adiestramiento Bomberos", entidadEmisora: "CGBVP", fechaEmision: new Date("2024-04-18") },
      { bomberoId: bomberos[7].id, nombre: "Combate de Incendios - Nivel Básico", entidadEmisora: "CGBVP", fechaEmision: new Date("2020-12-10"), fechaVencimiento: new Date("2026-04-30") },
    ],
  });
  console.log("✅ Certificaciones creadas");

  // ─── FICHAS MÉDICAS ──────────────────────────────────────────────────────────
  await prisma.fichaMedica.createMany({
    data: bomberos.slice(0, 12).map((b, i) => ({
      bomberoId: b.id,
      grupoSanguineo: bomberosData[i].grupoSanguineo ?? "O+",
      alergias: i === 2 ? "Penicilina" : i === 5 ? "Polen" : null,
      enfermedadesCronicas: i === 0 ? "Hipertensión controlada" : null,
      medicamentosActuales: i === 0 ? "Enalapril 5mg" : null,
      contactoEmergencia: `Familiar de ${bomberosData[i].nombres}`,
      telefonoEmergencia: `9${Math.floor(10000000 + Math.random() * 89999999)}`,
      aptitudOperativa: i !== 10,
    })),
  });
  console.log("✅ Fichas médicas creadas");

  // ─── EVALUACIONES DE SALUD ───────────────────────────────────────────────────
  await prisma.evaluacionSalud.createMany({
    data: [
      { bomberoId: bomberos[0].id, fecha: new Date("2026-01-10"), tipo: "Anual", medicoEvaluador: "Dr. Pérez", presionArterial: "135/85", frecuenciaCardiaca: 72, peso: 82.5, talla: 175, resultado: "APTO CON RESTRICCIONES", observaciones: "Hipertensión controlada, apto con monitoreo", proximaEval: new Date("2026-07-10") },
      { bomberoId: bomberos[1].id, fecha: new Date("2026-01-15"), tipo: "Anual", medicoEvaluador: "Dr. Pérez", presionArterial: "120/80", frecuenciaCardiaca: 68, peso: 65.0, talla: 162, resultado: "APTO", proximaEval: new Date("2027-01-15") },
      { bomberoId: bomberos[4].id, fecha: new Date("2026-02-05"), tipo: "Anual", medicoEvaluador: "Dr. Gómez", presionArterial: "118/76", frecuenciaCardiaca: 65, peso: 78.0, talla: 178, resultado: "APTO", proximaEval: new Date("2027-02-05") },
      { bomberoId: bomberos[5].id, fecha: new Date("2026-01-20"), tipo: "Pre-operacional", medicoEvaluador: "Dr. Pérez", presionArterial: "122/82", frecuenciaCardiaca: 70, peso: 85.0, talla: 180, resultado: "APTO", proximaEval: new Date("2027-01-20") },
      { bomberoId: bomberos[10].id, fecha: new Date("2025-12-01"), tipo: "Anual", medicoEvaluador: "Dr. Gómez", presionArterial: "145/95", frecuenciaCardiaca: 88, peso: 72.0, talla: 165, resultado: "NO APTO", observaciones: "Crisis hipertensiva, requiere tratamiento médico", proximaEval: new Date("2026-06-01") },
    ],
  });
  console.log("✅ Evaluaciones de salud creadas");

  // ─── BOTIQUÍN ────────────────────────────────────────────────────────────────
  await prisma.itemBotiquin.createMany({
    data: [
      { nombre: "Suero Fisiológico 1L", categoria: "Insumo médico", cantidad: 20, cantidadMinima: 10, unidad: "frasco", lote: "SF2025-A", fechaVencimiento: new Date("2027-06-30"), ubicacion: "Botiquín Central" },
      { nombre: "Vendaje Elástico 4\"", categoria: "Insumo médico", cantidad: 15, cantidadMinima: 10, unidad: "unidad", ubicacion: "Botiquín Central" },
      { nombre: "Gasa Estéril 10x10cm", categoria: "Insumo médico", cantidad: 50, cantidadMinima: 30, unidad: "paquete", ubicacion: "Botiquín Central" },
      { nombre: "Tablillas de Madera", categoria: "Inmovilización", cantidad: 8, cantidadMinima: 4, unidad: "unidad", ubicacion: "Unidad de Rescate UR-31" },
      { nombre: "Collarín Cervical Adulto", categoria: "Inmovilización", cantidad: 4, cantidadMinima: 2, unidad: "unidad", ubicacion: "Unidad de Rescate UR-31" },
      { nombre: "Oxígeno Medicinal 10L", categoria: "Equipo médico", cantidad: 3, cantidadMinima: 2, unidad: "cilindro", fechaVencimiento: new Date("2026-09-15"), ubicacion: "Ambulancia/UR-31" },
      { nombre: "Paracetamol 500mg", categoria: "Medicamento", cantidad: 100, cantidadMinima: 50, unidad: "tableta", lote: "PCT-2024", fechaVencimiento: new Date("2026-05-10"), ubicacion: "Botiquín Central" },
      { nombre: "Ibuprofeno 400mg", categoria: "Medicamento", cantidad: 60, cantidadMinima: 30, unidad: "tableta", lote: "IBU-2024", fechaVencimiento: new Date("2026-03-15"), ubicacion: "Botiquín Central" },
      { nombre: "Agua Oxigenada 120ml", categoria: "Antiséptico", cantidad: 10, cantidadMinima: 5, unidad: "frasco", ubicacion: "Botiquín Central" },
      { nombre: "Guantes de Látex", categoria: "EPP médico", cantidad: 5, cantidadMinima: 20, unidad: "caja x100", ubicacion: "Botiquín Central" },
      { nombre: "Mascarilla Quirúrgica", categoria: "EPP médico", cantidad: 30, cantidadMinima: 50, unidad: "unidad", ubicacion: "Botiquín Central" },
      { nombre: "Tensiómetro Digital", categoria: "Equipo diagnóstico", cantidad: 2, cantidadMinima: 1, unidad: "unidad", ubicacion: "Botiquín Central" },
      { nombre: "Glucómetro + Tiras", categoria: "Equipo diagnóstico", cantidad: 1, cantidadMinima: 1, unidad: "kit", fechaVencimiento: new Date("2026-08-20"), ubicacion: "Botiquín Central" },
      { nombre: "DEA (Desfibrilador)", categoria: "Equipo de emergencia", cantidad: 1, cantidadMinima: 1, unidad: "equipo", ubicacion: "Unidad de Rescate UR-31" },
    ],
  });
  console.log("✅ Botiquín creado");

  // ─── EMERGENCIAS ─────────────────────────────────────────────────────────────
  const emergenciasData = [
    { codigo: "E-2026-001", tipo: "INCENDIO_URBANO", nivel: "SEGUNDA_ALARMA", estado: "CERRADA", direccion: "Av. Lima Norte 3450", distrito: "Puente Piedra", fechaAlerta: new Date("2026-01-08T02:15:00"), fechaLlegada: new Date("2026-01-08T02:23:00"), fechaControl: new Date("2026-01-08T03:45:00"), fechaCierre: new Date("2026-01-08T04:10:00"), descripcion: "Incendio en local comercial (ferretería)", heridos: 2, danos: "Local comercial destruido en 60%, daño a locales aledaños" },
    { codigo: "E-2026-002", tipo: "RESCATE_VEHICULAR", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Panamericana Norte Km 25", distrito: "Puente Piedra", fechaAlerta: new Date("2026-01-15T18:30:00"), fechaLlegada: new Date("2026-01-15T18:38:00"), fechaControl: new Date("2026-01-15T20:10:00"), fechaCierre: new Date("2026-01-15T20:30:00"), descripcion: "Accidente de tránsito, 2 vehículos, excarcelación", heridos: 3, bajas: 0 },
    { codigo: "E-2026-003", tipo: "EMERGENCIA_MEDICA", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Jr. Progreso 245", distrito: "Puente Piedra", fechaAlerta: new Date("2026-01-22T11:00:00"), fechaLlegada: new Date("2026-01-22T11:08:00"), fechaControl: new Date("2026-01-22T11:40:00"), fechaCierre: new Date("2026-01-22T11:45:00"), descripcion: "Paciente con crisis hipertensiva, traslado a hospital", heridos: 1 },
    { codigo: "E-2026-004", tipo: "INCENDIO_FORESTAL", nivel: "SEGUNDA_ALARMA", estado: "CERRADA", direccion: "Cerros de Puente Piedra - Sector 4", distrito: "Puente Piedra", fechaAlerta: new Date("2026-01-30T14:20:00"), fechaLlegada: new Date("2026-01-30T14:35:00"), fechaControl: new Date("2026-01-30T17:30:00"), fechaCierre: new Date("2026-01-30T18:00:00"), descripcion: "Incendio forestal en cerros, aprox 3 ha afectadas", danos: "3 hectáreas de vegetación" },
    { codigo: "E-2026-005", tipo: "INCENDIO_URBANO", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Av. Las Flores 890", distrito: "Carabayllo", fechaAlerta: new Date("2026-02-05T03:40:00"), fechaLlegada: new Date("2026-02-05T03:52:00"), fechaControl: new Date("2026-02-05T04:45:00"), fechaCierre: new Date("2026-02-05T05:00:00"), descripcion: "Incendio en vivienda unifamiliar, controlado a tiempo", heridos: 1 },
    { codigo: "E-2026-006", tipo: "FALSA_ALARMA", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Mercado Municipal Puente Piedra", distrito: "Puente Piedra", fechaAlerta: new Date("2026-02-10T09:15:00"), fechaLlegada: new Date("2026-02-10T09:22:00"), fechaControl: new Date("2026-02-10T09:30:00"), fechaCierre: new Date("2026-02-10T09:35:00"), descripcion: "Alarma activada por humo de quema de papeles" },
    { codigo: "E-2026-007", tipo: "RESCATE_VEHICULAR", nivel: "SEGUNDA_ALARMA", estado: "CERRADA", direccion: "Panamericana Norte Km 27.5", distrito: "Comas", fechaAlerta: new Date("2026-02-18T22:10:00"), fechaLlegada: new Date("2026-02-18T22:20:00"), fechaControl: new Date("2026-02-19T00:30:00"), fechaCierre: new Date("2026-02-19T01:00:00"), descripcion: "Volcamiento de camión de carga, conductor atrapado", heridos: 2, bajas: 1, danos: "Camión volcado, daños en infraestructura vial" },
    { codigo: "E-2026-008", tipo: "MATERIALES_PELIGROSOS", nivel: "SEGUNDA_ALARMA", estado: "CERRADA", direccion: "Zona Industrial Puente Piedra - Lote 12", distrito: "Puente Piedra", fechaAlerta: new Date("2026-02-25T10:45:00"), fechaLlegada: new Date("2026-02-25T10:58:00"), fechaControl: new Date("2026-02-25T14:00:00"), fechaCierre: new Date("2026-02-25T15:30:00"), descripcion: "Derrame de ácido sulfúrico en planta industrial", heridos: 3 },
    { codigo: "E-2026-009", tipo: "INCENDIO_URBANO", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Jr. San Martín 1240", distrito: "Puente Piedra", fechaAlerta: new Date("2026-03-02T20:30:00"), fechaLlegada: new Date("2026-03-02T20:38:00"), fechaControl: new Date("2026-03-02T21:20:00"), fechaCierre: new Date("2026-03-02T21:30:00"), descripcion: "Incendio en cocina de vivienda, controlado", heridos: 0 },
    { codigo: "E-2026-010", tipo: "EMERGENCIA_MEDICA", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Colegio Los Pinos", distrito: "Puente Piedra", fechaAlerta: new Date("2026-03-10T08:50:00"), fechaLlegada: new Date("2026-03-10T08:57:00"), fechaControl: new Date("2026-03-10T09:30:00"), fechaCierre: new Date("2026-03-10T09:35:00"), descripcion: "Alumno con convulsión febril, estabilizado y trasladado", heridos: 1 },
    { codigo: "E-2026-011", tipo: "RESCATE_ALTURA", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Cerro El Choclo, Puente Piedra", distrito: "Puente Piedra", fechaAlerta: new Date("2026-03-16T15:30:00"), fechaLlegada: new Date("2026-03-16T15:48:00"), fechaControl: new Date("2026-03-16T17:45:00"), fechaCierre: new Date("2026-03-16T18:10:00"), descripcion: "Senderista herido en cerro, rescate en zona escarpada", heridos: 1 },
    { codigo: "E-2026-012", tipo: "INCENDIO_URBANO", nivel: "TERCERA_ALARMA", estado: "CERRADA", direccion: "Av. Panamericana Norte 4200 - Galería Comercial", distrito: "Puente Piedra", fechaAlerta: new Date("2026-03-22T01:10:00"), fechaLlegada: new Date("2026-03-22T01:19:00"), fechaControl: new Date("2026-03-22T04:30:00"), fechaCierre: new Date("2026-03-22T05:00:00"), descripcion: "Gran incendio en galería comercial, apoyo de 3 compañías", heridos: 0, danos: "Galería destruida 80%, pérdidas estimadas S/ 500,000" },
    { codigo: "E-2026-013", tipo: "APOYO_INTER_INSTITUCIONAL", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Hospital Materno Puente Piedra", distrito: "Puente Piedra", fechaAlerta: new Date("2026-03-28T11:20:00"), fechaLlegada: new Date("2026-03-28T11:27:00"), fechaControl: new Date("2026-03-28T12:00:00"), fechaCierre: new Date("2026-03-28T12:05:00"), descripcion: "Apoyo en evacuación preventiva por corte de electricidad" },
    { codigo: "E-2026-014", tipo: "INCENDIO_URBANO", nivel: "PRIMERA_ALARMA", estado: "CERRADA", direccion: "Jr. Los Jazmines 456", distrito: "Carabayllo", fechaAlerta: new Date("2026-04-01T19:45:00"), fechaLlegada: new Date("2026-04-01T19:54:00"), fechaControl: new Date("2026-04-01T20:30:00"), fechaCierre: new Date("2026-04-01T20:45:00"), descripcion: "Incendio en depósito de materiales reciclados", heridos: 0 },
    { codigo: "E-2026-015", tipo: "EMERGENCIA_MEDICA", nivel: "PRIMERA_ALARMA", estado: "EN_CURSO", direccion: "Av. Industrial 1890", distrito: "Puente Piedra", fechaAlerta: new Date("2026-04-06T14:30:00"), fechaLlegada: new Date("2026-04-06T14:39:00"), descripcion: "Obrero con trauma por caída de altura en obra", heridos: 1 },
  ];

  const emergencias = await Promise.all(
    emergenciasData.map((e) =>
      prisma.emergencia.upsert({
        where: { codigoEmergencia: e.codigo },
        update: {},
        create: {
          codigoEmergencia: e.codigo,
          tipo: e.tipo,
          nivel: e.nivel,
          estado: e.estado,
          direccion: e.direccion,
          distrito: e.distrito,
          fechaHoraAlerta: e.fechaAlerta,
          fechaHoraLlegada: e.fechaLlegada ?? null,
          fechaHoraControl: e.fechaControl ?? null,
          fechaHoraCierre: e.fechaCierre ?? null,
          descripcion: e.descripcion,
          heridos: e.heridos ?? 0,
          bajas: e.bajas ?? 0,
          danos: e.danos ?? null,
        },
      })
    )
  );

  // Asignar vehículos y bomberos a emergencias
  await prisma.emergenciaVehiculo.createMany({
    data: [
      { emergenciaId: emergencias[0].id, vehiculoId: vehiculos[0].id },
      { emergenciaId: emergencias[0].id, vehiculoId: vehiculos[1].id },
      { emergenciaId: emergencias[1].id, vehiculoId: vehiculos[2].id },
      { emergenciaId: emergencias[3].id, vehiculoId: vehiculos[0].id },
      { emergenciaId: emergencias[3].id, vehiculoId: vehiculos[1].id },
      { emergenciaId: emergencias[11].id, vehiculoId: vehiculos[0].id },
      { emergenciaId: emergencias[11].id, vehiculoId: vehiculos[1].id },
      { emergenciaId: emergencias[14].id, vehiculoId: vehiculos[2].id },
    ],
  });

  await prisma.emergenciaBombero.createMany({
    data: [
      { emergenciaId: emergencias[0].id, bomberoId: bomberos[0].id, rol: "Jefe de Intervención" },
      { emergenciaId: emergencias[0].id, bomberoId: bomberos[5].id, rol: "Conductor" },
      { emergenciaId: emergencias[0].id, bomberoId: bomberos[7].id, rol: "Combatiente" },
      { emergenciaId: emergencias[1].id, bomberoId: bomberos[2].id, rol: "Jefe de Intervención" },
      { emergenciaId: emergencias[1].id, bomberoId: bomberos[11].id, rol: "Operador Hidráulico" },
      { emergenciaId: emergencias[14].id, bomberoId: bomberos[5].id, rol: "Jefe de Intervención" },
      { emergenciaId: emergencias[14].id, bomberoId: bomberos[4].id, rol: "Paramédico" },
    ],
  });
  console.log("✅ Emergencias creadas:", emergencias.length);

  // ─── GUARDIAS ────────────────────────────────────────────────────────────────
  const hoy = new Date("2026-04-06");
  const guardias: { id: string; fecha: Date; turno: string }[] = [];
  for (let i = -3; i <= 4; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    for (const turno of ["DIURNO", "NOCTURNO"]) {
      const guardia = await prisma.guardia.upsert({
        where: { id: `guardia-${fecha.toISOString().split("T")[0]}-${turno}` },
        update: {},
        create: { id: `guardia-${fecha.toISOString().split("T")[0]}-${turno}`, fecha, turno },
      });
      guardias.push(guardia);
    }
  }

  const turnosBomberos = [
    bomberos[5], bomberos[7], bomberos[9], bomberos[11], bomberos[15], bomberos[17],
  ];
  await prisma.guardiaBombero.createMany({
    data: guardias.flatMap((g, gi) =>
      turnosBomberos.slice(gi % 3, (gi % 3) + 3).map((b) => ({
        guardiaId: g.id,
        bomberoId: b.id,
        asistio: gi < 6,
      }))
    ),
  });
  console.log("✅ Guardias creadas:", guardias.length);

  // ─── COMUNICADOS ─────────────────────────────────────────────────────────────
  await prisma.comunicado.createMany({
    data: [
      { id: "com-001", titulo: "Bomberos de Puente Piedra controlan incendio en galería comercial", contenido: "En la madrugada del 22 de marzo, efectivos de la Compañía de Bomberos Voluntarios de Puente Piedra N° 31 controlaron exitosamente un incendio que afectó una galería comercial en la Av. Panamericana Norte. La intervención duró aproximadamente 3 horas y participaron 3 compañías de bomberos. No se reportaron víctimas fatales.", tipo: "PRENSA", estado: "PUBLICADO", fechaPublicacion: new Date("2026-03-22T06:00:00") },
      { id: "com-002", titulo: "Inicio del Curso Básico de Bomberos 2026", contenido: "Con la participación de 8 nuevos voluntarios, el 1 de marzo dio inicio el Curso Básico de Bomberos correspondiente al año 2026. El curso tiene una duración de 4 meses y comprende formación teórica y práctica en combate de incendios, rescate y primeros auxilios.", tipo: "BOLETIN_INTERNO", estado: "PUBLICADO", fechaPublicacion: new Date("2026-03-05T08:00:00") },
      { id: "com-003", titulo: "Convocatoria: Nuevos voluntarios 2026", contenido: "La Compañía de Bomberos Voluntarios de Puente Piedra convoca a hombres y mujeres mayores de 18 años con deseos de servir a la comunidad a incorporarse como voluntarios. Los interesados pueden acercarse a nuestro cuartel de lunes a sábado de 8:00 a.m. a 6:00 p.m.", tipo: "COMUNICADO_OFICIAL", estado: "PUBLICADO", fechaPublicacion: new Date("2026-02-01T08:00:00") },
      { id: "com-004", titulo: "Reconocimiento por servicio destacado - Semana Santa 2026", contenido: "Durante el operativo de Semana Santa 2026, nuestros voluntarios atendieron 12 emergencias en 5 días de intensa actividad. El Jefe de Compañía reconoce el esfuerzo y dedicación de todos los voluntarios que cumplieron su turno de guardia.", tipo: "BOLETIN_INTERNO", estado: "PUBLICADO", fechaPublicacion: new Date("2026-04-05T10:00:00") },
      { id: "com-005", titulo: "Jornada de Capacitación en Rescate Vehicular", contenido: "Borrador pendiente de revisión para publicación en redes sociales sobre el curso de rescate vehicular que inicia en abril.", tipo: "REDES_SOCIALES", estado: "BORRADOR" },
    ],
  });
  console.log("✅ Comunicados creados");

  // ─── EVENTOS ─────────────────────────────────────────────────────────────────
  await prisma.evento.createMany({
    data: [
      { id: "evt-001", titulo: "Aniversario Compañía N° 31 - Puente Piedra", descripcion: "Celebración del aniversario de fundación de nuestra compañía. Desfile, ceremonia y acto social.", lugar: "Cuartel CIA Puente Piedra", fechaInicio: new Date("2026-05-08T09:00:00"), fechaFin: new Date("2026-05-08T18:00:00"), publico: true },
      { id: "evt-002", titulo: "Simulacro Interinstitucional Lima Norte", descripcion: "Ejercicio de respuesta conjunta con PNP, SAMU e INDECI. Escenario: sismos y rescate urbano.", lugar: "Av. Panamericana Norte Km 28", fechaInicio: new Date("2026-05-15T08:00:00"), fechaFin: new Date("2026-05-15T14:00:00"), publico: false },
      { id: "evt-003", titulo: "Asamblea General de Voluntarios - Abril 2026", descripcion: "Sesión mensual ordinaria. Agenda: informe de actividades, presupuesto y elección de comités.", lugar: "Sala de Reuniones - Cuartel", fechaInicio: new Date("2026-04-18T18:00:00"), fechaFin: new Date("2026-04-18T20:00:00"), publico: false },
      { id: "evt-004", titulo: "Charla Comunitaria: Prevención de Incendios del Hogar", descripcion: "Actividad de proyección social para vecinos de Puente Piedra. Charla sobre prevención, uso de extintores y primeros auxilios.", lugar: "Municipalidad de Puente Piedra - Auditorio", fechaInicio: new Date("2026-04-25T10:00:00"), fechaFin: new Date("2026-04-25T12:00:00"), publico: true },
    ],
  });
  console.log("✅ Eventos creados");

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("  Jefe de Compañía:    jefe@cbpp.pe / bomberos2026");
  console.log("  Administración:      admin@cbpp.pe / bomberos2026");
  console.log("  Servicios Generales: ssgenerales@cbpp.pe / bomberos2026");
  console.log("  Instrucción:         instruccion@cbpp.pe / bomberos2026");
  console.log("  Sanidad:             sanidad@cbpp.pe / bomberos2026");
  console.log("  Operaciones:         operaciones@cbpp.pe / bomberos2026");
  console.log("  Imagen:              imagen@cbpp.pe / bomberos2026");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
