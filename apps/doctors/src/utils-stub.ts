// Stub temporal para @altamedica/utils hasta que se resuelva el problema de resolución de módulos

export const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const formatDate = (date: Date | string | number, format?: string, locale?: string) => {
  return new Date(date).toLocaleDateString(locale || 'es-MX');
};

export const getRelativeTime = (date: Date | string | number) => {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `hace ${days} días`;
  if (hours > 0) return `hace ${hours} horas`;
  if (minutes > 0) return `hace ${minutes} minutos`;
  return 'ahora';
};
