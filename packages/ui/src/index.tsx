'use client';
// ==================== CORE COMPONENTS ====================
export * from './components/Badge';
export * from './components/Button';
export * from './components/Card';
export * from './components/Input';
export * from './components/LoadingSpinner';
export * from './components/Progress';
export * from './components/Separator';

// ==================== NAVIGATION COMPONENTS ====================
export * from './components/navigation';
export { default as UnifiedNavigation } from './components/navigation/UnifiedNavigation';

// ==================== CORPORATE COMPONENTS (NEW) ====================
export * from './components/corporate';
export { default as ButtonCorporate } from './components/corporate/ButtonCorporate';
export {
  CardContentCorporate,
  default as CardCorporate,
  CardFooterCorporate,
  CardHeaderCorporate,
} from './components/corporate/CardCorporate';

// ==================== MEDICAL COMPONENTS (NEW) ====================
export * from './components/medical';

// ==================== FORMS COMPONENTS (NEW) ====================
export * from './components/forms';

// ==================== ANALYTICS COMPONENTS (NEW) ====================
export * from './components/analytics';

// ==================== AI COMPONENTS (NEW) ====================
export * from './components/ai';

// ==================== DASHBOARD COMPONENTS (NEW) ====================
export * from './components/dashboard';

// ==================== 3D COMPONENTS (NEW) ====================
export * from './components/3d';

// ==================== TABLE COMPONENTS (NEW) ====================
export * from './components/table/Table';

// ==================== AUTH COMPONENTS (NEW) ====================
// TODO: Auth UI components (LoginForm, ProtectedRoute) pendientes de implementación real
// export { LoginForm } from './components/auth/LoginForm';
// export { ProtectedRoute } from './components/auth/ProtectedRoute';
// ==================== HOOKS (NEW) ====================
export * from './hooks';

// ==================== THEME (NEW) ====================
export { colors, medicalTokens } from './theme/colors';

// ==================== UTILS ====================
export * from './lib/utils';

// ==================== BACKWARD COMPATIBILITY ====================
export { Badge } from './components/Badge';
export { Button } from './components/Button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/Card';
export { Input } from './components/Input';
export { LoadingSpinner } from './components/LoadingSpinner';
export { Progress } from './components/Progress';
export { Separator } from './components/Separator';

// ==================== RADIX TABS (FALTABAN EN ESTE INDEX) ====================
// Exportar Tabs para que los consumidores (companies, etc.) puedan importar
// { Tabs, TabsList, TabsTrigger, TabsContent } desde '@altamedica/ui'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

// ==================== FORM COMPONENTS ====================
export { FormLabel as Label } from './components/forms/FormLabel';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Textarea } from './textarea';

// ==================== LEGACY EXPORTS (TO BE DEPRECATED) ====================
// LoadingSpinner re-export eliminado para evitar errores de referencia circular

// ==================== DASHBOARD COMPONENTS ====================
export { MetricCard, type MetricCardProps } from './components/dashboard/MetricCard';
export { StatsGrid, type StatsGridProps } from './components/dashboard/StatsGrid';
