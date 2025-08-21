// Adapter interno para acceso a Firebase desde @altamedica/shared
// Centraliza mocks y evita imports a rutas profundas dentro de @altamedica/firebase
// Usa el subpath exportado "./client" definido en package.json del paquete firebase
export { getFirebaseFirestore } from '@altamedica/firebase/client';
export type { Firestore } from 'firebase/firestore';
