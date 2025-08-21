// TODO: Definir estos tipos en @altamedica/types
// Stubs temporales para permitir el build
interface BAA {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  history: any[];
  version: any;
  [key: string]: any;
}

interface BAAStatus {
  [key: string]: any;
}

interface CreateBAA {
  createdBy: string;
  [key: string]: any;
}

interface UpdateBAA {
  [key: string]: any;
}

interface SignBAA {
  [key: string]: any;
}

interface BAATemplate {
  [key: string]: any;
}

// Funciones stub temporales
const generateBAAId = (): string => `baa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const isBAAActive = (): boolean => true;
const isBAASignedByBothParties = (): boolean => false;
const getBAAComplianceStatus = (): any => ({ compliant: true });
import * as crypto from 'crypto';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../adapters/firebase';

import { logger } from './logger.service';
/**
 * Servicio de Business Associate Agreements (BAA)
 * Gestiona acuerdos de asociados de negocio para cumplimiento HIPAA
 * Incluye firma digital, versionado y seguimiento de compliance
 */

export class BAAService {
  private readonly COLLECTION = 'business_associate_agreements';
  private readonly TEMPLATES_COLLECTION = 'baa_templates';
  private readonly ONBOARDING_COLLECTION = 'baa_onboarding';

  private db = getFirebaseFirestore();

  /**
   * Crea un nuevo BAA
   */
  async createBAA(data: CreateBAA): Promise<BAA> {
    try {
      const baaId = generateBAAId();
      const now = new Date();

      const baa: BAA = {
        id: baaId,
        ...data,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        version: {
          number: 1,
          effectiveDate: now,
          expirationDate: null,
        },
        history: [
          {
            action: 'created',
            timestamp: now,
            userId: data.createdBy,
            changes: { status: 'draft' },
          },
        ],
      };

      // Guardar en Firestore
      const baaRef = doc(this.db, this.COLLECTION, baaId);
      await setDoc(baaRef, {
        ...baa,
        createdAt: Timestamp.fromDate(baa.createdAt),
        updatedAt: Timestamp.fromDate(baa.updatedAt),
        version: {
          ...baa.version,
          effectiveDate: Timestamp.fromDate(baa.version.effectiveDate),
          expirationDate: baa.version.expirationDate
            ? Timestamp.fromDate(baa.version.expirationDate)
            : null,
        },
      });

      // Registrar en log de auditoría
      await this.logBAAEvent(baaId, 'created', data.createdBy);

      return baa;
    } catch (error) {
      logger.error('[BAA Service] Error creating BAA:', error);
      throw new Error('Error al crear el BAA');
    }
  }

  /**
   * Obtiene un BAA por ID
   */
  async getBAAById(baaId: string): Promise<BAA | null> {
    try {
      const baaRef = doc(this.db, this.COLLECTION, baaId);
      const baaDoc = await getDoc(baaRef);

      if (!baaDoc.exists()) {
        return null;
      }

      const data = baaDoc.data();
      return this.formatBAAFromFirestore(data);
    } catch (error) {
      logger.error('[BAA Service] Error getting BAA:', error);
      throw new Error('Error al obtener el BAA');
    }
  }

  /**
   * Obtiene todos los BAAs de una empresa
   */
  async getCompanyBAAs(companyId: string): Promise<BAA[]> {
    try {
      const baasQuery = query(
        collection(this.db, this.COLLECTION),
        where('businessAssociateId', '==', companyId),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(baasQuery);
      const baas: BAA[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        baas.push(this.formatBAAFromFirestore(data));
      });

      return baas;
    } catch (error) {
      logger.error('[BAA Service] Error getting company BAAs:', error);
      throw new Error('Error al obtener los BAAs de la empresa');
    }
  }

  /**
   * Obtiene el BAA activo de una empresa
   */
  async getActiveCompanyBAA(companyId: string): Promise<BAA | null> {
    try {
      const baasQuery = query(
        collection(this.db, this.COLLECTION),
        where('businessAssociateId', '==', companyId),
        where('status', '==', 'active'),
        orderBy('version.effectiveDate', 'desc'),
        limit(1),
      );

      const snapshot = await getDocs(baasQuery);

      if (snapshot.empty) {
        return null;
      }

      const data = snapshot.docs[0].data();
      const baa = this.formatBAAFromFirestore(data);

      // Verificar que realmente esté activo
      if (!isBAAActive()) {
        // Si expiró, actualizar estado
        await this.updateBAAStatus(baa.id, 'expired' as any);
        return null;
      }

      return baa;
    } catch (error) {
      logger.error('[BAA Service] Error getting active BAA:', error);
      throw new Error('Error al obtener el BAA activo');
    }
  }

  /**
   * Actualiza un BAA
   */
  async updateBAA(baaId: string, updates: UpdateBAA, updatedBy: string): Promise<BAA> {
    try {
      const baaRef = doc(this.db, this.COLLECTION, baaId);
      const baaDoc = await getDoc(baaRef);

      if (!baaDoc.exists()) {
        throw new Error('BAA no encontrado');
      }

      const currentBAA = this.formatBAAFromFirestore(baaDoc.data());
      const now = new Date();

      // Preparar actualizaciones
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy,
      };

      // Agregar a historial
      const historyEntry = {
        action: 'updated',
        timestamp: now,
        userId: updatedBy,
        changes: updates,
      };

      updateData.history = [...(currentBAA.history || []), historyEntry];

      // Actualizar en Firestore
      await updateDoc(baaRef, updateData);

      // Registrar en auditoría
      await this.logBAAEvent(baaId, 'updated', updatedBy, updates);

      // Obtener y retornar BAA actualizado
      return (await this.getBAAById(baaId)) as BAA;
    } catch (error) {
      logger.error('[BAA Service] Error updating BAA:', error);
      throw error;
    }
  }

  /**
   * Firma un BAA
   */
  async signBAA(
    signData: SignBAA,
    signerInfo: {
      userId: string;
      userType: 'covered_entity' | 'business_associate';
      ipAddress: string;
      userAgent?: string;
    },
  ): Promise<BAA> {
    try {
      const baa = await this.getBAAById(signData.baaId);

      if (!baa) {
        throw new Error('BAA no encontrado');
      }

      // Verificar que el BAA esté listo para firmar
      if (baa.status !== 'pending_signature') {
        throw new Error('El BAA no está listo para ser firmado');
      }

      const now = new Date();

      // Crear firma digital
      const signature = {
        signedBy: signerInfo.userId,
        signedAt: now,
        ipAddress: signerInfo.ipAddress,
        userAgent: signerInfo.userAgent,
        signatureMethod: signData.signatureMethod || ('electronic' as const),
        signatureData: this.generateSignatureHash(signData, signerInfo),
        certificateId: signData.certificateId,
      };

      // Determinar qué firma actualizar
      const updates: UpdateBAA = {};

      if (signerInfo.userType === 'covered_entity') {
        updates.coveredEntitySignature = signature;
      } else {
        updates.businessAssociateSignature = signature;
      }

      // Si ambas partes han firmado, activar el BAA
      const updatedBAA = { ...baa, ...updates };
      if (isBAASignedByBothParties()) {
        updates.status = 'active';

        // Establecer fecha de revisión
        const nextReviewDate = new Date();
        nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
        updates.nextReviewDate = nextReviewDate;
      }

      // Actualizar BAA
      const finalBAA = await this.updateBAA(signData.baaId, updates, signerInfo.userId);

      // Registrar firma en auditoría
      await this.logBAAEvent(signData.baaId, 'signed', signerInfo.userId, {
        signerType: signerInfo.userType,
      });

      // Si está completamente firmado, notificar
      if (finalBAA.status === 'active') {
        await this.notifyBAAActivation(finalBAA);
      }

      return finalBAA;
    } catch (error) {
      logger.error('[BAA Service] Error signing BAA:', error);
      throw error;
    }
  }

  /**
   * Inicia el proceso de onboarding de BAA para una empresa
   */
  async startBAAOnboarding(
    companyId: string,
    companyInfo: any,
  ): Promise<{
    onboardingId: string;
    baaId: string;
    nextStep: string;
  }> {
    try {
      // Verificar si ya hay un BAA activo
      const existingBAA = await this.getActiveCompanyBAA(companyId);
      if (existingBAA) {
        throw new Error('La empresa ya tiene un BAA activo');
      }

      // Obtener template de BAA
      const template = await this.getDefaultBAATemplate();
      if (!template) {
        throw new Error('No hay template de BAA disponible');
      }

      // Crear BAA en estado draft
      const baa = await this.createBAA({
        status: 'draft',
        coveredEntityId: 'altamedica_platform',
        businessAssociateId: companyId,
        coveredEntityInfo: {
          legalName: 'AltaMedica Platform S.A.',
          taxId: '30-71234567-9',
          address: {
            street: 'Av. Corrientes 1234',
            city: 'Buenos Aires',
            state: 'CABA',
            zipCode: 'C1043',
            country: 'Argentina',
          },
          contactPerson: {
            name: 'Legal Department',
            title: 'Compliance Officer',
            email: 'legal@altamedica.com',
            phone: '+54 11 4000-0000',
          },
          entityType: 'healthcare_provider',
        },
        businessAssociateInfo: companyInfo,
        version: {
          versionNumber: template.version,
          effectiveDate: new Date(),
          language: 'es',
          templateId: template.id,
        },
        obligations: {
          implementSafeguards: true,
          reportBreaches: true,
          breachNotificationPeriod: 60,
          useOnlyAsPermitted: true,
          minimumNecessary: true,
          deIdentification: false,
          subcontractorsAllowed: false,
          subcontractorBAARequired: true,
          secureDestruction: true,
          returnPHIOnTermination: true,
          allowAudits: true,
          auditFrequency: 'annual',
          indemnification: true,
          governingLaw: 'Argentina',
          disputeResolution: 'mediation',
        },
        permittedPurposes: [
          'Prestación de servicios de salud',
          'Facturación y cobros',
          'Operaciones de atención médica',
          'Mejora de calidad',
        ],
        permittedPHITypes: [
          'Información demográfica',
          'Información de contacto',
          'Historial médico',
          'Información de seguros',
        ],
        createdBy: 'system',
        updatedBy: 'system',
      });

      // Crear registro de onboarding
      const onboardingId = `onb_${Date.now().toString(36)}`;
      const onboardingRef = doc(this.db, this.ONBOARDING_COLLECTION, onboardingId);

      await setDoc(onboardingRef, {
        id: onboardingId,
        companyId,
        baaId: baa.id,
        status: 'in_progress',
        currentStep: 'review_terms',
        steps: [
          { name: 'company_info', status: 'completed', completedAt: Timestamp.now() },
          { name: 'review_terms', status: 'pending' },
          { name: 'accept_obligations', status: 'pending' },
          { name: 'sign_agreement', status: 'pending' },
          { name: 'verification', status: 'pending' },
        ],
        startedAt: serverTimestamp(),
        metadata: {
          templateVersion: template.version,
          language: 'es',
        },
      });

      return {
        onboardingId,
        baaId: baa.id,
        nextStep: 'review_terms',
      };
    } catch (error) {
      logger.error('[BAA Service] Error starting onboarding:', error);
      throw error;
    }
  }

  /**
   * Avanza al siguiente paso del onboarding
   */
  async progressOnboarding(
    onboardingId: string,
    currentStep: string,
    stepData: any,
    userId: string,
  ): Promise<{
    nextStep: string | null;
    completed: boolean;
    baaId?: string;
  }> {
    try {
      const onboardingRef = doc(this.db, this.ONBOARDING_COLLECTION, onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error('Proceso de onboarding no encontrado');
      }

      const onboarding = onboardingDoc.data();
      const steps = onboarding.steps;

      // Encontrar y actualizar el paso actual
      const currentIndex = steps.findIndex((s: any) => s.name === currentStep);
      if (currentIndex === -1) {
        throw new Error('Paso de onboarding inválido');
      }

      steps[currentIndex].status = 'completed';
      steps[currentIndex].completedAt = Timestamp.now();
      steps[currentIndex].data = stepData;

      // Determinar siguiente paso
      const nextIndex = currentIndex + 1;
      let nextStep = null;
      let completed = false;

      if (nextIndex < steps.length) {
        steps[nextIndex].status = 'in_progress';
        nextStep = steps[nextIndex].name;
      } else {
        completed = true;
      }

      // Actualizar onboarding
      await updateDoc(onboardingRef, {
        steps,
        currentStep: nextStep,
        status: completed ? 'completed' : 'in_progress',
        ...(completed && { completedAt: serverTimestamp() }),
      });

      // Si es el paso de firma, actualizar el BAA
      if (currentStep === 'sign_agreement' && stepData.signature) {
        await this.signBAA(
          {
            baaId: onboarding.baaId,
            signatureData: stepData.signature,
            signatureMethod: 'electronic',
          },
          {
            userId,
            userType: 'business_associate',
            ipAddress: stepData.ipAddress || 'unknown',
            userAgent: stepData.userAgent,
          },
        );
      }

      // Si se completó, activar el BAA
      if (completed) {
        await this.updateBAAStatus(onboarding.baaId, 'pending_signature' as any);

        // Auto-firmar por parte de la entidad cubierta
        await this.signBAA(
          {
            baaId: onboarding.baaId,
            signatureData: 'auto_signed_by_system',
            signatureMethod: 'electronic',
          },
          {
            userId: 'system',
            userType: 'covered_entity',
            ipAddress: '127.0.0.1',
            userAgent: 'AltaMedica System',
          },
        );
      }

      return {
        nextStep,
        completed,
        baaId: onboarding.baaId,
      };
    } catch (error) {
      logger.error('[BAA Service] Error progressing onboarding:', error);
      throw error;
    }
  }

  /**
   * Obtiene el template de BAA por defecto
   */
  async getDefaultBAATemplate(): Promise<BAATemplate | null> {
    try {
      const templatesQuery = query(
        collection(this.db, this.TEMPLATES_COLLECTION),
        where('isActive', '==', true),
        where('language', '==', 'es'),
        orderBy('version', 'desc'),
        limit(1),
      );

      const snapshot = await getDocs(templatesQuery);

      if (snapshot.empty) {
        // Crear template por defecto si no existe
        return await this.createDefaultTemplate();
      }

      const data = snapshot.docs[0].data();
      return data as BAATemplate;
    } catch (error) {
      logger.error('[BAA Service] Error getting template:', error);
      return null;
    }
  }

  /**
   * Crea el template por defecto de BAA
   */
  private async createDefaultTemplate(): Promise<BAATemplate> {
    const template: BAATemplate = {
      id: 'baa_template_default_es',
      name: 'Acuerdo de Asociado de Negocio - Estándar',
      version: '1.0',
      language: 'es',
      content: this.getDefaultTemplateContent(),
      variables: [
        {
          key: 'companyName',
          label: 'Nombre de la Empresa',
          type: 'text',
          required: true,
        },
        {
          key: 'effectiveDate',
          label: 'Fecha de Vigencia',
          type: 'date',
          required: true,
        },
        {
          key: 'contactEmail',
          label: 'Email de Contacto',
          type: 'text',
          required: true,
        },
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const templateRef = doc(this.db, this.TEMPLATES_COLLECTION, template.id);
    await setDoc(templateRef, {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return template;
  }

  /**
   * Obtiene el contenido del template por defecto
   */
  private getDefaultTemplateContent(): string {
    return `
