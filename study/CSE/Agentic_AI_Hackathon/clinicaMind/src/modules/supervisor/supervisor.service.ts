import { Injectable } from '@nitrostack/core';
import { HistoryService } from '../history/history.service';
import { MedicationService } from '../medication/medication.service';
import { ResearchService } from '../research/research.service';
import { GapAnalysisService } from '../gap-analysis/gap-analysis.service';
import { ReportService } from '../report/report.service';

export interface SupervisorInput {
  doctorQuestion?: string;
  patientId?: string;
  transcript?: string;
  consultationContext?: any;
}

export interface ExecutionPlan {
  supervisorAgent: string;
  patientId: string;
  doctorQuestion?: string;
  requiredMcpTools: string[];
  toolInvocations: Array<{
    toolName: string;
    purpose: string;
    status: 'PLANNED' | 'EXECUTED';
  }>;
  executionStrategy: string;
}

export interface CanvasNode {
  id: string;
  type: 'speech' | 'supervisor' | 'history' | 'medication' | 'research' | 'gap' | 'report';
  position: { x: number; y: number };
  data: {
    label: string;
    agentName: string;
    status: 'ACTIVE' | 'DONE' | 'ALERT';
    content: any;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface OrchestrationResult {
  transcript: string;
  symptomsExtracted: string[];
  patientId: string;
  executionPlan: ExecutionPlan;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  summary: any;
}

@Injectable({
  deps: [HistoryService, MedicationService, ResearchService, GapAnalysisService, ReportService]
})
export class SupervisorService {
  constructor(
    private readonly historyService: HistoryService,
    private readonly medicationService: MedicationService,
    private readonly researchService: ResearchService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly reportService: ReportService
  ) {}

  /**
   * Supervisor Execution Planner: Accepts Doctor Question, Patient ID, Transcript, and Consultation Context.
   * Determines which MCP tools are required and builds a structured Execution Plan without calling external LLMs.
   */
  async planExecution(input: SupervisorInput): Promise<ExecutionPlan> {
    const patientId = input.patientId || '1234';
    const transcript = input.transcript || '';
    const question = input.doctorQuestion || '';

    const requiredMcpTools: string[] = ['retrieve_patient', 'retrieve_visit_history', 'analyze_history'];

    const textToAnalyze = `${transcript} ${question}`.toLowerCase();

    if (textToAnalyze.includes('medication') || textToAnalyze.includes('drug') || textToAnalyze.includes('prescrib') || textToAnalyze.includes('ibuprofen') || textToAnalyze.includes('amoxicillin')) {
      requiredMcpTools.push('medication_review', 'allergy_check');
    } else {
      requiredMcpTools.push('medication_review');
    }

    if (textToAnalyze.includes('risk') || textToAnalyze.includes('readmission') || textToAnalyze.includes('fever') || textToAnalyze.includes('chest pain')) {
      requiredMcpTools.push('risk_assessment');
    }

    if (textToAnalyze.includes('cough') || textToAnalyze.includes('chest pain') || textToAnalyze.includes('fever') || textToAnalyze.includes('symptom')) {
      requiredMcpTools.push('differential_diagnosis', 'clinical_guidelines');
    }

    requiredMcpTools.push('search_research', 'generate_report');

    const toolInvocations = requiredMcpTools.map(toolName => ({
      toolName,
      purpose: this.getToolPurpose(toolName),
      status: 'PLANNED' as const
    }));

    return {
      supervisorAgent: 'ClinicaMind Supervisor Orchestrator v1.0',
      patientId,
      doctorQuestion: input.doctorQuestion,
      requiredMcpTools,
      toolInvocations,
      executionStrategy: 'Sequential multi-tool MCP pipeline with evidence synthesis'
    };
  }

  private getToolPurpose(toolName: string): string {
    const purposes: Record<string, string> = {
      retrieve_patient: 'Fetch baseline patient EHR record and demographic vitals.',
      retrieve_visit_history: 'Fetch timeline of prior encounters.',
      analyze_history: 'Analyze past chronic conditions and comorbidities.',
      medication_review: 'Evaluate drug interactions and dosage safety.',
      allergy_check: 'Cross-reference prescribed drugs with allergy history.',
      risk_assessment: 'Calculate 30-day readmission and severity risk scores.',
      differential_diagnosis: 'Formulate ranked differential diagnoses list.',
      clinical_guidelines: 'Query evidence-based practice guidelines (ATS/IDSA, ACC/AHA).',
      search_research: 'Query PubMed medical literature database.',
      generate_report: 'Compile SOAP clinical consultation note.'
    };
    return purposes[toolName] || 'Execute clinical helper tool.';
  }

  async orchestrateConsultation(transcript: string, patientId: string = '1234'): Promise<OrchestrationResult> {
    const plan = await this.planExecution({ transcript, patientId });

    const tLower = transcript.toLowerCase();
    const symptoms: string[] = [];

    if (tLower.includes('chest pain')) symptoms.push('Chest Pain');
    if (tLower.includes('cough')) symptoms.push('Productive Cough');
    if (tLower.includes('headache')) symptoms.push('Headache');
    if (tLower.includes('runny nose')) symptoms.push('Runny Nose');
    if (tLower.includes('fever')) symptoms.push('Fever');
    if (tLower.includes('leg pain') || tLower.includes('ibuprofen')) symptoms.push('Leg Pain');

    if (symptoms.length === 0) symptoms.push('General Consultation');

    // 1. History Agent Step
    const history = this.historyService.getPatientHistory(patientId);

    // 2. Medication Agent Step
    const currentPlusProposed = [...history.medications];
    if (tLower.includes('ibuprofen')) currentPlusProposed.push('Ibuprofen');
    if (tLower.includes('amoxicillin')) currentPlusProposed.push('Amoxicillin');

    const interactions = this.medicationService.checkDrugInteractions(currentPlusProposed);
    const allergyConflicts = this.medicationService.checkAllergyConflicts(currentPlusProposed, history.allergies);

    // 3. Research Agent Step
    const pubMedArticles = await this.researchService.searchPubMed(`${symptoms.join(' ')} ${history.conditions.join(' ')}`);

    // 4. Gap Analysis Agent Step
    const gaps = this.gapAnalysisService.analyzeGaps(symptoms, history.conditions);

    // 5. Report Generator Agent Step
    const summary = this.reportService.generateSummary({
      symptoms,
      history,
      interactions,
      allergyConflicts,
      pubMedArticles,
      gaps
    });

    // Build React Flow Node Graph Layout
    const nodes: CanvasNode[] = [
      {
        id: 'node-speech',
        type: 'speech',
        position: { x: 50, y: 180 },
        data: {
          label: 'Live Audio Transcript',
          agentName: 'Speech-to-Text Input',
          status: 'DONE',
          content: { transcript, symptoms }
        }
      },
      {
        id: 'node-supervisor',
        type: 'supervisor',
        position: { x: 380, y: 180 },
        data: {
          label: 'Supervisor Planner',
          agentName: 'Supervisor Agent',
          status: 'ACTIVE',
          content: {
            plan: plan.requiredMcpTools.map(t => `Invoking MCP Tool: ${t} (${this.getToolPurpose(t)})`)
          }
        }
      },
      {
        id: 'node-history',
        type: 'history',
        position: { x: 720, y: 40 },
        data: {
          label: 'Patient History & EHR',
          agentName: 'History Agent',
          status: 'DONE',
          content: history
        }
      },
      {
        id: 'node-medication',
        type: 'medication',
        position: { x: 720, y: 280 },
        data: {
          label: 'Medication Safety & Allergies',
          agentName: 'Medication Agent',
          status: (allergyConflicts.length > 0 || interactions.length > 0) ? 'ALERT' : 'DONE',
          content: { interactions, allergyConflicts }
        }
      },
      {
        id: 'node-research',
        type: 'research',
        position: { x: 1080, y: 40 },
        data: {
          label: 'PubMed Medical Literature',
          agentName: 'Research Agent',
          status: 'DONE',
          content: { articles: pubMedArticles }
        }
      },
      {
        id: 'node-gap',
        type: 'gap',
        position: { x: 1080, y: 280 },
        data: {
          label: 'Gap Analysis & Missing Data',
          agentName: 'Gap Analysis Agent',
          status: 'DONE',
          content: gaps
        }
      },
      {
        id: 'node-report',
        type: 'report',
        position: { x: 1440, y: 160 },
        data: {
          label: 'Evidence Clinical Briefing',
          agentName: 'Report Generator Agent',
          status: summary.riskLevel.includes('RISK') ? 'ALERT' : 'DONE',
          content: summary
        }
      }
    ];

    const edges: CanvasEdge[] = [
      { id: 'e-speech-sup', source: 'node-speech', target: 'node-supervisor', animated: true, label: 'Transcribes' },
      { id: 'e-sup-hist', source: 'node-supervisor', target: 'node-history', animated: true, label: 'Queries EHR' },
      { id: 'e-sup-med', source: 'node-supervisor', target: 'node-medication', animated: true, label: 'Checks Safety' },
      { id: 'e-hist-res', source: 'node-history', target: 'node-research', animated: true, label: 'Extracts Context' },
      { id: 'e-med-gap', source: 'node-medication', target: 'node-gap', animated: true, label: 'Evaluates Risks' },
      { id: 'e-res-rep', source: 'node-research', target: 'node-report', animated: true, label: 'Provides Literature' },
      { id: 'e-gap-rep', source: 'node-gap', target: 'node-report', animated: true, label: 'Informs Decision' }
    ];

    return {
      transcript,
      symptomsExtracted: symptoms,
      patientId,
      executionPlan: plan,
      nodes,
      edges,
      summary
    };
  }
}
