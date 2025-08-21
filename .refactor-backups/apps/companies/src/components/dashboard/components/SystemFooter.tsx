/**
 * 🏥 COMPONENTE DE FOOTER DEL SISTEMA
 * Muestra información del sistema y configuración
 */

interface SystemFooterProps {
  config: {
    whatsapp: { enabled: boolean; phoneNumber: string; apiKey: string; };
    api: { enabled: boolean; endpoint: string; apiKey: string; };
    iot: { enabled: boolean; devices: string[]; };
  };
}

export function SystemFooter({ config }: SystemFooterProps) {
  const getEnabledServices = () => {
    const services = [];
    if (config.whatsapp.enabled) services.push('WhatsApp');
    if (config.api.enabled) services.push('API');
    if (config.iot.enabled) services.push('IoT');
    return services.join(', ');
  };

  return (
    <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
      Sistema de Gestión Hospitalaria AltaMedica v4.3
      <br />
      Configurado para: {getEnabledServices()}
    </div>
  );
}
