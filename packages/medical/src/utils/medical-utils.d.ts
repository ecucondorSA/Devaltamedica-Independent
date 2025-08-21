export declare const encriptarDatosPHI: (data: string) => string;
export declare const desencriptarDatosPHI: (encryptedData: string) => string;
export declare const enmascararDatosSensibles: (data: string, tipo: "dni" | "telefono" | "email") => string;
export declare const validarDNI: (dni: string) => boolean;
export declare const validarCUIL: (cuil: string) => boolean;
export declare const validarTelefonoArgentino: (telefono: string) => boolean;
export declare const validarEmailMedico: (email: string) => boolean;
export declare const validarFechaNacimiento: (fecha: Date) => {
    valido: boolean;
    mensaje?: string;
};
export declare const formatearDNI: (dni: string) => string;
export declare const formatearTelefono: (telefono: string) => string;
export declare const formatearFecha: (fecha: Date, formato?: "corto" | "largo" | "completo") => string;
export declare const calcularEdad: (fechaNacimiento: Date) => number;
export declare const calcularIMC: (peso: number, altura: number) => {
    imc: number;
    categoria: string;
};
export declare const generarNumeroHistoriaClinica: () => string;
export declare const generarIdCita: (medicoId: string, fecha: Date) => string;
export declare const verificarConsentimientoHIPAA: (fechaConsentimiento: Date, revocacion?: Date) => {
    valido: boolean;
    mensaje?: string;
};
export declare const normalizarTexto: (texto: string) => string;
export declare const buscarCoincidenciaNombre: (textoCompleto: string, terminoBusqueda: string) => boolean;
export declare const obtenerProximaFechaLaboral: (fecha: Date) => Date;
export declare const esHorarioLaboral: (fecha: Date) => boolean;
export declare const PROVINCIAS_ARGENTINA: {
    codigo: string;
    nombre: string;
}[];
export declare const OBRAS_SOCIALES_PRINCIPALES: string[];
export declare const ESPECIALIDADES_MEDICAS: string[];
//# sourceMappingURL=medical-utils.d.ts.map