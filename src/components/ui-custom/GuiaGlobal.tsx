"use client";

import { useEffect, useState } from "react";
import { GuiaBienvenida } from "./GuiaBienvenida";
import { CambiarContrasena } from "./CambiarContrasena";
import { TourInteractivo } from "./TourInteractivo";

interface EstadoPerfil {
  perfil_completado: boolean;
  grado: string;
  apellidos: string;
  nombres: string;
  fecha_nacimiento: string | null;
  correo: string | null;
  telefono: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
}

export function GuiaGlobal() {
  const [estado, setEstado]   = useState<EstadoPerfil | null>(null);
  const [fase, setFase]       = useState<"guia" | "contrasena" | "tour" | "done">("guia");

  useEffect(() => {
    fetch("/api/perfil/estado")
      .then(r => r.json())
      .then((data: EstadoPerfil) => {
        if (!data.perfil_completado) setEstado(data);
      })
      .catch(() => {});
  }, []);

  if (!estado || fase === "done") return null;

  const nombre = estado.apellidos.trim().split(",")[0].trim();

  if (fase === "guia") {
    return (
      <GuiaBienvenida
        nombre={nombre}
        grado={estado.grado}
        datosIniciales={{
          fecha_nacimiento:             estado.fecha_nacimiento,
          correo:                       estado.correo,
          telefono:                     estado.telefono,
          contacto_emergencia_nombre:   estado.contacto_emergencia_nombre,
          contacto_emergencia_telefono: estado.contacto_emergencia_telefono,
        }}
        onComplete={() => setFase("contrasena")}
      />
    );
  }

  if (fase === "contrasena") {
    return <CambiarContrasena onComplete={() => setFase("tour")} />;
  }

  return <TourInteractivo onComplete={() => setFase("done")} />;
}
