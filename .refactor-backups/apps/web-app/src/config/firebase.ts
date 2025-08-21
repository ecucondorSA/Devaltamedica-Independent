// Wrapper que re-exporta servicios desde @altamedica/firebase para evitar inicializaciones duplicadas
import {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
} from '@altamedica/firebase';

export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const storage = getFirebaseStorage();

export default app;
