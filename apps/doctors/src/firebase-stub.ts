// Stub temporal para @altamedica/firebase hasta que se resuelva el problema de resolución de módulos

export const initializeApp = () => ({});

export const getAuth = () => ({
  signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'stub-uid' } }),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: (callback: any) => callback({ uid: 'stub-uid' }),
});

export const getFirestore = () => ({
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ data: () => null, exists: false }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
    }),
  }),
});

export const getFirebaseAuth = () => ({
  currentUser: { uid: 'stub-uid' },
  onAuthStateChanged: (callback: any) => callback({ uid: 'stub-uid' }),
});

export const getFirebaseFirestore = () => ({
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ data: () => null, exists: false }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
    }),
  }),
});