# ACUERDO DE ASOCIADO DE NEGOCIO (BAA)

Este Acuerdo de Asociado de Negocio ("Acuerdo") se celebra entre **AltaMedica Platform S.A.** ("Entidad Cubierta") y **{{companyName}}** ("Asociado de Negocio").

## 1. OBLIGACIONES DEL ASOCIADO DE NEGOCIO

El Asociado de Negocio acuerda:

### 1.1 Salvaguardas
Implementar salvaguardas administrativas, físicas y técnicas apropiadas para proteger la confidencialidad, integridad y disponibilidad de la PHI.

### 1.2 Notificación de Brechas
Notificar a la Entidad Cubierta dentro de 60 días sobre cualquier uso o divulgación no autorizada de PHI.

### 1.3 Uso Permitido
Usar y divulgar PHI solo según lo permitido por este Acuerdo y la ley aplicable.

### 1.4 Subcontratistas
No divulgar PHI a subcontratistas sin un acuerdo por escrito que contenga las mismas restricciones.

## 2. TÉRMINO Y TERMINACIÓN

### 2.1 Vigencia
Este Acuerdo entrará en vigor el {{effectiveDate}} y continuará hasta su terminación.

### 2.2 Terminación
Cualquier parte puede terminar este Acuerdo con 30 días de aviso por escrito.

