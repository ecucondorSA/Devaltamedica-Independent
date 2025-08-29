import { Router, Request, Response } from 'express';
import { DiagnosticEngine } from '@altamedica/diagnostic-engine';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
const router = Router();

// Schema validations
const StartSessionSchema = z.object({
  age: z.number().min(0).max(120),
  sex: z.enum(['M', 'F'])
});

const SubmitAnswerSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  answer: z.object({
    value: z.boolean()
  })
});

// In-memory session storage (in production, use Redis or database)
const sessions = new Map<string, DiagnosticEngine>();

// Helper to get or create engine for session
function getEngineForSession(sessionId: string): DiagnosticEngine {
  let engine = sessions.get(sessionId);
  if (!engine) {
    engine = new DiagnosticEngine();
    sessions.set(sessionId, engine);
  }
  return engine;
}

// POST /api/v1/diagnostic/sessions - Start a new diagnostic session
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const validation = StartSessionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }

    const { age, sex } = validation.data;
    const engine = new DiagnosticEngine();
    
    // Start session
    const session = engine.startSession({ age, sex });
    
    // Store engine in sessions map
    sessions.set(session.id, engine);
    
    // Get first question
    const firstQuestion = engine.nextQuestion(session.id);
    
    // Set session timeout (30 minutes)
    setTimeout(() => {
      sessions.delete(session.id);
    }, 30 * 60 * 1000);

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        hypotheses: session.hypotheses,
        currentQuestion: firstQuestion,
        metadata: {
          age,
          sex,
          startedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Error starting diagnostic session:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start diagnostic session'
    });
  }
});

// POST /api/v1/diagnostic/sessions/:sessionId/answers - Submit an answer
router.post('/sessions/:sessionId/answers', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const validation = SubmitAnswerSchema.safeParse({
      ...req.body,
      sessionId
    });
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }

    const engine = sessions.get(sessionId);
    
    if (!engine) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    const { questionId, answer } = validation.data;
    
    // Submit answer
    engine.submitAnswer(sessionId, questionId, answer);
    
    // Get updated session
    const session = engine.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found after answer submission'
      });
    }
    
    // Get next question
    const nextQuestion = engine.nextQuestion(sessionId);
    
    // Generate report if no more questions
    let report = null;
    let isComplete = false;
    
    if (!nextQuestion) {
      report = engine.generateReport(sessionId);
      isComplete = true;
    }

    return res.json({
      success: true,
      data: {
        sessionId,
        hypotheses: session.hypotheses,
        currentQuestion: nextQuestion,
        isComplete,
        report,
        progress: {
          questionsAnswered: session.answeredQuestions.length,
          totalQuestions: session.answeredQuestions.length + (nextQuestion ? 1 : 0)
        }
      }
    });
  } catch (error) {
    logger.error('Error submitting answer:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
});

