"use client";

import { useEffect, useState } from "react";
import { GuiaBienvenida } from "./GuiaBienvenida";
import { CambiarContrasena } from "./CambiarContrasena";
import { TourInteractivo } from "./TourInteractivo";

interface EstadoPerfil {
  perfil_completado: boolean;
  debe_cambiar_password: boolean;
  grado?: string;
  apellidos?: string;
  nombres?: string;
  fecha_nacimiento?: string | null;
  correo?: string | null;
  telefono?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
}

export function GuiaGlobal() {
  const [estado, setEstado]   = useState<EstadoPerfil | null>(null);
  // Cuentas sin ficha de bombero (ej. pilotos) van directo a "contrasena", sin la guía de bienvenida ni el tour.
  const [fase, setFase]       = useState<"guia" | "contrasena" | "tour" | "done">("guia");

  useEffect(() => {
    fetch("/api/perfil/estado")
      .then(r => r.json())
      .then((data: EstadoPerfil) => {
        if (!data.perfil_completado) {
          setEstado(data);
          setFase(data.apellidos ? "guia" : "contrasena");
        } else if (data.debe_cambiar_password) {
          setEstado(data);
          setFase("contrasena");
        }
      })
      .catch(() => {});
  }, []);

  if (!estado || fase === "done") return null;

  if (fase === "guia" && estado.apellidos) {
    const nombre = estado.apellidos.trim().split(",")[0].trim();
    return (
      <GuiaBienvenida
        nombre={nombre}
        grado={estado.grado ?? ""}
        datosIniciales={{
          fecha_nacimiento:             estado.fecha_nacimiento ?? null,
          correo:                       estado.correo ?? null,
          telefono:                     estado.telefono ?? null,
          contacto_emergencia_nombre:   estado.contacto_emergencia_nombre ?? null,
          contacto_emergencia_telefono: estado.contacto_emergencia_telefono ?? null,
        }}
        onComplete={() => setFase("contrasena")}
      />
    );
  }

  if (fase === "contrasena") {
    // Si venía de un perfil de bombero incompleto, sigue al tour; si solo era el cambio de contraseña forzado, termina aquí.
    return <CambiarContrasena onComplete={() => setFase(estado.apellidos ? "tour" : "done")} />;
  }

  return <TourInteractivo onComplete={() => setFase("done")} />;
}
