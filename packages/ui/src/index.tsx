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

// ==================== CORPORATE COMPONENTS ====================
export * from './components/corporate';
export { default as ButtonCorporate } from './components/corporate/ButtonCorporate';
export {
  CardContentCorporate,
  default as CardCorporate,
  CardFooterCorporate,
  CardHeaderCorporate,
} from './components/corporate/CardCorporate';

// ==================== MEDICAL COMPONENTS ====================
export * from './components/medical';

// ==================== EMERGENCY COMPONENTS ====================
export * from './components/emergency';

// ==================== FORMS COMPONENTS ====================
export * from './components/forms';

// ==================== ANALYTICS COMPONENTS ====================
export * from './components/analytics';

// ==================== AI COMPONENTS ====================
export * from './components/ai';

// ==================== DASHBOARD COMPONENTS ====================
export * from './components/dashboard';

// ==================== AUDIT COMPONENTS ====================
export * from './components/audit';
export { AuditLogTable } from './components/audit/AuditLogTable';

// ==================== AUTH COMPONENTS ====================
// export * from './components/auth'; // Commented due to module error

// ==================== BILLING COMPONENTS ====================
export * from './components/billing';

// ==================== ONBOARDING COMPONENTS ====================
export { EnhancedPatientOnboarding } from './components/onboarding/EnhancedPatientOnboarding';

// ==================== 3D COMPONENTS ====================
export * from './components/3d';

// ==================== TABLE COMPONENTS ====================
export * from './components/table/Table';

// ==================== WEBRTC COMPONENTS ====================
export * from './components/webrtc';

// ==================== FEEDBACK COMPONENTS ====================
export * from './components/feedback';

// ==================== ROOT COMPONENTS ====================
// Dialog components
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';

// Switch component
export { Switch } from './switch';

// Tooltip components
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// DataTable component
export { DataTable } from './data-table';

// Calendar component
export { Calendar } from './calendar';

// Badge component from root
export { Badge } from './badge';

// Progress component from root
export { Progress } from './progress';

// Table components from root
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

// Input component from root
export { Input } from './input';

// Popover components
export { Popover, PopoverContent, PopoverTrigger } from './popover';

// DropdownMenu components
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

// Select components
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

// Tabs components
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

// Textarea component
export { Textarea } from './textarea';

// ==================== HOOKS ====================
export * from './hooks';

// ==================== PROVIDERS ====================
export * from './providers/ThemeProvider';

// ==================== UTILS ====================
export * from './lib/utils';
// export * from './utils/cn'; // Commented due to duplicate export

export default {};
