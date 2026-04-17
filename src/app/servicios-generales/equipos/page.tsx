import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const ESTADO_COLOR: Record<string, "green"|"yellow"|"red"|"gray"> = {
  OPERATIVO: "green", EN_REPARACION: "yellow", FUERA_DE_SERVICIO: "red", BAJA: "gray",
};

const equipos = [
  { id: "1", codigo: "EQ-001", nombre: "Motobomba Honda WP30", categoria: "BOMBEO", marca: "Honda", modelo: "WP30", estado: "OPERATIVO", ubicacion: "Almacén principal" },
  { id: "2", codigo: "EQ-002", nombre: "Motobomba TSURUMI", categoria: "BOMBEO", marca: "Tsurumi", modelo: "LB-480", estado: "EN_REPARACION", ubicacion: "Taller" },
  { id: "3", codigo: "EQ-003", nombre: "Escalera extensible 9m", categoria: "RESCATE", marca: null, modelo: null, estado: "OPERATIVO", ubicacion: "B-101" },
  { id: "4", codigo: "EQ-004", nombre: "Equipo de corte hidráulico Holmatro", categoria: "RESCATE", marca: "Holmatro", modelo: "SP4250CS", estado: "OPERATIVO", ubicacion: "R-101" },
  { id: "5", codigo: "EQ-005", nombre: "Mandil de aproximación al fuego", categoria: "EPP", marca: "MSA", modelo: null, estado: "OPERATIVO", ubicacion: "Almacén EPP" },
  { id: "6", codigo: "EQ-006", nombre: "Casco de bombero con visor", categoria: "EPP", marca: "Bullard", modelo: "FH2", estado: "OPERATIVO", ubicacion: "Almacén EPP" },
  { id: "7", codigo: "EQ-007", nombre: "Equipo autónomo de respiración SCBA", categoria: "EPP", marca: "Dräger", modelo: "PA90 Plus", estado: "OPERATIVO", ubicacion: "Almacén EPP" },
  { id: "8", codigo: "EQ-008", nombre: "Generador eléctrico 5KVA", categoria: "ENERGÍA", marca: "Hyundai", modelo: "DHY6000LE", estado: "FUERA_DE_SERVICIO", ubicacion: "Almacén" },
  { id: "9", codigo: "EQ-009", nombre: "Desfibrilador AED", categoria: "MÉDICO", marca: "Philips", modelo: "HeartStart FRx", estado: "OPERATIVO", ubicacion: "A-101" },
  { id: "10", codigo: "EQ-010", nombre: "Camilla de aluminio plegable", categoria: "MÉDICO", marca: null, modelo: null, estado: "OPERATIVO", ubicacion: "A-101" },
];

export default function EquiposPage() {
  const byCategoria: Record<string, typeof equipos> = {};
  equipos.forEach((e) => { byCategoria[e.categoria] = [...(byCategoria[e.categoria] ?? []), e]; });
  const operativos = equipos.filter((e) => e.estado === "OPERATIVO").length;

  return (
    <div className="space-y-5">
      <PageHeader icon={Boxes} title="Equipos" subtitle={`${operativos} operativos de ${equipos.length} total`} />

      {Object.entries(byCategoria).map(([cat, items]) => (
        <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">{cat}</h2>
            <span className="text-xs text-gray-400">{items.length} ítem{items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Código", "Nombre", "Marca / Modelo", "Ubicación", "Estado"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{eq.codigo}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{eq.nombre}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{[eq.marca, eq.modelo].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{eq.ubicacion ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge label={eq.estado.replace(/_/g, " ")} color={ESTADO_COLOR[eq.estado] ?? "gray"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
