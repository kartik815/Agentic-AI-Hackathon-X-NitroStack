import { ToolDecorator as Tool, ControllerDecorator as Controller, ExecutionContext, Injectable, z } from '@nitrostack/core';

// Zod Schemas for the 12 Clinical MCP Tools
export const RetrievePatientSchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID (e.g., "1234")')
});

export const RetrieveVisitHistorySchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID'),
  limit: z.number().optional().default(5).describe('Maximum number of previous visits to retrieve')
});

export const AnalyzeHistorySchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID'),
  focusArea: z.enum(['cardiovascular', 'respiratory', 'metabolic', 'general']).optional().default('general').describe('Clinical focus area for history analysis')
});

export const MedicationReviewSchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID'),
  currentMedications: z.array(z.string()).optional().describe('List of medication names to review')
});

export const AllergyCheckSchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID'),
  proposedMedications: z.array(z.string()).describe('List of proposed medication names to check against allergy history')
});

export const RiskAssessmentSchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID'),
  assessmentType: z.enum(['readmission_30d', 'sepsis', 'cardiovascular', 'mortality']).default('readmission_30d')
});

export const DifferentialDiagnosisSchema = z.object({
  symptoms: z.array(z.string()).describe('List of observed patient symptoms'),
  patientId: z.string().optional().default('1234')
});

export const ClinicalGuidelinesSchema = z.object({
  condition: z.string().describe('Target clinical condition or ICD-10 term (e.g., "Community Acquired Pneumonia")'),
  organization: z.string().optional().default('ACC/AHA/ATS')
});

export const SearchResearchSchema = z.object({
  query: z.string().describe('Medical research search term or PubMed query'),
  maxResults: z.number().optional().default(3)
});

export const GenerateReportSchema = z.object({
  patientId: z.string().describe('Target EHR Patient ID'),
  reportType: z.enum(['SOAP_NOTE', 'DISCHARGE_SUMMARY', 'CONSULTATION_NOTE']).default('SOAP_NOTE'),
  findings: z.array(z.string()).optional().default([])
});

export const AskCopilotSchema = z.object({
  question: z.string().describe('Doctor inquiry or clinical decision question'),
  patientId: z.string().optional().default('1234')
});

export const SummarizeConsultationSchema = z.object({
  transcript: z.string().describe('Raw live consultation speech transcript'),
  patientId: z.string().optional().default('1234')
});

@Controller('clinical_tools')
@Injectable()
export class ClinicalToolsService {

