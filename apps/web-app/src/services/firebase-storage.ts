import { logger } from '@altamedica/shared/services/logger.service';

'use client'

import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
  // Re-exported Firebase functions from @altamedica/firebase
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp
} from '@altamedica/firebase'

export interface MedicalDocument {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  downloadURL: string
  storagePath: string
  // Metadata médico
  patientId: string
  doctorId?: string
  documentType: 'lab_result' | 'prescription' | 'medical_image' | 'insurance' | 'consent' | 'report' | 'other'
  category: 'clinical' | 'administrative' | 'insurance' | 'personal'
  confidentialityLevel: 'public' | 'restricted' | 'confidential' | 'top_secret'
  tags: string[]
  description?: string
  // Fechas
  createdAt: any
  updatedAt: any
  documentDate?: Timestamp // Fecha del documento médico real
  expiryDate?: Timestamp
  // Permisos
  accessPermissions: {
    [userId: string]: 'read' | 'write' | 'admin'
  }
  sharedWith: string[] // UIDs de usuarios con acceso
  // Metadata adicional
  metadata: {
    hospital?: string
    department?: string
    testType?: string
    diagnosisCode?: string
    icd10Code?: string
    urgency?: 'low' | 'medium' | 'high' | 'urgent'
    encrypted: boolean
    compressed: boolean
    ocr?: boolean // Si se aplicó OCR al documento
    ocrText?: string
  }
  // Versioning
  version: number
  previousVersions?: string[] // IDs de versiones anteriores
  // Estado
  status: 'active' | 'archived' | 'deleted'
  approved: boolean
  approvedBy?: string
  approvedAt?: any
}

export interface UploadProgress {
  bytesTransferred: number
  totalBytes: number
  percentage: number
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error'
}

export interface StorageService {
  // Subir documentos
  uploadMedicalDocument: (
    file: File,
    patientId: string,
    documentType: MedicalDocument['documentType'],
    metadata?: Partial<MedicalDocument['metadata']>,
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<MedicalDocument>
  
  uploadMultipleDocuments: (
    files: File[],
    patientId: string,
    documentType: MedicalDocument['documentType'],
    onProgress?: (progress: UploadProgress, fileIndex: number) => void
  ) => Promise<MedicalDocument[]>
  
  // Obtener documentos
  getPatientDocuments: (patientId: string, documentType?: MedicalDocument['documentType']) => Promise<MedicalDocument[]>
  getDoctorDocuments: (doctorId: string) => Promise<MedicalDocument[]>
  getDocumentById: (documentId: string) => Promise<MedicalDocument | null>
  getSharedDocuments: (userId: string) => Promise<MedicalDocument[]>
  
  // Gestionar permisos
  shareDocument: (documentId: string, userId: string, permission: 'read' | 'write') => Promise<void>
  revokeAccess: (documentId: string, userId: string) => Promise<void>
  updatePermissions: (documentId: string, permissions: { [userId: string]: 'read' | 'write' | 'admin' }) => Promise<void>
  
  // Descargar y previsualizar
  getDownloadURL: (documentId: string) => Promise<string>
  generatePreviewURL: (documentId: string) => Promise<string>
  
  // Gestionar documentos
  updateDocumentMetadata: (documentId: string, metadata: Partial<MedicalDocument>) => Promise<void>
  deleteDocument: (documentId: string, permanentDelete?: boolean) => Promise<void>
  restoreDocument: (documentId: string) => Promise<void>
  archiveDocument: (documentId: string) => Promise<void>
  
  // Búsqueda
  searchDocuments: (userId: string, searchTerm: string) => Promise<MedicalDocument[]>
  getDocumentsByTag: (userId: string, tags: string[]) => Promise<MedicalDocument[]>
  getDocumentsByDateRange: (userId: string, startDate: Date, endDate: Date) => Promise<MedicalDocument[]>
  
  // Compliance y seguridad
  auditDocumentAccess: (documentId: string, action: string) => Promise<void>
  encryptDocument: (documentId: string) => Promise<void>
  getAuditTrail: (documentId: string) => Promise<any[]>
}

class FirebaseStorageService implements StorageService {
  private documentsCollection = 'medical_documents'
  private auditCollection = 'document_audit'

