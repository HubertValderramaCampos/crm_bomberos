# Sistema de Gestión — Compañía de Bomberos Voluntarios N.° 150
### Cía. B. V. Brig. CBP Julio Upiachihua Cárdenas — Puente Piedra, Lima, Perú

Plataforma web integral para la gestión operativa, administrativa y formativa de la compañía. Construida con **Next.js 16**, **PostgreSQL** (Supabase) y múltiples módulos de **Inteligencia Artificial**.

---

## Inteligencia Artificial integrada

### 1. Clasificación automática de documentos con GPT-4o Vision

El módulo **Subir Documento** utiliza la API de OpenAI con el modelo `gpt-4o` en modo visión para analizar automáticamente cualquier imagen o fotografía de un documento físico:

- **Clasificación del tipo**: identifica si es un oficio institucional, oficio varios, solicitud de capacitación, contrato, acta u otro tipo de documento.
- **Extracción de datos estructurados**: lee y extrae campos como número de oficio, remitente, destinatario, fecha, asunto y descripción directamente del contenido visual del documento — sin OCR tradicional.
- **Matching de entidad con IA**: compara el nombre de empresa o institución detectado en el documento contra la base de datos de entidades registradas, sugiriendo la más probable con nivel de confianza (alta / media).
- **Creación de entidad inline**: si la entidad no existe, el sistema permite crearla en el momento sin interrumpir el flujo.
- **Fallback gracioso**: si la API no está disponible (cuota agotada, error de red), el documento se sube de todas formas y el usuario completa los datos manualmente — el proceso nunca se bloquea.

```
Usuario fotografía el documento con su celular
             ↓
   GPT-4o Vision analiza la imagen
             ↓
  Extrae: tipo · campos · empresa
             ↓
   Busca match en BD de entidades
             ↓
  Presenta formulario pre-rellenado
             ↓
    Usuario confirma y sube
```

**Endpoint:** `POST /api/analizar-documento`
**Modelo:** `gpt-4o` (multimodal)
**Input:** imagen en base64 (foto o escaneo)
**Output:** JSON estructurado con tipo, datos del documento y entidad sugerida

---

### 2. Reconocimiento facial para asistencia formativa (face-api.js)

El módulo **Gestión Formativa** implementa reconocimiento facial completamente *client-side* usando `@vladmandic/face-api` (TensorFlow.js en el navegador) para registrar la asistencia de aspirantes y postulantes sin enviar datos biométricos al servidor.

#### Entrenamiento del modelo personal

- Flujo de **4 pasos guiados** con validación real de pose: frente, izquierda, derecha, arriba.
- **Validación de pose con landmarks de 68 puntos**:
  - *Giro lateral*: mide el desplazamiento de la punta de nariz respecto al centro entre ambos ojos, normalizado por el ancho inter-ocular.
  - *Inclinación vertical*: ratio entre la distancia nariz-barbilla y la distancia nariz-puente — detecta si el usuario realmente levantó el mentón.
- **Buffer del mejor momento**: acumula los frames con mayor confianza de pose durante cada paso y promedia los 3 mejores descriptores — garantiza capturar el ángulo real correcto, no el primero disponible.
- El descriptor final es el **promedio ponderado de 4 capturas** (una por pose), generando un embedding de 128 dimensiones robusto a variaciones de iluminación y ángulo.
- Los 128 números se almacenan en PostgreSQL (`face_descriptor FLOAT8[]`). **Ninguna imagen se guarda nunca**.

#### Verificación de identidad al marcar asistencia

- Captura un frame en tiempo real, extrae el descriptor con face-api y calcula la **distancia euclidiana** contra el embedding registrado.
- Umbral de similitud: `distancia < 0.5` → misma persona → asistencia válida.
- Todo el procesamiento ocurre **en el navegador** (WebAssembly) — cero datos biométricos viajan al servidor.

#### Verificación de ubicación GPS

