import { BookOpen, Users, Clock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const TIPO_LABEL: Record<string, string> = {
  FORMACION_BASICA: "Formación Básica", ESPECIALIZACION: "Especialización",
  ACTUALIZACION: "Actualización", SIMULACRO: "Simulacro", CHARLA_EXTERNA: "Charla Externa",
};
const TIPO_COLOR: Record<string, "red"|"blue"|"green"|"yellow"|"orange"> = {
  FORMACION_BASICA: "red", ESPECIALIZACION: "blue", ACTUALIZACION: "green",
  SIMULACRO: "yellow", CHARLA_EXTERNA: "orange",
};

const cursos = [
  { id: "1", nombre: "Curso de Formación Básica de Bomberos", tipo: "FORMACION_BASICA", descripcion: "Curso introductorio para nuevos voluntarios.", instructor: "Cap. Quispe Mamani", entidad: "CGBVP", horas: 120, lugar: "Cuartel Central", fechaInicio: "2026-04-01", fechaFin: "2026-06-30", activo: true, cupoMaximo: 20, matriculas: [{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"}] },
  { id: "2", nombre: "Rescate Vehicular Avanzado", tipo: "ESPECIALIZACION", descripcion: "Técnicas avanzadas de extricación vehicular.", instructor: "Sgto. Paredes Cruz", entidad: "Cruz Roja Peruana", horas: 40, lugar: "Pista de entrenamiento", fechaInicio: "2026-04-22", fechaFin: "2026-04-26", activo: true, cupoMaximo: 10, matriculas: [{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"}] },
  { id: "3", nombre: "Primeros Auxilios y RCP", tipo: "ACTUALIZACION", descripcion: "Actualización en técnicas de primeros auxilios y reanimación.", instructor: "Tte. Flores Ramos", entidad: "Ministerio de Salud", horas: 16, lugar: "Sala de capacitación", fechaInicio: "2026-05-10", fechaFin: "2026-05-11", activo: true, cupoMaximo: 15, matriculas: [{estado:"MATRICULADO"},{estado:"MATRICULADO"},{estado:"MATRICULADO"}] },
  { id: "4", nombre: "Manejo de Materiales Peligrosos HAZMAT", tipo: "ESPECIALIZACION", descripcion: "Identificación y control de incidentes con materiales peligrosos.", instructor: "My. Torres Huanca", entidad: "CGBVP", horas: 60, lugar: "Cuartel Central", fechaInicio: "2025-10-01", fechaFin: "2025-11-30", activo: false, cupoMaximo: 12, matriculas: [{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"MATRICULADO"}] },
  { id: "5", nombre: "Simulacro de terremoto – Lima Norte", tipo: "SIMULACRO", descripcion: "Ejercicio de respuesta ante sismo de gran magnitud.", instructor: null, entidad: "Defensa Civil", horas: 8, lugar: "Sede municipal – Los Olivos", fechaInicio: "2025-09-15", fechaFin: "2025-09-15", activo: false, cupoMaximo: null, matriculas: [{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"},{estado:"APROBADO"}] },
];

export default function CursosPage() {
  const hoy = new Date();
  const activos = cursos.filter((c) => c.activo && new Date(c.fechaFin) >= hoy);
  const pasados = cursos.filter((c) => !c.activo || new Date(c.fechaFin) < hoy);

  function CursoCard({ curso }: { curso: (typeof cursos)[0] }) {
    const aprobados = curso.matriculas.filter((m) => m.estado === "APROBADO").length;
    const matriculados = curso.matriculas.filter((m) => m.estado === "MATRICULADO").length;
    const enCurso = new Date(curso.fechaInicio) <= hoy && new Date(curso.fechaFin) >= hoy;
    const proximo = new Date(curso.fechaInicio) > hoy;
    return (
      <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-sm transition-shadow ${enCurso ? "border-blue-300" : "border-gray-200"}`}>
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge label={TIPO_LABEL[curso.tipo] ?? curso.tipo} color={TIPO_COLOR[curso.tipo] ?? "gray"} />
                  {enCurso && <StatusBadge label="En Curso" color="blue" />}
                  {proximo && <StatusBadge label="Próximo" color="green" />}
                </div>
                <p className="font-bold text-gray-900">{curso.nombre}</p>
              </div>
            </div>
          </div>

          {curso.descripcion && <p className="text-sm text-gray-500 mb-3 ml-12">{curso.descripcion}</p>}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 ml-12 text-xs text-gray-500 mb-4">
            {curso.instructor && <div><span className="text-gray-400">Instructor:</span> {curso.instructor}</div>}
            {curso.entidad && <div><span className="text-gray-400">Entidad:</span> {curso.entidad}</div>}
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{curso.horas} horas</span></div>
            {curso.lugar && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate">{curso.lugar}</span></div>}
            <div><span className="text-gray-400">Inicio:</span> {new Date(curso.fechaInicio).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</div>
            <div><span className="text-gray-400">Término:</span> {new Date(curso.fechaFin).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>

          <div className="flex items-center gap-3 ml-12 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><Users className="w-3.5 h-3.5" />{matriculados} matriculados</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-green-700 font-medium">{aprobados} aprobados</span>
            {curso.cupoMaximo && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">Cupo: {curso.cupoMaximo}</span></>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="Cursos y Capacitaciones" subtitle={`${activos.length} activos · ${pasados.length} finalizados`} />

      {activos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Activos y próximos</p>
          <div className="grid md:grid-cols-2 gap-4">
            {activos.map((c) => <CursoCard key={c.id} curso={c} />)}
          </div>
        </div>
      )}

      {pasados.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Finalizados</p>
          <div className="grid md:grid-cols-2 gap-4">
            {pasados.map((c) => <CursoCard key={c.id} curso={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
