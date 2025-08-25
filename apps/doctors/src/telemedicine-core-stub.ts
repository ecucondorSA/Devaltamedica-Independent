// Stub temporal para @altamedica/telemedicine-core hasta que se resuelva el problema de resolución de módulos

export const useTelemedicineUnified = (config: any) => {
  return {
    initializeSession: () => Promise.resolve(),
    joinSession: () => Promise.resolve(),
    leaveSession: () => Promise.resolve(),
    isConnected: false,
    isLoading: false,
    error: null,
  };
};

// Exportar desde el subpath para compatibilidad
export { useTelemedicineUnified as default };

export const useWebRTCQoS = (config: any) => {
  return {
    metrics: null,
    qualityScore: 0,
    qualityIndicator: 'unknown',
    alerts: [],
    isMonitoring: false,
    startMonitoring: () => {},
    stopMonitoring: () => {},
  };
};