### 2.3 Efecto de la Terminación
Al terminar, el Asociado de Negocio devolverá o destruirá toda la PHI de forma segura.

## 3. CUMPLIMIENTO NORMATIVO

Este Acuerdo cumple con:
- Ley 26.529 (Argentina) - Derechos del Paciente
- Ley 25.326 - Protección de Datos Personales
- Estándares HIPAA adaptados al contexto argentino

## 4. INDEMNIZACIÓN

El Asociado de Negocio indemnizará a la Entidad Cubierta por cualquier pérdida resultante del incumplimiento de este Acuerdo.

## 5. LEY APLICABLE

Este Acuerdo se regirá por las leyes de la República Argentina.

---

Al firmar electrónicamente, ambas partes aceptan los términos y condiciones establecidos en este Acuerdo.
    `;
  }

  /**
   * Actualiza el estado de un BAA
   */
  private async updateBAAStatus(baaId: string, status: BAAStatus): Promise<void> {
    try {
      const baaRef = doc(this.db, this.COLLECTION, baaId);
      await updateDoc(baaRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('[BAA Service] Error updating status:', error);
    }
  }

  /**
   * Genera hash de firma
   */
  private generateSignatureHash(signData: SignBAA, signerInfo: any): string {
    const data = JSON.stringify({
      baaId: signData.baaId,
      userId: signerInfo.userId,
      timestamp: new Date().toISOString(),
      ipAddress: signerInfo.ipAddress,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Formatea BAA desde Firestore
   */
  private formatBAAFromFirestore(data: any): BAA {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      version: {
        ...data.version,
        effectiveDate: data.version?.effectiveDate?.toDate() || new Date(),
        expirationDate: data.version?.expirationDate?.toDate(),
      },
      coveredEntitySignature: data.coveredEntitySignature
        ? {
            ...data.coveredEntitySignature,
            signedAt: data.coveredEntitySignature.signedAt?.toDate(),
          }
        : undefined,
      businessAssociateSignature: data.businessAssociateSignature
        ? {
            ...data.businessAssociateSignature,
            signedAt: data.businessAssociateSignature.signedAt?.toDate(),
          }
        : undefined,
      lastReviewDate: data.lastReviewDate?.toDate(),
      nextReviewDate: data.nextReviewDate?.toDate(),
      history:
        data.history?.map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate() || h.timestamp,
        })) || [],
    };
  }

  /**
   * Registra evento de BAA en auditoría
   */
  private async logBAAEvent(
    baaId: string,
    action: string,
    userId: string,
    metadata?: any,
  ): Promise<void> {
    try {
      const auditRef = doc(collection(this.db, 'baa_audit_logs'));
      await setDoc(auditRef, {
        baaId,
        action,
        userId,
        metadata,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      logger.error('[BAA Service] Error logging event:', error);
    }
  }

  /**
   * Notifica activación de BAA
   */
  private async notifyBAAActivation(baa: BAA): Promise<void> {
    // Aquí se integraría con el servicio de notificaciones
    logger.info('[BAA Service] BAA activated:', baa.id);
  }

  /**
   * Verifica compliance de un BAA
   */
  async verifyBAACompliance(baaId: string): Promise<{
    isCompliant: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const baa = await this.getBAAById(baaId);

      if (!baa) {
        throw new Error('BAA no encontrado');
      }

      const complianceStatus = getBAAComplianceStatus();
      let score = 100;
      const recommendations: string[] = [];

      // Calcular puntuación
      if (!complianceStatus.isCompliant) {
        score -= complianceStatus.issues.length * 10;
      }

      // Verificaciones adicionales
      if (!baa.obligations.implementSafeguards) {
        score -= 20;
        recommendations.push('Implementar salvaguardas de seguridad');
      }

      if (!baa.obligations.allowAudits) {
        score -= 15;
        recommendations.push('Permitir auditorías regulares');
      }

      if (baa.obligations.breachNotificationPeriod > 72) {
        score -= 10;
        recommendations.push('Reducir período de notificación de brechas a 72 horas');
      }

      // Actualizar puntuación en BAA
      await this.updateBAA(
        baaId,
        {
          complianceScore: Math.max(0, score),
          complianceIssues: complianceStatus.issues,
        },
        'system',
      );

      return {
        isCompliant: complianceStatus.isCompliant && score >= 80,
        score: Math.max(0, score),
        issues: complianceStatus.issues,
        recommendations,
      };
    } catch (error) {
      logger.error('[BAA Service] Error verifying compliance:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const baaService = new BAAService();
