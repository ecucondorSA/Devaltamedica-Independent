/**
 * 🏢 COMPANY SERVICE - ALTAMEDICA
 * Servicio para la gestión de la entidad de empresas.
 */
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { BaseService, ServiceContext, QueryOptions, ServiceResponse } from '@/lib/patterns/ServicePattern';

export const CompanySchema = z.object({
  name: z.string().min(2, "El nombre de la empresa es requerido."),
  website: z.string().url("El sitio web debe ser una URL válida.").optional(),
  address: z.string().optional(),
  // ... otros campos relevantes de la empresa
});

export interface Company extends z.infer<typeof CompanySchema> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

class CompanyService extends BaseService<Company> {
  protected collectionName = 'companies';
  protected entitySchema = CompanySchema;

  async create(data: z.infer<typeof CompanySchema>, context: ServiceContext): Promise<Company> {
    if (context.userRole !== 'admin' && context.userRole !== 'company') {
      throw new Error('FORBIDDEN');
    }
    const validatedData = this.validateCreate(data);
    const newCompany = {
      ...validatedData,
      createdBy: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await adminDb.collection(this.collectionName).add(newCompany);
    return { id: docRef.id, ...newCompany } as Company;
  }

  async findMany(options: QueryOptions, context: ServiceContext): Promise<ServiceResponse<Company[]>> {
    const { page, limit, filters } = this.buildQuery(options);
    let query = adminDb.collection(this.collectionName).orderBy('name');
    // Aquí se podrían añadir filtros si fueran necesarios
    
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    const dataSnapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const data = dataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));

    return { data, total, page, limit, hasNext: (page * limit) < total, hasPrev: page > 1 };
  }

  async findById(id: string, context: ServiceContext): Promise<Company | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Company;
  }

  async update(id: string, data: Partial<Company>, context: ServiceContext): Promise<Company> {
    if (context.userRole !== 'admin' && context.userId !== id) { // Asumiendo que el ID de la empresa es el ID del usuario
      throw new Error('FORBIDDEN');
    }
    const validatedData = this.validateUpdate(data);
    const docRef = adminDb.collection(this.collectionName).doc(id);
    if (!(await docRef.get()).exists) throw new Error('NOT_FOUND');
    
    await docRef.update({ ...validatedData, updatedAt: new Date() });
    return (await this.findById(id, context))!;
  }

  async delete(id: string, context: ServiceContext): Promise<boolean> {
    if (context.userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }
    const docRef = adminDb.collection(this.collectionName).doc(id);
    if (!(await docRef.get()).exists) return false;
    
    // Borrado lógico o físico, según la política de la empresa. Aquí físico.
    await docRef.delete();
    return true;
  }
}

export const companyService = new CompanyService();
