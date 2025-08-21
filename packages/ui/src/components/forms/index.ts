// 📋 FORMULARIOS MÉDICOS - EXPORTACIONES
// Componentes de formularios especializados para el dominio médico
// Incluye formularios de ingreso, consentimiento, prescripciones y más

// 📝 FORMULARIO DE INGRESO MÉDICO
export { 
  MedicalIntakeForm, 
  type MedicalIntakeFormProps,
  type MedicalIntakeData 
} from './MedicalIntakeForm';

// 🚨 COMPONENTES DE ERROR
export {
  FormError,
  default as FormErrorDefault
} from './FormError';

// 🏷️ ETIQUETAS DE FORMULARIO
export {
  FormLabel,
  FormLabelCompact,
  FormLabelLarge,
  default as FormLabelDefault
} from './FormLabel';

// 📦 GRUPOS DE FORMULARIO
export {
  FormGroup,
  FormGroupCompact,
  FormGroupHorizontal,
  default as FormGroupDefault
} from './FormGroup';

// 🔍 BÚSQUEDA Y FILTROS
export {
  SearchFilter,
  SearchFilterCompact,
  SearchFilterExpanded,
  default as SearchFilterDefault
} from './SearchFilter';