import { PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import DOMPurify from 'isomorphic-dompurify'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export interface AuditContext {
  userId: string
  sessionId: string
  ipAddress: string
  userAgent: string
  requestId: string
}

export interface AuditEntry {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT'
  resource: string
  patientId?: string
  success: boolean
  errorMessage?: string
  previousData?: any
  newData?: any
  metadata?: Record<string, any>
}

class HIPAAAuditService {
  private static instance: HIPAAAuditService

  static getInstance(): HIPAAAuditService {
    if (!HIPAAAuditService.instance) {
      HIPAAAuditService.instance = new HIPAAAuditService()
    }
    return HIPAAAuditService.instance
  }

  async logAccess(context: AuditContext, entry: AuditEntry): Promise<void> {
    try {
      const encryptedPrevData = entry.previousData 
        ? this.encryptSensitiveData(entry.previousData)
        : null
        
      const encryptedNewData = entry.newData
        ? this.encryptSensitiveData(entry.newData)
        : null

      const { targetEntity, targetId } = inferTarget(entry.resource, entry.patientId)
      const accessed = detectPHIAccess(entry.previousData, entry.newData)

      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: mapAction(entry.action),
          targetEntity,
          targetId: targetId || context.requestId,
          details: {
            resource: entry.resource,
            metadata: entry.metadata || {},
            errorMessage: entry.errorMessage,
            requestId: context.requestId,
            sessionId: context.sessionId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            success: entry.success,
          } as any,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          accessedPHI: accessed.accessed,
          phiFields: accessed.fields,
          timestamp: new Date(),
          // Mantener compatibilidad si existen columnas en el schema extendido
          previousData_encrypted: encryptedPrevData as any,
          newData_encrypted: encryptedNewData as any,
        },
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Audit logging should never break the application
      // Send to backup logging service
      this.fallbackLog(context, entry, error)
    }
  }

  private encryptSensitiveData(data: any): string {
    // Remove sensitive fields before encryption
    const sanitized = this.sanitizeData(data)
    // In production, use the encryption service
    // For now, return base64 encoded JSON
    return Buffer.from(JSON.stringify(sanitized)).toString('base64')
  }

  private sanitizeData(data: any): any {
    if (!data) return null
    
    const sensitive = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard']
    const sanitized = { ...data }
    
    for (const field of sensitive) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  private fallbackLog(context: AuditContext, entry: AuditEntry, error: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      entry,
      error: error.message,
    }
    
    // In production, send to CloudWatch or external logging service
    console.error('HIPAA_AUDIT_FALLBACK:', JSON.stringify(logEntry))
  }

  async getAuditTrail(
    filters: {
      userId?: string
      patientId?: string
      startDate?: Date
      endDate?: Date
      action?: string
    },
    limit = 100
  ): Promise<any[]> {
    const where: any = {}
    
    if (filters.userId) where.userId = filters.userId
    if (filters.patientId) where.patientId = filters.patientId
    if (filters.action) where.action = filters.action
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    return await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' },
    })
  }
}

export const auditService = HIPAAAuditService.getInstance()

