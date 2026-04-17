-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bomberos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cip" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fechaIngreso" DATETIME NOT NULL,
    "fechaNacimiento" DATETIME NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "grupoSanguineo" TEXT,
    "fotografia" TEXT,
    "areaPrincipal" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bomberos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "descripcion" TEXT,
    "archivoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaEmision" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "partidas_presupuestales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anio" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "montoAprobado" REAL NOT NULL,
    "montoEjecutado" REAL NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transacciones_presupuestales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partidaId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comprobante" TEXT,
    CONSTRAINT "transacciones_presupuestales_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas_presupuestales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'OPERATIVO',
    "kilometraje" INTEGER NOT NULL DEFAULT 0,
    "ultimaRevision" DATETIME,
    "proximaRevision" DATETIME,
    "observaciones" TEXT,
    "fotografia" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'OPERATIVO',
    "ubicacion" TEXT,
    "fechaAdquisicion" DATETIME,
    "valorAdquisicion" REAL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mantenimientos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "descripcion" TEXT NOT NULL,
    "fechaProgramada" DATETIME NOT NULL,
    "fechaRealizada" DATETIME,
    "costo" REAL,
    "proveedor" TEXT,
    "observaciones" TEXT,
    "vehiculoId" TEXT,
    "equipoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mantenimientos_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehiculos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mantenimientos_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items_inventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" TEXT,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" TEXT,
    CONSTRAINT "movimientos_inventario_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items_inventario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "instructor" TEXT,
    "entidad" TEXT,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "horas" INTEGER NOT NULL,
    "lugar" TEXT,
    "cupoMaximo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cursoId" TEXT NOT NULL,
    "bomberoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'MATRICULADO',
    "notaFinal" REAL,
    "fechaMatricula" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matriculas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matriculas_bomberoId_fkey" FOREIGN KEY ("bomberoId") REFERENCES "bomberos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluaciones_instruccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cursoId" TEXT NOT NULL,
    "bomberoId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "nota" REAL NOT NULL,
    "observaciones" TEXT,
    CONSTRAINT "evaluaciones_instruccion_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bomberoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "entidadEmisora" TEXT NOT NULL,
    "fechaEmision" DATETIME NOT NULL,
    "fechaVencimiento" DATETIME,
    "codigoVerificacion" TEXT,
    "archivoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificaciones_bomberoId_fkey" FOREIGN KEY ("bomberoId") REFERENCES "bomberos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fichas_medicas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bomberoId" TEXT NOT NULL,
    "grupoSanguineo" TEXT NOT NULL,
    "alergias" TEXT,
    "enfermedadesCronicas" TEXT,
    "medicamentosActuales" TEXT,
    "contactoEmergencia" TEXT,
    "telefonoEmergencia" TEXT,
    "observaciones" TEXT,
    "aptitudOperativa" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fichas_medicas_bomberoId_fkey" FOREIGN KEY ("bomberoId") REFERENCES "bomberos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluaciones_salud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bomberoId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "medicoEvaluador" TEXT,
    "presionArterial" TEXT,
    "frecuenciaCardiaca" INTEGER,
    "peso" REAL,
    "talla" REAL,
    "resultado" TEXT NOT NULL,
    "observaciones" TEXT,
    "proximaEval" DATETIME,
    CONSTRAINT "evaluaciones_salud_bomberoId_fkey" FOREIGN KEY ("bomberoId") REFERENCES "bomberos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items_botiquin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "cantidadMinima" INTEGER NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL,
    "lote" TEXT,
    "fechaVencimiento" DATETIME,
    "ubicacion" TEXT,
    "observaciones" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "emergencias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoEmergencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'PRIMERA_ALARMA',
    "estado" TEXT NOT NULL DEFAULT 'EN_CURSO',
    "direccion" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "referencia" TEXT,
    "coordenadasLat" REAL,
    "coordenadasLng" REAL,
    "fechaHoraAlerta" DATETIME NOT NULL,
    "fechaHoraLlegada" DATETIME,
    "fechaHoraControl" DATETIME,
    "fechaHoraCierre" DATETIME,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "bajas" INTEGER NOT NULL DEFAULT 0,
    "heridos" INTEGER NOT NULL DEFAULT 0,
    "danos" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "emergencias_vehiculos" (
    "emergenciaId" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,

    PRIMARY KEY ("emergenciaId", "vehiculoId"),
    CONSTRAINT "emergencias_vehiculos_emergenciaId_fkey" FOREIGN KEY ("emergenciaId") REFERENCES "emergencias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emergencias_vehiculos_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehiculos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emergencias_bomberos" (
    "emergenciaId" TEXT NOT NULL,
    "bomberoId" TEXT NOT NULL,
    "rol" TEXT,

    PRIMARY KEY ("emergenciaId", "bomberoId"),
    CONSTRAINT "emergencias_bomberos_emergenciaId_fkey" FOREIGN KEY ("emergenciaId") REFERENCES "emergencias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emergencias_bomberos_bomberoId_fkey" FOREIGN KEY ("bomberoId") REFERENCES "bomberos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guardias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "turno" TEXT NOT NULL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "guardias_bomberos" (
    "guardiaId" TEXT NOT NULL,
    "bomberoId" TEXT NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("guardiaId", "bomberoId"),
    CONSTRAINT "guardias_bomberos_guardiaId_fkey" FOREIGN KEY ("guardiaId") REFERENCES "guardias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "guardias_bomberos_bomberoId_fkey" FOREIGN KEY ("bomberoId") REFERENCES "bomberos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaPublicacion" DATETIME,
    "imagenUrl" TEXT,
    "autorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "lugar" TEXT,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "imagenUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bomberos_cip_key" ON "bomberos"("cip");

-- CreateIndex
CREATE UNIQUE INDEX "bomberos_dni_key" ON "bomberos"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "bomberos_userId_key" ON "bomberos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_codigo_key" ON "equipos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "items_inventario_codigo_key" ON "items_inventario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_cursoId_bomberoId_key" ON "matriculas"("cursoId", "bomberoId");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_medicas_bomberoId_key" ON "fichas_medicas"("bomberoId");

-- CreateIndex
CREATE UNIQUE INDEX "emergencias_codigoEmergencia_key" ON "emergencias"("codigoEmergencia");
