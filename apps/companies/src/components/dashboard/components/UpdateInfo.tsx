/**
 * 🏥 COMPONENTE DE INFORMACIÓN DE ACTUALIZACIÓN
 * Muestra el estado de actualización y última modificación
 */


interface UpdateInfoProps {
  lastUpdate: Date;
  loading: boolean;
}

export function UpdateInfo({ lastUpdate, loading }: UpdateInfoProps) {
  return (
    <div className="text-center text-sm text-gray-500 mb-4">
      Última actualización: {lastUpdate.toLocaleTimeString()}
      {loading && <span className="ml-2">🔄 Actualizando...</span>}
    </div>
  );
}
