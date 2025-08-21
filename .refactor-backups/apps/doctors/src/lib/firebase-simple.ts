"use client";

// Fallback mínimo y seguro para inicialización simple de Firebase.
// En el MVP de telemedicina no dependemos de Firebase en cliente, así que este stub es no-op.
// Si en el futuro se requiere, podemos migrar a los wrappers de @altamedica/firebase.
export function initializeFirebaseSimple(): void {
  // No-op: evita fallos de importación y permite que el layout continúe.
}
