import { ResourceDecorator as Resource, ExecutionContext, Injectable } from '@nitrostack/core';

@Injectable()
export class ClinicalResourcesService {

  @Resource({
    uri: 'patient://1234',
    name: 'Patient Record',
    description: 'Target patient EHR demographic, baseline health status, and vital signs.',
    mimeType: 'application/json'
  })
  async getPatientRecord(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      name: 'Eleanor Vance',
      dob: '1958-04-12',
      gender: 'Female',
      primaryPhysician: 'Dr. Sarah Jenkins',
      bloodType: 'O-Positive',
      vitals: { BP: '138/84', HR: 88, SpO2: '94%', Temp: '38.2 C', Weight: '68 kg' }
    };
  }

  @Resource({
    uri: 'consultation://current',
    name: 'Current Consultation Data',
    description: 'Live active clinical consultation audio transcript, status, and metadata.',
    mimeType: 'application/json'
  })
  async getCurrentConsultation(ctx: ExecutionContext) {
    return {
      consultationId: 'cons_98214',
      patientId: '1234',
      timestamp: new Date().toISOString(),
      status: 'In-Progress',
      audioState: 'Transcribing',
      transcriptSnippet: 'Doctor: How long have you been having this fever and cough? Patient: About three days now...'
    };
  }

  @Resource({
    uri: 'visits://1234',
    name: 'Previous Visits',
    description: 'Chronological summary of past hospital encounters and outpatient visits.',
    mimeType: 'application/json'
  })
  async getPreviousVisits(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      visits: [
        { date: '2026-06-12', type: 'Outpatient Follow-up', clinic: 'Endocrinology Center' },
        { date: '2026-03-04', type: 'Urgent Care', clinic: 'Pulmonary Care Clinic' }
      ]
    };
  }

  @Resource({
    uri: 'medications://1234',
    name: 'Medication List',
    description: 'Current active prescription and over-the-counter medications list.',
    mimeType: 'application/json'
  })
  async getMedicationList(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      medications: [
        { name: 'Metformin', dosage: '1000mg', frequency: 'BID', status: 'Active' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily', status: 'Active' },
        { name: 'Atorvastatin', dosage: '20mg', frequency: 'Daily', status: 'Active' }
      ]
    };
  }

  @Resource({
    uri: 'allergies://1234',
    name: 'Allergy List',
    description: 'Documented drug allergies, environmental allergies, and adverse reactions.',
    mimeType: 'application/json'
  })
  async getAllergyList(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      allergies: [
        { substance: 'Penicillin', severity: 'Severe', reaction: 'Maculopapular Rash' },
        { substance: 'Sulfa Drugs', severity: 'Moderate', reaction: 'Urticaria (Hives)' }
      ]
    };
  }

  @Resource({
    uri: 'notes://1234',
    name: 'Clinical EHR Notes',
    description: 'Past clinical progress notes, discharge summaries, and specialist letters.',
    mimeType: 'application/json'
  })
  async getClinicalNotes(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      notesCount: 2,
      latestNote: {
        date: '2026-06-12',
        author: 'Dr. Sarah Jenkins',
        summary: 'Type 2 Diabetes well-managed on Metformin 1000mg BID. HbA1c 7.4%. Encouraged lifestyle modifications.'
      }
    };
  }

  @Resource({
    uri: 'labs://1234',
    name: 'Lab Results',
    description: 'Recent laboratory test results including CBC, BMP, HbA1c, and inflammatory markers.',
    mimeType: 'application/json'
  })
  async getLabResults(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      recentLabs: [
        { test: 'WBC Count', result: '14.2 x10^3/uL', referenceRange: '4.5-11.0', flag: 'HIGH' },
        { test: 'HbA1c', result: '7.4%', referenceRange: '<5.7%', flag: 'HIGH' },
        { test: 'Serum Creatinine', result: '0.9 mg/dL', referenceRange: '0.6-1.2', flag: 'NORMAL' },
        { test: 'CRP (C-Reactive Protein)', result: '48 mg/L', referenceRange: '<5.0', flag: 'CRITICAL_HIGH' }
      ]
    };
  }

  @Resource({
    uri: 'imaging://1234',
    name: 'Imaging Reports',
    description: 'Diagnostic imaging reports including Chest X-Ray and CT scans.',
    mimeType: 'application/json'
  })
  async getImagingReports(ctx: ExecutionContext) {
    return {
      patientId: '1234',
      latestStudy: {
        date: '2026-07-24',
        modality: 'Chest X-Ray PA & Lateral',
        impression: 'Focal consolidation in the right lower lobe consistent with acute pneumonia. No pleural effusion or pneumothorax.'
      }
    };
  }

  @Resource({
    uri: 'research://library',
    name: 'Research Library',
    description: 'Curated clinical practice guidelines and indexed biomedical research papers.',
    mimeType: 'application/json'
  })
  async getResearchLibrary(ctx: ExecutionContext) {
    return {
      totalIndexedPapers: 15420,
      featuredTopics: ['Community-Acquired Pneumonia', 'Diabetic Glycemic Control', 'Cardiovascular Risk Stratification'],
      lastUpdated: '2026-07-25'
    };
  }

  @Resource({
    uri: 'canvas://current',
    name: 'Clinical Canvas Visual State',
    description: 'Active React Flow agent graph nodes and visual canvas state.',
    mimeType: 'application/json'
  })
  async getCanvasState(ctx: ExecutionContext) {
    return {
      activeNodes: 7,
      workflowStatus: 'Orchestrated',
      agentsPresent: ['Supervisor', 'HistoryAgent', 'MedicationAgent', 'ResearchAgent', 'GapAnalysisAgent', 'ReportAgent']
    };
  }

  @Resource({
    uri: 'memory://conversation',
    name: 'Supervisor Conversation Memory',
    description: 'Active Supervisor conversation context and doctor query history.',
    mimeType: 'application/json'
  })
  async getConversationMemory(ctx: ExecutionContext) {
    return {
      turnCount: 4,
      lastQuery: 'Check medication interactions for Eleanor Vance given her fever and cough.',
      activePatientId: '1234'
    };
  }
}