  @Tool({
    name: 'retrieve_patient',
    description: 'Fetch patient EHR demographic baseline record and primary clinical profile.',
    inputSchema: RetrievePatientSchema
  })
  async retrievePatient(input: z.infer<typeof RetrievePatientSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing retrieve_patient for ID ${input.patientId}`);
    return {
      patientId: input.patientId,
      name: 'Eleanor Vance',
      age: 68,
      gender: 'Female',
      primaryDiagnosis: 'Community-Acquired Pneumonia & Type 2 Diabetes',
      vitals: { BP: '138/84', HR: 88, SpO2: '94%', Temp: '38.2 C' },
      status: 'Active Evaluation'
    };
  }

  @Tool({
    name: 'retrieve_visit_history',
    description: 'Fetch timeline of previous medical visits and encounters for a patient.',
    inputSchema: RetrieveVisitHistorySchema
  })
  async retrieveVisitHistory(input: z.infer<typeof RetrieveVisitHistorySchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing retrieve_visit_history for ID ${input.patientId}`);
    return {
      patientId: input.patientId,
      visitsCount: 3,
      visits: [
        { date: '2026-06-12', reason: 'Routine Diabetic Follow-up', provider: 'Dr. Sarah Jenkins', outcome: 'HbA1c 7.4%, Metformin continued' },
        { date: '2026-03-04', reason: 'Acute Bronchitis', provider: 'Dr. Marcus Vance', outcome: 'Azithromycin 5-day course completed' },
        { date: '2025-11-19', reason: 'Annual Wellness Examination', provider: 'Dr. Sarah Jenkins', outcome: 'Mammogram & Colonoscopy up to date' }
      ]
    };
  }

  @Tool({
    name: 'analyze_history',
    description: 'Analyze past medical history for chronic disease risk factors and progression.',
    inputSchema: AnalyzeHistorySchema
  })
  async analyzeHistory(input: z.infer<typeof AnalyzeHistorySchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing analyze_history for ID ${input.patientId}`);
    return {
      patientId: input.patientId,
      chronicConditions: ['Type 2 Diabetes Mellitus (12 yrs)', 'Essential Hypertension (8 yrs)', 'Mild COPD (3 yrs)'],
      riskAnalysis: {
        respiratoryDecompensation: 'Moderate-High',
        hypoglycemiaRisk: 'Low',
        cardiovascularRisk: 'Moderate'
      },
      summary: 'Patient has a 12-year history of T2DM with recent acute respiratory symptoms exacerbating underlying COPD.'
    };
  }

  @Tool({
    name: 'medication_review',
    description: 'Perform medication safety, dosage, and drug-drug interaction review.',
    inputSchema: MedicationReviewSchema
  })
  async medicationReview(input: z.infer<typeof MedicationReviewSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing medication_review for ID ${input.patientId}`);
    return {
      patientId: input.patientId,
      activeMedications: ['Metformin 1000mg BID', 'Lisinopril 10mg Daily', 'Atorvastatin 20mg Daily'],
      interactions: [
        { severity: 'Moderate', drugs: ['Lisinopril', 'NSAIDS'], warning: 'Avoid concomitant NSAID use due to renal impairment risk.' }
      ],
      recommendation: 'Current regimen safe. Avoid prescribing fluoroquinolones if QT prolongation risk present.'
    };
  }

  @Tool({
    name: 'allergy_check',
    description: 'Check patient allergy list against proposed or prescribed medications.',
    inputSchema: AllergyCheckSchema
  })
  async allergyCheck(input: z.infer<typeof AllergyCheckSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing allergy_check for ID ${input.patientId}`);
    const knownAllergies = ['Penicillin (Rash)', 'Sulfa Drugs (Hives)'];
    const conflicts = input.proposedMedications.filter(m => 
      m.toLowerCase().includes('penicillin') || m.toLowerCase().includes('amoxicillin') || m.toLowerCase().includes('bactrim')
    );
    return {
      patientId: input.patientId,
      knownAllergies,
      proposedMedications: input.proposedMedications,
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(c => ({ medication: c, reaction: 'Severe allergic reaction hazard' })),
      safeToAdminister: conflicts.length === 0
    };
  }

  @Tool({
    name: 'risk_assessment',
    description: 'Calculate clinical risk scores (readmission, sepsis, cardiovascular, mortality).',
    inputSchema: RiskAssessmentSchema
  })
  async riskAssessment(input: z.infer<typeof RiskAssessmentSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing risk_assessment type ${input.assessmentType}`);
    return {
      patientId: input.patientId,
      assessmentType: input.assessmentType,
      riskScore: 68,
      riskCategory: 'High Risk',
      contributingFactors: [
        'Advanced Age (>65)',
        'Comorbid Type 2 Diabetes',
        'Acute Febrile Respiratory Illness'
      ],
      mitigationStrategy: 'Early oral antibiotic initiation and close 48-hour follow-up monitoring.'
    };
  }

  @Tool({
    name: 'differential_diagnosis',
    description: 'Generate structured differential diagnosis list ranked by probability.',
    inputSchema: DifferentialDiagnosisSchema
  })
  async differentialDiagnosis(input: z.infer<typeof DifferentialDiagnosisSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing differential_diagnosis for symptoms: ${input.symptoms.join(', ')}`);
    return {
      patientId: input.patientId,
      symptoms: input.symptoms,
      differentials: [
        { diagnosis: 'Community-Acquired Bacterial Pneumonia', probability: 'High (72%)', icd10: 'J18.9', rationale: 'Fever, purulent sputum, and localized lung crackles' },
        { diagnosis: 'Acute Exacerbation of COPD', probability: 'Moderate (45%)', icd10: 'J44.1', rationale: 'Increased dyspnea and underlying COPD history' },
        { diagnosis: 'Congestive Heart Failure Exacerbation', probability: 'Low (15%)', icd10: 'I50.9', rationale: 'Mild dyspnea but no peripheral edema' }
      ]
    };
  }

  @Tool({
    name: 'clinical_guidelines',
    description: 'Query evidence-based clinical practice guidelines (ATS/IDSA, ACC/AHA, ADA).',
    inputSchema: ClinicalGuidelinesSchema
  })
  async clinicalGuidelines(input: z.infer<typeof ClinicalGuidelinesSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing clinical_guidelines for ${input.condition}`);
    return {
      condition: input.condition,
      organization: input.organization,
      guidelineSummary: 'ATS/IDSA Guidelines for CAP in Outpatients without Comorbidities recommend Amoxicillin 1g TID or Doxycycline 100mg BID. In patients with comorbidities (T2DM), combination therapy with Respiratory Fluoroquinolone or Beta-lactam + Macrolide is recommended.',
      evidenceLevel: 'Level A Evidence'
    };
  }

  @Tool({
    name: 'search_research',
    description: 'Query medical literature and PubMed biomedical research database.',
    inputSchema: SearchResearchSchema
  })
  async searchResearch(input: z.infer<typeof SearchResearchSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing search_research query: "${input.query}"`);
    return {
      query: input.query,
      totalFound: 142,
      articles: [
        { pmid: '38291024', title: 'Empiric Antibiotics in Diabetic Patients with Community-Acquired Pneumonia', journal: 'Chest (2025)', summary: 'Early dual coverage reduces 30-day mortality in patients with HbA1c > 7.0%.' },
        { pmid: '37102941', title: 'Outpatient Management of CAP: ATS/IDSA Guidelines Review', journal: 'NEJM (2024)', summary: 'Comprehensive review of outpatient stratified risk factors and oral regimens.' }
      ]
    };
  }

  @Tool({
    name: 'generate_report',
    description: 'Compile structured EMR clinical consultation notes (SOAP note / discharge summary).',
    inputSchema: GenerateReportSchema
  })
  async generateReport(input: z.infer<typeof GenerateReportSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing generate_report type ${input.reportType}`);
    return {
      patientId: input.patientId,
      reportType: input.reportType,
      formattedNote: `CLINICAL CONSULTATION NOTE (SOAP)
Patient: Eleanor Vance (ID: ${input.patientId})
Date: ${new Date().toISOString().split('T')[0]}

S: Patient presents with a 3-day history of fever, productive cough with yellow sputum, and pleuritic chest pain.
O: Temp 38.2°C, BP 138/84, HR 88, SpO2 94% on room air. Right lower lobe crackles.
A: Community-Acquired Pneumonia in patient with underlying T2DM and mild COPD. High 30-day readmission risk.
P: 1. Prescribe Amoxicillin-Clavulanate 875/125mg BID x 7 days.
   2. Continue home Metformin 1000mg BID.
   3. Re-evaluate in clinic in 48 hours.`,
      status: 'Generated'
    };
  }

  @Tool({
    name: 'ask_copilot',
    description: 'Interactive clinical decision support assistant inquiry handler.',
    inputSchema: AskCopilotSchema
  })
  async askCopilot(input: z.infer<typeof AskCopilotSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing ask_copilot: "${input.question}"`);
    return {
      question: input.question,
      patientId: input.patientId,
      answer: `Based on patient Eleanor Vance's profile (T2DM, 68y), for "${input.question}", the recommended outpatient protocol is Amoxicillin/Clavulanate plus Doxycycline, monitoring glucose levels daily during acute infection.`,
      confidence: 'High (0.94)'
    };
  }

  @Tool({
    name: 'summarize_consultation',
    description: 'Summarize live audio consultation transcript into structured subjective/objective findings.',
    inputSchema: SummarizeConsultationSchema
  })
  async summarizeConsultation(input: z.infer<typeof SummarizeConsultationSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[MCP Tool] Executing summarize_consultation for ${input.transcript.length} chars transcript`);
    return {
      patientId: input.patientId,
      chiefComplaint: 'Fever, cough, and dyspnea',
      keyFindings: [
        '3-day onset of febrile illness',
        'Productive cough with purulent sputum',
        'Known history of Type 2 Diabetes'
      ],
      suggestedActions: [
        'Perform chest X-ray',
        'Initiate empiric oral antibiotic regimen',
        'Schedule follow-up in 48 hours'
      ]
    };
  }
}
