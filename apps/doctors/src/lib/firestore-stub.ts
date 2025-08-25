// Stub temporal para firestore hasta que se resuelva el problema de resolución de módulos

export const db = {
  collection: (path: string) => ({
    doc: (id: string) => ({
      get: () => Promise.resolve({ data: () => null, exists: false }),
      set: (data: any) => Promise.resolve(),
      update: (data: any) => Promise.resolve(),
      delete: () => Promise.resolve(),
    }),
    add: (data: any) => Promise.resolve({ id: 'stub-id' }),
    where: (field: string, op: string, value: any) => ({
      get: () => Promise.resolve({ docs: [], empty: true }),
    }),
  }),
};
