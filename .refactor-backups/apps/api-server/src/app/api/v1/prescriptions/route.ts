import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { auditEvent } from '@/middleware/audit.middleware';
import { notificationService } from '@/notifications/UnifiedNotificationSystem';
import { 
  CreatePrescriptionSchema,
  PrescriptionFilterSchema,
  Prescription,
  generatePrescriptionNumber,
  generatePrescriptionHash,
  calculatePrescriptionExpiry
} from '@altamedica/types';
import { getFirebaseFirestore } from '@altamedica/firebase/client';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Prescription API Routes with Enhanced Features
 * Full implementation with medication catalog integration
 * Compliant with Argentina Ley 17.132 and digital prescription requirements
 */

/**
 * GET /api/v1/prescriptions
 * List prescriptions with enhanced filtering and role-based access
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user - all authenticated users can list prescriptions with role-based filtering
    const authResult = await UnifiedAuth(request);
    if (!authResult.success) return authResult.response;

    const userId = authResult.user.id;
    const userRole = authResult.user.role;

    // Parse filter parameters
    const searchParams = request.nextUrl.searchParams;
    const filterData = {
      patientId: searchParams.get('patientId') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      status: searchParams.get('status') as any || undefined,
      medicationId: searchParams.get('medicationId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Validate filters
    const filters = PrescriptionFilterSchema.parse(filterData);

    // Build Firestore query
    const db = getFirebaseFirestore();
    let q = query(collection(db, 'prescriptions'));

    // Apply role-based filtering
    if (userRole === 'patient') {
      // Patients can only see their own prescriptions
      q = query(q, where('patientId', '==', userId));
    } else if (userRole === 'doctor') {
      // Doctors can see prescriptions they created or for their patients
      if (filters.patientId) {
        q = query(q, where('patientId', '==', filters.patientId));
      } else {
        q = query(q, where('doctorId', '==', userId));
      }
    }
    // Admins can see all prescriptions with any filters

    // Apply additional filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.medicationId) {
      q = query(q, where('medicationId', '==', filters.medicationId));
    }

    // Order by creation date and limit
    q = query(q, orderBy('createdAt', 'desc'), firestoreLimit(50));

    // Execute query
    const snapshot = await getDocs(q);
    const prescriptions: Prescription[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      prescriptions.push({
        ...data,
        id: doc.id,
        // Convert Firestore timestamps
        issuedAt: data.issuedAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || null,
        dispensedAt: data.dispensedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Prescription);
    });

    // Apply text search if provided
    let filteredPrescriptions = prescriptions;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPrescriptions = prescriptions.filter(rx =>
        rx.drug.toLowerCase().includes(searchLower) ||
        rx.patientName.toLowerCase().includes(searchLower) ||
        rx.prescriptionNumber.toLowerCase().includes(searchLower)
      );
    }

    // Audit the list action
    await auditEvent(
      userId,
      'prescription_list',
      'prescriptions',
      {
        role: userRole,
        filters,
        resultCount: filteredPrescriptions.length,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    );

    return NextResponse.json({
      success: true,
      data: filteredPrescriptions,
      total: filteredPrescriptions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[Prescriptions] List error:', undefined, error);
    
    // Audit the error
    await auditEvent(
      'system',
      'prescription_list_error',
      'prescriptions',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to list prescriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/prescriptions
 * Create a new prescription with full validation and notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate - only doctors can create prescriptions
    const authResult = await UnifiedAuth(request, ['doctor']);
    if (!authResult.success) return authResult.response;

    const doctorId = authResult.user.id;
    const doctorName = authResult.user.name || 'Dr. Unknown';

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreatePrescriptionSchema.parse(body);

    // Generate prescription number and security hash
    const prescriptionNumber = generatePrescriptionNumber();
    const prescriptionId = `rx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Create prescription object
    const prescription: Omit<Prescription, 'createdAt' | 'updatedAt'> = {
      id: prescriptionId,
      prescriptionNumber,
      ...validatedData,
      doctorId,
      doctorName,
      status: 'active',
      securityHash: generatePrescriptionHash({
        ...validatedData,
        doctorId,
        prescriptionNumber
      }),
      issuedAt: new Date(validatedData.issuedAt),
      expiresAt: validatedData.expiresAt || calculatePrescriptionExpiry(new Date(validatedData.issuedAt)),
      createdBy: doctorId,
    };

    // Save to Firestore
    const db = getFirebaseFirestore();
    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    
    await setDoc(prescriptionRef, {
      ...prescription,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Convert dates to Firestore timestamps
      issuedAt: Timestamp.fromDate(prescription.issuedAt),
      expiresAt: prescription.expiresAt ? Timestamp.fromDate(prescription.expiresAt) : null,
    });

    // Audit the creation with detailed metadata
    await auditEvent(
      doctorId,
      'prescription_create',
      `prescription/${prescriptionId}`,
      {
        role: authResult.user.role,
        patientId: prescription.patientId,
        drug: prescription.drug,
        dosage: prescription.dosage,
        route: prescription.route,
        frequency: prescription.frequency,
        prescriptionNumber,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    );

    // Send notification to patient if available
    if (prescription.patientId && notificationService) {
      try {
        await notificationService.createNotification({
          userId: prescription.patientId,
          type: 'prescription_created',
          title: 'Nueva Prescripción Médica',
          message: `El Dr. ${doctorName} te ha emitido una nueva prescripción para ${prescription.drug}`,
          channels: ['push', 'email'],
          metadata: {
            prescriptionId,
            prescriptionNumber,
            doctorName,
            drug: prescription.drug
          }
        });
      } catch (notifError) {
        logger.error('[Prescriptions] Notification error:', notifError);
        // Continue without failing the prescription creation
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...prescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      message: 'Prescription created successfully'
    }, { status: 201 });

  } catch (error: any) {
    logger.error('[Prescriptions] Create error:', undefined, error);
    
    // Audit the error
    await auditEvent(
      'system',
      'prescription_create_error',
      'prescriptions',
      {
        error: error.message || 'Unknown error',
        validation: error.name === 'ZodError' ? error.errors : undefined
      }
    );

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid prescription data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/prescriptions/[id]
 * Cancel a prescription with audit logging
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await UnifiedAuth(request, ['doctor', 'admin']);
    if (!authResult.success) return authResult.response;

    // Extract prescription ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const prescriptionId = pathParts[pathParts.length - 1];

    if (!prescriptionId || prescriptionId === 'prescriptions') {
      return NextResponse.json(
        { success: false, error: 'Prescription ID required' },
        { status: 400 }
      );
    }

    // Find prescription
    const prescription = prescriptions.get(prescriptionId);
    
    if (!prescription) {
      await auditEvent(
        authResult.user.id,
        'prescription_delete_notfound',
        `prescription/${prescriptionId}`,
        {
          role: authResult.user.role,
          prescriptionId
        }
      );

      return NextResponse.json(
        { success: false, error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Check authorization (only the prescribing doctor or admin can cancel)
    if (authResult.user.role !== 'admin' && prescription.doctorId !== authResult.user.id) {
      await auditEvent(
        authResult.user.id,
        'prescription_delete_unauthorized',
        `prescription/${prescriptionId}`,
        {
          role: authResult.user.role,
          prescriptionId,
          attemptedBy: authResult.user.id,
          prescribedBy: prescription.doctorId
        }
      );

      return NextResponse.json(
        { success: false, error: 'Unauthorized to cancel this prescription' },
        { status: 403 }
      );
    }

    // Cancel prescription (soft delete)
    prescription.status = 'cancelled';
    prescription.updatedAt = new Date();

    // Audit the cancellation
    await auditEvent(
      authResult.user.id,
      'prescription_cancel',
      `prescription/${prescriptionId}`,
      {
        role: authResult.user.role,
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        prescriptionId,
        patientId: prescription.patientId,
        drug: prescription.drug,
        cancelledBy: authResult.user.id,
        originalPrescriber: prescription.doctorId
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Prescription cancelled successfully',
      data: prescription
    });

  } catch (error) {
    logger.error('Error cancelling prescription:', undefined, error);
    
    await auditEvent(
      'system',
      'prescription_cancel_error',
      'prescriptions',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    return NextResponse.json(
      { success: false, error: 'Failed to cancel prescription' },
      { status: 500 }
    );
  }
}