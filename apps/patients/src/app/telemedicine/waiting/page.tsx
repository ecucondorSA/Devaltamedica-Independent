"use client";
import React from "react";

export default function TelemedicineWaitingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Sala de Espera Virtual</h2>
        <p className="text-gray-600 mb-4">
          Por favor, espera a que el médico inicie la consulta.
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">No cierres esta ventana.</p>
      </div>
    </div>
  );
}
