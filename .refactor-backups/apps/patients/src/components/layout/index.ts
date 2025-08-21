// 🏗️ ÍNDICE DE COMPONENTES LAYOUT MODULARES - ALTAMEDICA
// Exportación centralizada de componentes modulares con compatibilidad total
// CONSERVADOR: Mantiene componentes originales, agrega versiones mejoradas

// 📋 Componentes modulares nuevos (mejorados)
export { default as PatientHeaderModular } from './PatientHeaderModular';
export { default as PatientSidebarModular } from './PatientSidebarModular';
export { default as PatientFooterModular } from './PatientFooterModular';

// 🔄 Componentes originales (preservados para compatibilidad)
export { default as PatientLayout } from './PatientLayout';
export { default as PatientSidebar } from './PatientSidebar';

// 📝 Tipos y interfaces de los componentes modulares
export type { PatientHeaderProps } from './PatientHeaderModular';
export type { SidebarConfig, SidebarProps, NavigationItem } from './PatientSidebarModular';
export type { FooterProps, FooterLink, FooterSection } from './PatientFooterModular';

// 🎯 LAYOUT COMPUESTO MODULAR (NUEVO)
export { default as PatientLayoutModular } from './PatientLayoutModular';

// 🔧 Error boundaries y utilidades
export { PatientLayoutErrorBoundary, PageHeader, ContentCard, CardHeader, CardContent } from './PatientLayout';

// 📊 Hook para gestión de layout state
export { useLayoutState } from './useLayoutState';

export default {
  // Componentes modulares (recomendados)
  PatientHeaderModular,
  PatientSidebarModular,
  PatientFooterModular,
  PatientLayoutModular,
  
  // Componentes originales (compatibilidad)
  PatientLayout,
  PatientSidebar,
  
  // Utilidades
  PatientLayoutErrorBoundary,
  PageHeader,
  ContentCard,
  CardHeader,
  CardContent
};