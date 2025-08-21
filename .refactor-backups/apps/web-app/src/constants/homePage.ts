// Centralización de constantes de la Home para evitar duplicaciones.
// Si se añaden nuevas métricas o features, hacerlo aquí y reutilizar.
import { Brain, Shield, Stethoscope, Users } from "lucide-react";

export interface FeatureCardDef {
  icon: any; // Lucide icon component
  title: string;
  description: string;
  color: string; // tailwind text-* color
}

export const HOME_FEATURES: FeatureCardDef[] = [
  {
    icon: Stethoscope,
    title: "Historia Clínica Digital",
    description: "Centralización completa de registros médicos con acceso instantáneo y seguro",
    color: "text-primary-500"
  },
  {
    icon: Brain,
    title: "Diagnóstico Inteligente",
    description: "Análisis predictivo y sugerencias basadas en IA para decisiones clínicas precisas",
    color: "text-success-500"
  },
  {
    icon: Shield,
    title: "Compliance Regulatorio",
    description: "Cumplimiento total de normativas HIPAA y estándares argentinos de protección de datos",
    color: "text-alert-500"
  },
  {
    icon: Users,
    title: "Gestión de Consultorios",
    description: "Administración integral de turnos, facturación y seguimiento de pacientes",
    color: "text-primary-500"
  }
];

export interface StatDef { value: string; label: string }

export const HOME_STATS: StatDef[] = [
  { value: "50,000+", label: "Pacientes Activos" },
  { value: "1,200+", label: "Médicos Verificados" },
  { value: "98%", label: "Satisfacción" },
  { value: "24/7", label: "Disponibilidad" }
];
