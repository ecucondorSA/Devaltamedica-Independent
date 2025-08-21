import React, { createContext, useContext } from 'react';

const UserPreferencesContext = createContext({});

export const UserPreferencesProvider = ({ children }: { children: React.ReactNode }) => (
  <UserPreferencesContext.Provider value={{}}>{children}</UserPreferencesContext.Provider>
);

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
} 