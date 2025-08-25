// Stub temporal para auth hasta que se resuelva el problema de resolución de módulos

export const auth = async () => {
  return {
    user: {
      id: 'stub-user-id',
      email: 'stub@example.com',
      name: 'Stub User',
    },
  };
};