- Coordenadas del dispositivo validadas contra el cuartel (`-11.8286°S, -77.1023°W`) con radio de 50 m.
- Detecta automáticamente si la asistencia es **regular** (dentro del horario programado configurado por Instrucción) o **extra** (fuera de horario — pide motivo al aspirante).

```
Aspirante abre la app estando en el cuartel
             ↓
   GPS verifica ubicación (≤ 50 m)
             ↓
  Cámara captura rostro en tiempo real
             ↓
face-api.js extrae descriptor (128 números)
     [procesado 100% en el navegador]
             ↓
  Distancia euclidiana vs BD (< 0.5)
             ↓
      Marca entrada / salida
```

**Modelos utilizados (client-side, WebAssembly):**

| Modelo | Función |
|---|---|
| `TinyFaceDetector` | Detección rápida del rostro en el frame |
| `FaceLandmark68Net` | 68 puntos de referencia para validar pose |
| `FaceRecognitionNet` | Embedding de 128 dimensiones para identificación |

---

## Módulos del sistema

### Gestión Operativa
- **Operatividad** — estado en tiempo real: turno activo, flota, emergencias
- **Partes de emergencia** — registro completo con botones de navegación que extraen coordenadas GPS del sistema nacional SGNORTE para abrir Google Maps / Waze con ubicación exacta
- **Estadísticas** — análisis exclusivo de emergencias (excluye comisiones), gráficas de categoría, tiempos de respuesta, uso de vehículos
- **Evaluaciones de Emergencia (APH)** — formato de evaluación de Atención Prehospitalaria vinculado a partes; el jefe asigna un evaluador que completa 8 secciones con scoring 1–5 por ítem para múltiples efectivos evaluados

### Gestión Administrativa
- **Programación** — calendario de actividades con registro de asistencia al finalizar; gráficas de efectivos que cancelan y sus justificaciones
- **Donaciones** — registro de bienes y servicios con tabla de ítems múltiples por donación
- **Oficios** — gestión documental con clasificación automática por IA
- **Entidades** — directorio de empresas, instituciones públicas, colegios y asociaciones

### Gestión Comercial
- **Encuestas de satisfacción** — generación de enlaces vinculados a eventos de capacitación; dashboard con gráficas de calificaciones por sección, aspectos de mejora y distribución por entidad
- **Socios estratégicos** — ranking de donantes y clasificación por tipo de apoyo
- **Proyección social** — calendario de eventos comunitarios

### Gestión Formativa *(aspirantes y postulantes)*
- Inicio personalizado con historial de asistencias
- **Registro facial + GPS** para marcar entrada / salida (ver sección de IA)
- Horarios programados configurables por el área de Instrucción
- Reporte con gráficas: días programados vs extras, cumplimiento por efectivo

### Sistema de permisos
- Permisos por sección para cuentas de área (restringen, no habilitan)
- Permisos por racha de asistencia para bomberos (configurable 0–4 semanas o bloqueado)
- Categorías: Bombero, Aspirante, Postulante — cada una con acceso diferenciado

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS, Recharts |
| Backend | Next.js API Routes (Node.js) |
| Base de datos | PostgreSQL 15 (Supabase) |
| Autenticación | NextAuth.js v4 (JWT) |
| **IA — documentos** | **OpenAI GPT-4o Vision API** |
| **IA — reconocimiento facial** | **@vladmandic/face-api (TensorFlow.js, client-side)** |
| Modelos faciales | TinyFaceDetector + FaceLandmark68Net + FaceRecognitionNet |
| Almacenamiento | Supabase Storage |
| Deploy | Vercel |

---

## Variables de entorno requeridas

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Instalación local

```bash
git clone https://github.com/HubertValderramaCampos/crm_bomberos.git
cd crm_bomberos
npm install
# Copiar y completar variables de entorno
npm run dev
```

---

*Sistema desarrollado para la Compañía de Bomberos Voluntarios N.° 150 — Puente Piedra, Lima, Perú.*