// GET /api/v1/diagnostic/sessions/:sessionId - Get session status
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const engine = sessions.get(sessionId);
    
    if (!engine) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    const session = engine.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session data not found'
      });
    }

    const currentQuestion = engine.nextQuestion(sessionId);
    const isComplete = !currentQuestion;
    
    return res.json({
      success: true,
      data: {
        sessionId,
        hypotheses: session.hypotheses,
        currentQuestion,
        isComplete,
        answeredQuestions: session.answeredQuestions.length,
        progress: {
          questionsAnswered: session.answeredQuestions.length,
          totalQuestions: session.answeredQuestions.length + (currentQuestion ? 1 : 0)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting session:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

// GET /api/v1/diagnostic/sessions/:sessionId/report - Get final report
router.get('/sessions/:sessionId/report', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const engine = sessions.get(sessionId);
    
    if (!engine) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    const report = engine.generateReport(sessionId);
    
    if (!report) {
      return res.status(400).json({
        success: false,
        error: 'Report not available. Session may not be complete.'
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating report:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

// DELETE /api/v1/diagnostic/sessions/:sessionId - End session
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessions.has(sessionId)) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    sessions.delete(sessionId);
    
    return res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    logger.error('Error ending session:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// GET /api/v1/diagnostic/conditions - Get available conditions
router.get('/conditions', async (req: Request, res: Response) => {
  try {
    const engine = new DiagnosticEngine();
    // Access the medical ontology through a public method or export
    // For now, return a hardcoded list based on our knowledge
    const conditions = [
      { id: 'cond:mi', name: 'Infarto agudo de miocardio', group: 'cardio' },
      { id: 'cond:angina', name: 'Angina estable', group: 'cardio' },
      { id: 'cond:hypertension', name: 'Hipertensión arterial', group: 'cardio' },
      { id: 'cond:arrhythmia', name: 'Arritmia cardíaca', group: 'cardio' },
      { id: 'cond:gerd', name: 'ERGE', group: 'gastro' },
      { id: 'cond:gastritis', name: 'Gastritis', group: 'gastro' },
      { id: 'cond:ibs', name: 'Síndrome del intestino irritable', group: 'gastro' },
      { id: 'cond:gastroenteritis', name: 'Gastroenteritis aguda', group: 'gastro' },
      { id: 'cond:asthma', name: 'Asma', group: 'respiratory' },
      { id: 'cond:bronchitis', name: 'Bronquitis aguda', group: 'respiratory' },
      { id: 'cond:pneumonia', name: 'Neumonía', group: 'respiratory' },
      { id: 'cond:allergic_rhinitis', name: 'Rinitis alérgica', group: 'respiratory' },
      { id: 'cond:covid19', name: 'COVID-19', group: 'respiratory' },
      { id: 'cond:migraine', name: 'Migraña', group: 'neurological' },
      { id: 'cond:tension_headache', name: 'Cefalea tensional', group: 'neurological' },
      { id: 'cond:vertigo', name: 'Vértigo', group: 'neurological' },
      { id: 'cond:anxiety', name: 'Trastorno de ansiedad', group: 'neurological' },
      { id: 'cond:flu', name: 'Influenza', group: 'infectious' },
      { id: 'cond:strep_throat', name: 'Faringitis estreptocócica', group: 'infectious' },
      { id: 'cond:uti', name: 'Infección del tracto urinario', group: 'infectious' },
      { id: 'cond:common_cold', name: 'Resfriado común', group: 'infectious' },
      { id: 'cond:diabetes', name: 'Diabetes mellitus', group: 'endocrine' },
      { id: 'cond:thyroid', name: 'Trastorno tiroideo', group: 'endocrine' }
    ];

    return res.json({
      success: true,
      data: {
        conditions,
        total: conditions.length,
        groups: ['cardio', 'gastro', 'respiratory', 'neurological', 'infectious', 'endocrine', 'musculoskeletal']
      }
    });
  } catch (error) {
    logger.error('Error getting conditions:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get conditions'
    });
  }
});

// 🧠 ENDPOINTS PARA HOOKS MODERNOS - REQUERIDOS POR useDiagnosisAI
// Endpoints adicionales para hooks avanzados de IA médica

// POST /api/v1/diagnostic/analyze - Análisis completo de síntomas
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validar estructura básica
    if (!data.patientId || !data.symptoms || !Array.isArray(data.symptoms)) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos: patientId, symptoms (array), medicalHistory'
      });
    }

    // Simular análisis IA completo usando DiagnosticEngine existente
    const engine = new DiagnosticEngine();
    const session = engine.startSession({ 
      age: data.age || 30, 
      sex: data.sex || 'M' 
    });

    // Convertir síntomas a respuestas automatizadas
    const autoAnswers = data.symptoms.map((symptom: any, index: number) => ({
      questionId: `q_${index}`,
      answer: { value: true, text: symptom.name || symptom }
    }));

    // Procesar respuestas automáticas
    for (const answer of autoAnswers) {
      engine.submitAnswer(session.id, answer.questionId, answer.answer);
    }

    const report = engine.generateReport(session.id);
    
    // Formatear respuesta compatible con useDiagnosisAI
    const analysisResult = {
      id: `analysis_${Date.now()}`,
      patientId: data.patientId,
      symptoms: data.symptoms,
      medicalHistory: data.medicalHistory || {},
      possibleConditions: (report?.recommendations || []).map((rec: any, index: number) => ({
        condition: rec.condition || `Condición ${index + 1}`,
        probability: rec.confidence || 0.5,
        confidence: rec.confidence || 0.5,
        icd10Code: rec.icd10 || 'Z00.0',
        reasoning: rec.reasoning || 'Análisis basado en síntomas reportados',
        urgencyLevel: rec.urgency || 'medium',
        requiredTests: rec.tests || []
      })),
      recommendations: {
        immediate: report?.immediate || ['Consultar con médico'],
        followUp: report?.followUp || ['Monitorear síntomas'],
        lifestyle: ['Reposo', 'Hidratación'],
        monitoring: ['Control en 24-48 horas']
      },
      redFlags: report?.redFlags || [],
      aiConfidence: 0.75,
      requiresHumanReview: true,
      timestamp: new Date().toISOString()
    };

    return res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    logger.error('Error in diagnostic analysis:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze symptoms'
    });
  }
});

