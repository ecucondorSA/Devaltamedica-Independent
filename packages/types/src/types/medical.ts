// Tipos base para el sistema médico Altamedica
// Compliance: HIPAA, Ley Argentina de Protección de Datos Personales

export interface PacienteBase {
  id: string
  numeroHistoriaClinica: string
  
  // Datos demográficos básicos
  nombres: string
  apellidos: string
  tipoDocumento: 'DNI' | 'PASSPORT' | 'CEDULA' | 'LC' | 'LE'
  numeroDocumento: string
  fechaNacimiento: Date
  genero: 'M' | 'F' | 'X' | 'NO_ESPECIFICA'
  estadoCivil: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'UNION_LIBRE'
  
  // Información de contacto (encriptada)
  telefono?: string
  telefonoSecundario?: string
  email?: string
  
  // Dirección
  direccion: DireccionCompleta
  
  // Datos médicos básicos
  grupoSanguineo?: GrupoSanguineo
  factorRh?: '+' | '-'
  alergias?: string[]
  
  // Información de seguro
  obraSocial?: ObraSocial
  numeroAfiliado?: string
  
  // Metadatos del sistema
  fechaCreacion: Date
  fechaUltimaActualizacion: Date
  estadoPaciente: 'ACTIVO' | 'INACTIVO' | 'FALLECIDO' | 'TRANSFERIDO'
  
  // Compliance HIPAA
  consentimientoTratamientoDatos: boolean
  fechaConsentimiento: Date
  revocacionConsentimiento?: Date
}

export interface DireccionCompleta {
  calle: string
  numero: string
  piso?: string
  departamento?: string
  ciudad: string
  provincia: ProvinciaArgentina
  codigoPostal: string
  pais: string // Default: 'Argentina'
  coordenadas?: {
    latitud: number
    longitud: number
  }
}

export type ProvinciaArgentina = 
  | 'CABA'
  | 'BUENOS_AIRES'
  | 'CATAMARCA'
  | 'CHACO'
  | 'CHUBUT'
  | 'CORDOBA'
  | 'CORRIENTES'
  | 'ENTRE_RIOS'
  | 'FORMOSA'
  | 'JUJUY'
  | 'LA_PAMPA'
  | 'LA_RIOJA'
  | 'MENDOZA'
  | 'MISIONES'
  | 'NEUQUEN'
  | 'RIO_NEGRO'
  | 'SALTA'
  | 'SAN_JUAN'
  | 'SAN_LUIS'
  | 'SANTA_CRUZ'
  | 'SANTA_FE'
  | 'SANTIAGO_DEL_ESTERO'
  | 'TIERRA_DEL_FUEGO'
  | 'TUCUMAN'

export type GrupoSanguineo = 'A' | 'B' | 'AB' | 'O'

export interface ObraSocial {
  id: string
  nombre: string
  sigla: string
  codigoRNOS: string // Registro Nacional de Obras Sociales
  planCobertura: string
  vigenciaDesde: Date
  vigenciaHasta?: Date
}

// Tipos para citas médicas
export interface CitaMedica {
  id: string
  pacienteId: string
  medicoId: string
  
  // Información de la cita
  fechaCita: Date
  duracionMinutos: number
  tipoCita: TipoCita
  modalidad: 'PRESENCIAL' | 'TELEMEDICINA' | 'DOMICILIO'
  
  // Estado y gestión
  estado: EstadoCita
  motivo: string
  observaciones?: string
  
  // Información de ubicación (para presencial)
  consultorio?: string
  direccionConsultorio?: string
  
  // Información de telemedicina
  linkVideoconferencia?: string
  plataformaTelemedicina?: 'ZOOM' | 'MEET' | 'TEAMS' | 'PROPIA'
  
  // Recordatorios
  recordatorios: Recordatorio[]
  
  // Metadatos
  fechaCreacion: Date
  fechaUltimaModificacion: Date
  creadoPor: string
}

export type TipoCita = 
  | 'CONSULTA_GENERAL'
  | 'CONTROL'
  | 'URGENCIA'
  | 'ESTUDIO'
  | 'PROCEDIMIENTO'
  | 'CIRUGIA'
  | 'REHABILITACION'
  | 'VACUNACION'

export type EstadoCita = 
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_CURSO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'NO_ASISTIO'
  | 'REPROGRAMADA'