export function hipaaAuditMiddleware(
  action: AuditEntry['action'] = 'READ',
  resource: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4()
    const startTime = Date.now()
    
    // Attach request ID for tracing
    req.headers['x-request-id'] = requestId
    
    // Extract context
    const context: AuditContext = {
      userId: (req as any).user?.id || 'anonymous',
      sessionId: (req as any).session?.id || 'no-session',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      requestId,
    }
    
    // Store original methods
    const originalSend = res.send
    const originalJson = res.json
    
    let responseData: any = null
    let previousData: any = null
    
    // Intercept response
    res.send = function(data: any) {
      responseData = data
      return originalSend.call(this, data)
    }
    
    res.json = function(data: any) {
      responseData = data
      return originalJson.call(this, data)
    }
    
    // Store previous data for UPDATE/DELETE
    if (['UPDATE', 'DELETE'].includes(action)) {
      try {
        previousData = await getPreviousData(req, resource)
      } catch (error) {
        console.error('Failed to get previous data:', error)
      }
    }
    
    // Continue with request
    next()
    
    // After response is sent
    res.on('finish', async () => {
      const duration = Date.now() - startTime
      const success = res.statusCode < 400
      
      // Extract patient ID from various sources
      const patientId = extractPatientId(req, responseData)
      
      // Create audit entry
      const entry: AuditEntry = {
        action,
        resource,
        patientId,
        success,
        errorMessage: success ? undefined : responseData?.error || 'Request failed',
        previousData,
        newData: ['CREATE', 'UPDATE'].includes(action) ? responseData : undefined,
        metadata: {
          duration,
          statusCode: res.statusCode,
          method: req.method,
          path: req.path,
        },
      }
      
      // Log the access
      await auditService.logAccess(context, entry)
    })
  }
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Use DOMPurify for HTML content
    const cleaned = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
    
    // Additional SQL injection prevention
    return cleaned
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .substring(0, 10000) // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key])
    }
    return sanitized
  }
  
  return input
}

function extractPatientId(req: Request, responseData: any): string | undefined {
  // Try various sources
  return (
    req.params.patientId ||
    req.query.patientId as string ||
    req.body?.patientId ||
    responseData?.patientId ||
    responseData?.patient?.id ||
    undefined
  )
}

function mapAction(action: AuditEntry['action']): any {
  // Prisma enum AuditAction coincide con valores CREATE/READ/UPDATE/DELETE/EXPORT/LOGIN/LOGOUT
  return action as any
}

function inferTarget(resource: string, patientId?: string): { targetEntity: string; targetId?: string } {
  // resource patterns like 'patients', 'patients/:id', 'medical-records/:id'
  const parts = resource.split('/').filter(Boolean)
  const entityMap: Record<string, string> = {
    patients: 'Patient',
    'medical-records': 'MedicalRecord',
    appointments: 'Appointment',
    prescriptions: 'Prescription',
    telemedicine: 'TelemedicineSession',
    anamnesis: 'Anamnesis',
  }
  const entityKey = parts[0] || 'unknown'
  const targetEntity = entityMap[entityKey] || 'Unknown'
  const targetId = parts[1] || patientId
  return { targetEntity, targetId }
}

function detectPHIAccess(previousData?: any, newData?: any): { accessed: boolean; fields: string[] } {
  const phiFields = new Set<string>([
    'firstName','lastName','dateOfBirth','ssn','phone','phoneNumber','email','address','emergencyContact',
    'allergies','medications','medicalHistory','insuranceData','diagnosis','treatment','notes'
  ])
  const accessed = new Set<string>()

  const scan = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      if (phiFields.has(key)) accessed.add(key)
      if (typeof obj[key] === 'object') scan(obj[key])
    }
  }

  scan(previousData)
  scan(newData)
  return { accessed: accessed.size > 0, fields: Array.from(accessed) }
}

async function getPreviousData(req: Request, resource: string): Promise<any> {
  // Implementation depends on resource type
  const id = req.params.id || req.body?.id
  
  if (!id) return null
  
  try {
    // Example for patient resource
    if (resource.includes('patient')) {
      return await prisma.patient.findUnique({ where: { id } })
    }
    
    // Add other resource types as needed
    return null
  } catch (error) {
    console.error('Failed to fetch previous data:', error)
    return null
  }
}

export function requireHIPAACompliance() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure HTTPS in production
    if (process.env.NODE_ENV === 'production' && !req.secure) {
      return res.status(403).json({ 
        error: 'HTTPS required for HIPAA compliance' 
      })
    }
    
    // Check for valid session
    if (!(req as any).session?.id) {
      return res.status(401).json({ 
        error: 'Valid session required for HIPAA compliance' 
      })
    }
    
    // Sanitize all inputs
    req.body = sanitizeInput(req.body)
    req.query = sanitizeInput(req.query)
    req.params = sanitizeInput(req.params)
    
    next()
  }
}