  // Subir documentos
  async uploadMedicalDocument(
    file: File,
    patientId: string,
    documentType: MedicalDocument['documentType'],
    customMetadata: Partial<MedicalDocument['metadata']> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MedicalDocument> {
    try {
      const auth = getFirebaseAuth()
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('Usuario no autenticado')
      
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const storagePath = `medical-documents/${patientId}/${documentType}/${fileName}`
      
      // Crear referencia de storage
      const storage = getFirebaseStorage()
      const storageRef = ref(storage, storagePath)
      
      // Metadata de Firebase Storage
      // customMetadata debe ser Record<string,string>
      const baseCustom = {
        patientId,
        documentType,
        uploadedBy: currentUser.uid,
        originalName: file.name,
        ...customMetadata
      } as Record<string, any>

      const customMeta: Record<string, string> = {}
      Object.entries(baseCustom).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          customMeta[k] = typeof v === 'string' ? v : String(v)
        }
      })

      const storageMetadata = {
        contentType: file.type,
        customMetadata: customMeta
      }

      // Subir archivo con progreso
      const uploadTask = uploadBytesResumable(storageRef, file, storageMetadata)
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (onProgress) {
              const progress: UploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                state: snapshot.state as UploadProgress['state']
              }
              onProgress(progress)
            }
          },
          (error) => {
            reject(new Error(`Error subiendo archivo: ${error.message}`))
          },
          async () => {
            try {
              // Obtener URL de descarga
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              
              // Crear documento en Firestore
              const documentData: Omit<MedicalDocument, 'id'> = {
                fileName,
                originalName: file.name,
                fileSize: file.size,
                fileType: file.type,
                downloadURL,
                storagePath,
                patientId,
                doctorId: currentUser.uid,
                documentType,
                category: this.getCategoryFromType(documentType),
                confidentialityLevel: 'confidential',
                tags: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                accessPermissions: {
                  [patientId]: 'read',
                  [currentUser.uid]: 'admin'
                },
                sharedWith: [patientId, currentUser.uid],
                metadata: {
                  encrypted: false,
                  compressed: false,
                  ...customMetadata
                },
                version: 1,
                status: 'active',
                approved: false
              }

              // Guardar en Firestore
              const db = getFirebaseFirestore()
              const docRef = await addDoc(collection(db, this.documentsCollection), documentData)
              
              // Audit trail
              await this.auditDocumentAccess(docRef.id, 'UPLOAD')
              
              const medicalDocument: MedicalDocument = {
                id: docRef.id,
                ...documentData
              }
              
              resolve(medicalDocument)
            } catch (error) {
              reject(new Error(`Error guardando metadata: ${error}`))
            }
          }
        )
      })
    } catch (error) {
      throw new Error(`Error en upload: ${error}`)
    }
  }

  async uploadMultipleDocuments(
    files: File[],
    patientId: string,
    documentType: MedicalDocument['documentType'],
    onProgress?: (progress: UploadProgress, fileIndex: number) => void
  ): Promise<MedicalDocument[]> {
    try {
      const uploadPromises = files.map((file, index) => 
        this.uploadMedicalDocument(
          file,
          patientId,
          documentType,
          {},
          (progress) => onProgress?.(progress, index)
        )
      )

      return await Promise.all(uploadPromises)
    } catch (error) {
      throw new Error(`Error subiendo múltiples documentos: ${error}`)
    }
  }

  // Obtener documentos
  async getPatientDocuments(
    patientId: string, 
    documentType?: MedicalDocument['documentType']
  ): Promise<MedicalDocument[]> {
    try {
      const db = getFirebaseFirestore()
      let q = query(
        collection(db, this.documentsCollection),
        where('patientId', '==', patientId),
        where('status', '==', 'active')
      )

      if (documentType) {
        q = query(q, where('documentType', '==', documentType))
      }

      const querySnapshot = await getDocs(q)
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MedicalDocument))

      // Audit trail para acceso
      documents.forEach(doc => 
        this.auditDocumentAccess(doc.id, 'ACCESS')
      )

      return documents
    } catch (error) {
      throw new Error(`Error obteniendo documentos del paciente: ${error}`)
    }
  }

  async getDoctorDocuments(doctorId: string): Promise<MedicalDocument[]> {
    try {
      const db = getFirebaseFirestore()
      const q = query(
        collection(db, this.documentsCollection),
        where('doctorId', '==', doctorId),
        where('status', '==', 'active')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MedicalDocument))
    } catch (error) {
      throw new Error(`Error obteniendo documentos del doctor: ${error}`)
    }
  }

  async getDocumentById(documentId: string): Promise<MedicalDocument | null> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        await this.auditDocumentAccess(documentId, 'VIEW')
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as MedicalDocument
      }
      return null
    } catch (error) {
      throw new Error(`Error obteniendo documento: ${error}`)
    }
  }

  async getSharedDocuments(userId: string): Promise<MedicalDocument[]> {
    try {
      const db = getFirebaseFirestore()
      const q = query(
        collection(db, this.documentsCollection),
        where('sharedWith', 'array-contains', userId),
        where('status', '==', 'active')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MedicalDocument))
    } catch (error) {
      throw new Error(`Error obteniendo documentos compartidos: ${error}`)
    }
  }

  // Gestionar permisos
  async shareDocument(documentId: string, userId: string, permission: 'read' | 'write'): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      await updateDoc(docRef, {
        [`accessPermissions.${userId}`]: permission,
        sharedWith: [userId], // Se agregará al array existente
        updatedAt: serverTimestamp()
      })

      await this.auditDocumentAccess(documentId, `SHARE_${permission.toUpperCase()}`)
    } catch (error) {
      throw new Error(`Error compartiendo documento: ${error}`)
    }
  }

  async revokeAccess(documentId: string, userId: string): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as MedicalDocument
        const newPermissions = { ...data.accessPermissions }
        delete newPermissions[userId]
        
        await updateDoc(docRef, {
          accessPermissions: newPermissions,
          sharedWith: data.sharedWith.filter(id => id !== userId),
          updatedAt: serverTimestamp()
        })

        await this.auditDocumentAccess(documentId, 'REVOKE_ACCESS')
      }
    } catch (error) {
      throw new Error(`Error revocando acceso: ${error}`)
    }
  }

  async updatePermissions(
    documentId: string, 
    permissions: { [userId: string]: 'read' | 'write' | 'admin' }
  ): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      await updateDoc(docRef, {
        accessPermissions: permissions,
        sharedWith: Object.keys(permissions),
        updatedAt: serverTimestamp()
      })

      await this.auditDocumentAccess(documentId, 'UPDATE_PERMISSIONS')
    } catch (error) {
      throw new Error(`Error actualizando permisos: ${error}`)
    }
  }

  // Descargar y previsualizar
  async getDownloadURL(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentById(documentId)
      if (!document) throw new Error('Documento no encontrado')

      await this.auditDocumentAccess(documentId, 'DOWNLOAD')
      return document.downloadURL
    } catch (error) {
      throw new Error(`Error obteniendo URL de descarga: ${error}`)
    }
  }

  async generatePreviewURL(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentById(documentId)
      if (!document) throw new Error('Documento no encontrado')

      // Para documentos de imagen, devolver la URL original
      if (document.fileType.startsWith('image/')) {
        return document.downloadURL
      }

      // Para PDFs y otros documentos, podrías generar thumbnails
      // Esto requeriría un servicio adicional como Cloud Functions
      return document.downloadURL
    } catch (error) {
      throw new Error(`Error generando preview: ${error}`)
    }
  }

  // Gestionar documentos
  async updateDocumentMetadata(documentId: string, metadata: Partial<MedicalDocument>): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      await updateDoc(docRef, {
        ...metadata,
        updatedAt: serverTimestamp(),
        version: 1 // En producción usar FieldValue.increment(1)
      })

      await this.auditDocumentAccess(documentId, 'UPDATE_METADATA')
    } catch (error) {
      throw new Error(`Error actualizando metadata: ${error}`)
    }
  }

  async deleteDocument(documentId: string, permanentDelete = false): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      if (permanentDelete) {
        // Eliminar archivo de Storage
        const document = await this.getDocumentById(documentId)
        if (document) {
          const storage = getFirebaseStorage()
          const storageRef = ref(storage, document.storagePath)
          await deleteObject(storageRef)
        }

        // Eliminar documento de Firestore
        const docRef = doc(db, this.documentsCollection, documentId)
        await updateDoc(docRef, {
          status: 'deleted',
          deletedAt: serverTimestamp()
        })
      } else {
        // Soft delete
        const docRef = doc(db, this.documentsCollection, documentId)
        await updateDoc(docRef, {
          status: 'deleted',
          deletedAt: serverTimestamp()
        })
      }

      await this.auditDocumentAccess(documentId, permanentDelete ? 'PERMANENT_DELETE' : 'SOFT_DELETE')
    } catch (error) {
      throw new Error(`Error eliminando documento: ${error}`)
    }
  }

  async restoreDocument(documentId: string): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      await updateDoc(docRef, {
        status: 'active',
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      await this.auditDocumentAccess(documentId, 'RESTORE')
    } catch (error) {
      throw new Error(`Error restaurando documento: ${error}`)
    }
  }

  async archiveDocument(documentId: string): Promise<void> {
    try {
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      await updateDoc(docRef, {
        status: 'archived',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      await this.auditDocumentAccess(documentId, 'ARCHIVE')
    } catch (error) {
      throw new Error(`Error archivando documento: ${error}`)
    }
  }

  // Búsqueda
  async searchDocuments(userId: string, searchTerm: string): Promise<MedicalDocument[]> {
    try {
      // Obtener todos los documentos del usuario
      const userDocuments = await this.getSharedDocuments(userId)
      
      // Filtrar por término de búsqueda
      return userDocuments.filter(doc => 
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    } catch (error) {
      throw new Error(`Error buscando documentos: ${error}`)
    }
  }

  async getDocumentsByTag(userId: string, tags: string[]): Promise<MedicalDocument[]> {
    try {
      const userDocuments = await this.getSharedDocuments(userId)
      
      return userDocuments.filter(doc => 
        tags.some(tag => doc.tags.includes(tag))
      )
    } catch (error) {
      throw new Error(`Error obteniendo documentos por tag: ${error}`)
    }
  }

  async getDocumentsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<MedicalDocument[]> {
    try {
      const userDocuments = await this.getSharedDocuments(userId)
      
      return userDocuments.filter(doc => {
        const docDate = doc.documentDate?.toDate() || doc.createdAt.toDate()
        return docDate >= startDate && docDate <= endDate
      })
    } catch (error) {
      throw new Error(`Error obteniendo documentos por fecha: ${error}`)
    }
  }

  // Compliance y seguridad
  async auditDocumentAccess(documentId: string, action: string): Promise<void> {
    try {
      const auth = getFirebaseAuth()
      const currentUser = auth.currentUser

      if (currentUser) {
        const db = getFirebaseFirestore()
        await addDoc(collection(db, this.auditCollection), {
          documentId,
          userId: currentUser.uid,
          action,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          ipAddress: 'unknown' // En producción obtendrías la IP real
        })
      }
    } catch (error) {
      logger.error('Error en audit trail:', error)
    }
  }

  async encryptDocument(documentId: string): Promise<void> {
    try {
      // Implementación básica - en producción usarías un servicio de encriptación real
      const db = getFirebaseFirestore()
      const docRef = doc(db, this.documentsCollection, documentId)
      await updateDoc(docRef, {
        'metadata.encrypted': true,
        updatedAt: serverTimestamp()
      })

      await this.auditDocumentAccess(documentId, 'ENCRYPT')
    } catch (error) {
      throw new Error(`Error encriptando documento: ${error}`)
    }
  }

  async getAuditTrail(documentId: string): Promise<any[]> {
    try {
      const db = getFirebaseFirestore()
      const q = query(
        collection(db, this.auditCollection),
        where('documentId', '==', documentId)
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      throw new Error(`Error obteniendo audit trail: ${error}`)
    }
  }

  // Métodos privados
  private getCategoryFromType(documentType: MedicalDocument['documentType']): MedicalDocument['category'] {
    switch (documentType) {
      case 'lab_result':
      case 'prescription':
      case 'medical_image':
      case 'report':
        return 'clinical'
      case 'insurance':
      case 'consent':
        return 'administrative'
      default:
        return 'personal'
    }
  }
}

// Instancia singleton
export const firebaseStorage = new FirebaseStorageService()
export default firebaseStorage