// POST /api/v1/diagnostic/restrictions - Verificar restricciones médicas
router.post('/restrictions', async (req: Request, res: Response) => {
  try {
    const { patientId, proposedTreatments } = req.body;
    
    if (!patientId || !proposedTreatments) {
      return res.status(400).json({
        success: false,
        error: 'patientId y proposedTreatments son requeridos'
      });
    }

    // Simulación de verificación de restricciones
    // En producción, consultaría base de datos médica
    const restrictions = [];

    // Verificar alergias comunes
    if (proposedTreatments.includes('penicillin')) {
      restrictions.push({
        type: 'allergy',
        value: 'penicillin',
        message: 'Paciente alérgico a penicilina',
        severity: 'contraindication'
      });
    }

    // Verificar interacciones
    if (proposedTreatments.includes('warfarin') && proposedTreatments.includes('aspirin')) {
      restrictions.push({
        type: 'medication',
        value: 'warfarin+aspirin',
        message: 'Riesgo de sangrado por interacción',
        severity: 'warning'
      });
    }

    return res.json({
      success: true,
      data: restrictions
    });
  } catch (error) {
    logger.error('Error checking restrictions:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check restrictions'
    });
  }
});

// POST /api/v1/diagnostic/quick-analysis - Análisis rápido de triaje
router.post('/quick-analysis', async (req: Request, res: Response) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        success: false,
        error: 'symptoms array is required'
      });
    }

    // Análisis rápido basado en palabras clave
    let urgencyLevel = 'low';
    let requiresImmediateAttention = false;
    let estimatedWaitTime = 120; // minutos
    let triageRecommendation = 'Consulta médica regular';

    const symptomText = symptoms.join(' ').toLowerCase();

    // Detectar síntomas de emergencia
    const emergencyKeywords = ['chest pain', 'dolor pecho', 'shortness of breath', 'difficulty breathing', 'unconscious', 'stroke'];
    const highUrgencyKeywords = ['severe pain', 'high fever', 'bleeding', 'vomiting blood'];

    if (emergencyKeywords.some(keyword => symptomText.includes(keyword))) {
      urgencyLevel = 'emergency';
      requiresImmediateAttention = true;
      estimatedWaitTime = 0;
      triageRecommendation = 'Atención inmediata en urgencias';
    } else if (highUrgencyKeywords.some(keyword => symptomText.includes(keyword))) {
      urgencyLevel = 'high';
      requiresImmediateAttention = true;
      estimatedWaitTime = 30;
      triageRecommendation = 'Consulta urgente dentro de 1 hora';
    } else if (symptoms.length > 3) {
      urgencyLevel = 'medium';
      estimatedWaitTime = 60;
      triageRecommendation = 'Consulta médica en 24 horas';
    }

    return res.json({
      success: true,
      data: {
        urgencyLevel,
        triageRecommendation,
        requiresImmediateAttention,
        estimatedWaitTime
      }
    });
  } catch (error) {
    logger.error('Error in quick analysis:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to perform quick analysis'
    });
  }
});

export default router;