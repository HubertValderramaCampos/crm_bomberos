"use client";

import { useState } from "react";
import { GuiaBienvenida } from "./GuiaBienvenida";

interface Props {
  nombre: string;
  grado: string;
  datosIniciales: {
    fecha_nacimiento: string | null;
    correo: string | null;
    telefono: string | null;
    contacto_emergencia_nombre: string | null;
    contacto_emergencia_telefono: string | null;
  };
}

export function GuiaBienvenidaWrapper({ nombre, grado, datosIniciales }: Props) {
  const [mostrar, setMostrar] = useState(true);

  if (!mostrar) return null;

  return (
    <GuiaBienvenida
      nombre={nombre}
      grado={grado}
      datosIniciales={datosIniciales}
      onComplete={() => setMostrar(false)}
    />
  );
}
