// Utilidades médicas para Altamedica
// Incluye: encriptación PHI, validaciones médicas, formateo de datos Argentina
// TODO: Add crypto-js dependency to package.json
// import CryptoJS from 'crypto-js'
import { format, isValid, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '@altamedica/shared/services/logger.service';
// Configuración de encriptación HIPAA
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_PHI_ENCRYPTION_KEY || 'default-key-change-in-production';
const IV_LENGTH = 16;
// === FUNCIONES DE ENCRIPTACIÓN PHI ===
export const encriptarDatosPHI = (data) => {
    // TODO: Implement with crypto-js when dependency is added
    logger.warn('Encryption temporarily disabled - add crypto-js dependency');
    return data;
    /*
    try {
      const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
      return encrypted
    } catch (error) {
      logger.error('Error al encriptar datos PHI:', error)
      throw new Error('Error de encriptación')
    }
    */
};
export const desencriptarDatosPHI = (encryptedData) => {
    // TODO: Implement with crypto-js when dependency is added
    logger.warn('Decryption temporarily disabled - add crypto-js dependency');
    return encryptedData;
    /*
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      return decrypted
    } catch (error) {
      logger.error('Error al desencriptar datos PHI:', error)
      throw new Error('Error de desencriptación')
    }
    */
};
// Enmascarar datos sensibles para logs
export const enmascararDatosSensibles = (data, tipo) => {
    switch (tipo) {
        case 'dni':
            return data.replace(/(\d{2})(\d{3})(\d{3})/, '$1***$3');
        case 'telefono':
            return data.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3');
        case 'email':
            const [user, domain] = data.split('@');
            return `${user.charAt(0)}***@${domain}`;
        default:
            return '***';
    }
};
// === VALIDACIONES MÉDICAS ===
// Validar DNI argentino
export const validarDNI = (dni) => {
    const dniLimpio = dni.replace(/\D/g, '');
    return dniLimpio.length >= 7 && dniLimpio.length <= 8 && /^\d+$/.test(dniLimpio);
};
// Validar CUIL/CUIT argentino
export const validarCUIL = (cuil) => {
    const cuilLimpio = cuil.replace(/\D/g, '');
    if (cuilLimpio.length !== 11)
        return false;
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
        suma += parseInt(cuilLimpio[i]) * multiplicadores[i];
    }
    const resto = suma % 11;
    const digitoVerificador = resto < 2 ? resto : 11 - resto;
    return digitoVerificador === parseInt(cuilLimpio[10]);
};
// Validar número de teléfono argentino
export const validarTelefonoArgentino = (telefono) => {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    // Formato: +54 + código de área + número
    // Mínimo 10 dígitos (sin código país), máximo 11
    return telefonoLimpio.length >= 10 && telefonoLimpio.length <= 13;
};
// Validar email médico
export const validarEmailMedico = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};
// Validar fecha de nacimiento (debe ser realista)
export const validarFechaNacimiento = (fecha) => {
    if (!isValid(fecha)) {
        return { valido: false, mensaje: 'Fecha inválida' };
    }
    const hoy = new Date();
    const edad = differenceInYears(hoy, fecha);
    if (fecha > hoy) {
        return { valido: false, mensaje: 'La fecha no puede ser futura' };
    }
    if (edad > 150) {
        return { valido: false, mensaje: 'Edad no realista (mayor a 150 años)' };
    }
    return { valido: true };
};
// === FORMATEO DE DATOS ARGENTINOS ===
// Formatear DNI con puntos
export const formatearDNI = (dni) => {
    const dniLimpio = dni.replace(/\D/g, '');
    if (dniLimpio.length <= 8) {
        return dniLimpio.replace(/(\d{1,2})(\d{3})(\d{3})/, '$1.$2.$3');
    }
    return dni;
};
// Formatear teléfono argentino
export const formatearTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    // Formato: +54 9 11 1234-5678 (Buenos Aires)
    if (telefonoLimpio.startsWith('54')) {
        const sinCodigo = telefonoLimpio.substring(2);
        if (sinCodigo.startsWith('9')) {
            const numero = sinCodigo.substring(1);
            if (numero.length === 10) { // CABA/GBA
                return `+54 9 ${numero.substring(0, 2)} ${numero.substring(2, 6)}-${numero.substring(6)}`;
            }
        }
    }
    return telefono;
};
// Formatear fecha en español argentino
export const formatearFecha = (fecha, formato = 'corto') => {
    if (!isValid(fecha))
        return 'Fecha inválida';
    switch (formato) {
        case 'corto':
            return format(fecha, 'dd/MM/yyyy', { locale: es });
        case 'largo':
            return format(fecha, 'dd \'de\' MMMM \'de\' yyyy', { locale: es });
        case 'completo':
            return format(fecha, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es });
        default:
            return format(fecha, 'dd/MM/yyyy', { locale: es });
    }
};
// === CÁLCULOS MÉDICOS ===
// Calcular edad exacta
export const calcularEdad = (fechaNacimiento) => {
    return differenceInYears(new Date(), fechaNacimiento);
};
// Calcular IMC (Índice de Masa Corporal)
export const calcularIMC = (peso, altura) => {
    const imc = peso / Math.pow(altura / 100, 2);
    let categoria;
    if (imc < 18.5)
        categoria = 'Bajo peso';
    else if (imc < 25)
        categoria = 'Normal';
    else if (imc < 30)
        categoria = 'Sobrepeso';
    else
        categoria = 'Obesidad';
    return { imc: Math.round(imc * 100) / 100, categoria };
};
// === GENERADORES DE CÓDIGOS MÉDICOS ===
// Generar número de historia clínica único
export const generarNumeroHistoriaClinica = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `HC${año}${mes}${random}`;
};
// Generar ID de cita médica
export const generarIdCita = (medicoId, fecha) => {
    const fechaStr = format(fecha, 'yyyyMMdd');
    const hora = format(fecha, 'HHmm');
    const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    return `CITA${fechaStr}${hora}${medicoId.slice(-3)}${random}`;
};
// === VALIDACIONES DE COMPLIANCE ===
// Verificar consentimiento HIPAA
export const verificarConsentimientoHIPAA = (fechaConsentimiento, revocacion) => {
    if (revocacion && revocacion > fechaConsentimiento) {
        return { valido: false, mensaje: 'Consentimiento revocado' };
    }
    // El consentimiento debe ser reciente (máximo 2 años)
    const dosAñosAtras = new Date();
    dosAñosAtras.setFullYear(dosAñosAtras.getFullYear() - 2);
    if (fechaConsentimiento < dosAñosAtras) {
        return { valido: false, mensaje: 'Consentimiento vencido (más de 2 años)' };
    }
    return { valido: true };
};
// === UTILIDADES DE BÚSQUEDA ===
// Normalizar texto para búsqueda (remover acentos, convertir a minúsculas)
export const normalizarTexto = (texto) => {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .trim();
};
// Buscar coincidencias flexibles en nombres
export const buscarCoincidenciaNombre = (textoCompleto, terminoBusqueda) => {
    const textoNormalizado = normalizarTexto(textoCompleto);
    const terminoNormalizado = normalizarTexto(terminoBusqueda);
    return textoNormalizado.includes(terminoNormalizado);
};
// === UTILIDADES DE FECHA MÉDICA ===
// Obtener próxima fecha laboral
export const obtenerProximaFechaLaboral = (fecha) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    // Si es fin de semana, avanzar al lunes
    const diaSemana = nuevaFecha.getDay();
    if (diaSemana === 0) { // Domingo
        nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    }
    else if (diaSemana === 6) { // Sábado
        nuevaFecha.setDate(nuevaFecha.getDate() + 2);
    }
    return nuevaFecha;
};
// Verificar si es horario laboral médico
export const esHorarioLaboral = (fecha) => {
    const hora = fecha.getHours();
    const diaSemana = fecha.getDay();
    // Lunes a Viernes, 8:00 a 18:00
    return diaSemana >= 1 && diaSemana <= 5 && hora >= 8 && hora < 18;
};
// === CONSTANTES MÉDICAS ARGENTINAS ===
export const PROVINCIAS_ARGENTINA = [
    { codigo: 'CABA', nombre: 'Ciudad Autónoma de Buenos Aires' },
    { codigo: 'BUENOS_AIRES', nombre: 'Buenos Aires' },
    { codigo: 'CATAMARCA', nombre: 'Catamarca' },
    { codigo: 'CHACO', nombre: 'Chaco' },
    { codigo: 'CHUBUT', nombre: 'Chubut' },
    { codigo: 'CORDOBA', nombre: 'Córdoba' },
    { codigo: 'CORRIENTES', nombre: 'Corrientes' },
    { codigo: 'ENTRE_RIOS', nombre: 'Entre Ríos' },
    { codigo: 'FORMOSA', nombre: 'Formosa' },
    { codigo: 'JUJUY', nombre: 'Jujuy' },
    { codigo: 'LA_PAMPA', nombre: 'La Pampa' },
    { codigo: 'LA_RIOJA', nombre: 'La Rioja' },
    { codigo: 'MENDOZA', nombre: 'Mendoza' },
    { codigo: 'MISIONES', nombre: 'Misiones' },
    { codigo: 'NEUQUEN', nombre: 'Neuquén' },
    { codigo: 'RIO_NEGRO', nombre: 'Río Negro' },
    { codigo: 'SALTA', nombre: 'Salta' },
    { codigo: 'SAN_JUAN', nombre: 'San Juan' },
    { codigo: 'SAN_LUIS', nombre: 'San Luis' },
    { codigo: 'SANTA_CRUZ', nombre: 'Santa Cruz' },
    { codigo: 'SANTA_FE', nombre: 'Santa Fe' },
    { codigo: 'SANTIAGO_DEL_ESTERO', nombre: 'Santiago del Estero' },
    { codigo: 'TIERRA_DEL_FUEGO', nombre: 'Tierra del Fuego' },
    { codigo: 'TUCUMAN', nombre: 'Tucumán' }
];
export const OBRAS_SOCIALES_PRINCIPALES = [
    'OSDE',
    'Swiss Medical',
    'Medicus',
    'IOMA',
    'PAMI',
    'OSECAC',
    'OSMATA',
    'UPCN',
    'Hospital Italiano',
    'Hospital Alemán'
];
export const ESPECIALIDADES_MEDICAS = [
    'Medicina General',
    'Cardiología',
    'Dermatología',
    'Neurología',
    'Pediatría',
    'Ginecología',
    'Traumatología',
    'Oftalmología',
    'Otorrinolaringología',
    'Psiquiatría',
    'Endocrinología',
    'Gastroenterología',
    'Urología',
    'Neumología',
    'Reumatología'
];
//# sourceMappingURL=medical-utils.js.map