export interface Recordatorio {
  tipo: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'LLAMADA'
  tiempoAnticipacion: number // minutos
  enviado: boolean
  fechaEnvio?: Date
}

// Tipos para profesionales médicos
export interface ProfesionalMedico {
  id: string
  matriculaNacional: string
  matriculaProvincial: string
  
  // Datos personales
  nombres: string
  apellidos: string
  tipoDocumento: 'DNI' | 'PASSPORT'
  numeroDocumento: string
  
  // Información profesional
  especialidades: EspecialidadMedica[]
  titulo: string
  universidadTitulo: string
  fechaTitulo: Date
  
  // Contacto profesional
  telefono: string
  email: string
  
  // Estado profesional
  estadoMatricula: 'ACTIVA' | 'SUSPENDIDA' | 'INHABILITADO'
  fechaIngresoSistema: Date
  
  // Configuración de agenda
  configAgenda: ConfiguracionAgenda
}

export interface EspecialidadMedica {
  codigo: string
  nombre: string
  certificacion?: string
  fechaCertificacion?: Date
}

export interface ConfiguracionAgenda {
  duracionCitaDefault: number // minutos
  horariosAtencion: HorarioAtencion[]
  diasLaborales: DiaSemana[]
  pausasAlmuerzo: PausaAlmuerzo[]
  limitePacientesDia: number
  anticipacionMaximaCita: number // días
}

export interface HorarioAtencion {
  diaSemana: DiaSemana
  horaInicio: string // formato HH:mm
  horaFin: string
}

export interface PausaAlmuerzo {
  diaSemana: DiaSemana
  horaInicio: string
  horaFin: string
}

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'

// Tipos para autenticación y seguridad
export interface UsuarioSistema {
  id: string
  email: string
  roles: RolSistema[]
  permisos: PermisoSistema[]
  
  // Información de sesión
  ultimoAcceso: Date
  sesionActiva: boolean
  tokensActivos: string[]
  
  // Seguridad HIPAA
  nivelAccesoPHI: NivelAccesoPHI
  registroAuditoria: RegistroAuditoria[]
}

export type RolSistema = 
  | 'ADMIN_SISTEMA'
  | 'MEDICO'
  | 'ENFERMERO'
  | 'RECEPCIONISTA'
  | 'PACIENTE'
  | 'AUDITOR'

export type PermisoSistema = 
  | 'LEER_PACIENTES'
  | 'ESCRIBIR_PACIENTES'
  | 'ELIMINAR_PACIENTES'
  | 'LEER_CITAS'
  | 'ESCRIBIR_CITAS'
  | 'CANCELAR_CITAS'
  | 'LEER_HISTORIA_CLINICA'
  | 'ESCRIBIR_HISTORIA_CLINICA'
  | 'ACCESO_REPORTES'
  | 'CONFIGURAR_SISTEMA'

export type NivelAccesoPHI = 'COMPLETO' | 'LIMITADO' | 'SOLO_LECTURA' | 'NINGUNO'

export interface RegistroAuditoria {
  timestamp: Date
  accion: AccionAuditoria
  recursoAccedido: string
  ipAddress: string
  userAgent: string
  resultado: 'EXITOSO' | 'FALLIDO' | 'BLOQUEADO'
}

export type AccionAuditoria = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'ACCESO_PACIENTE'
  | 'MODIFICACION_PACIENTE'
  | 'CREACION_CITA'
  | 'CANCELACION_CITA'
  | 'DESCARGA_REPORTE'
  | 'CAMBIO_CONFIGURACION'

// Tipos para respuestas de API
export interface RespuestaAPI<T = any> {
  exito: boolean
  datos?: T
  mensaje: string
  codigoError?: string
  timestamp: Date
  trazabilidad: string
}

export interface ErrorValidacion {
  campo: string
  mensaje: string
  valor?: any
}

export interface RespuestaValidacion {
  valido: boolean
  errores: ErrorValidacion[]
}

// Tipos para paginación
export interface ParametrosPaginacion {
  pagina: number
  tamanoPagina: number
  ordenarPor?: string
  direccionOrden?: 'ASC' | 'DESC'
}

export interface RespuestaPaginada<T> {
  datos: T[]
  totalElementos: number
  totalPaginas: number
  paginaActual: number
  tamanoPagina: number
}