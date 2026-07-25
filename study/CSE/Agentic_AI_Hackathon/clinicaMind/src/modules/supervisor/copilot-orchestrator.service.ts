import { Injectable } from '@nitrostack/core';
import { HistoryService } from '../history/history.service';
import { MedicationService } from '../medication/medication.service';
import { ResearchService } from '../research/research.service';
import { GapAnalysisService } from '../gap-analysis/gap-analysis.service';
import { ReportService } from '../report/report.service';
import { LlmProviderService, LlmMessage } from './llm-provider.service';

export interface AgentJsonResponse {
  agent: string;
  confidence: number;
  findings: any;
}

export interface EvidencePackage {
  patientDemographics: any;
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
  labValues: string[];
  imaging: string[];
  previousVisits: any[];
  researchEvidence: any[];
  drugInteractions: any[];
  allergyConflicts: any[];
  differentialDiagnosis: string[];
}

export interface CopilotQueryRequest {
  query: string;
  patientId?: string;
  transcript?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface CopilotQueryResponse {
  answer: string;
  providerInfo: { provider: string; model: string };
  agentsInvoked: Array<{ name: string; confidence: number }>;
  evidencePackage: EvidencePackage;
  citations: string[];
}

@Injectable({
  deps: [
    HistoryService,
    MedicationService,
    ResearchService,
    GapAnalysisService,
    ReportService,
    LlmProviderService
  ]
})
export class CopilotOrchestratorService {
  constructor(
    private readonly historyService: HistoryService,
    private readonly medicationService: MedicationService,
    private readonly researchService: ResearchService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly reportService: ReportService,
    private readonly llmProviderService: LlmProviderService
  ) {}

  async orchestrateCopilotQuery(req: CopilotQueryRequest): Promise<CopilotQueryResponse> {
    const patientId = req.patientId || '1234';
    const queryLower = req.query.toLowerCase();

    // 1. Dynamic Agent Selection
    const requiredAgents: string[] = ['History']; // History always required for context

    if (queryLower.includes('medication') || queryLower.includes('drug') || queryLower.includes('allergy') || queryLower.includes('penicillin') || queryLower.includes('amoxicillin') || queryLower.includes('warfarin') || queryLower.includes('ibuprofen')) {
      requiredAgents.push('Medication');
    }
    if (queryLower.includes('jama') || queryLower.includes('guideline') || queryLower.includes('pubmed') || queryLower.includes('research') || queryLower.includes('study') || queryLower.includes('pneumonia')) {
      requiredAgents.push('Research');
    }
    if (queryLower.includes('gap') || queryLower.includes('risk') || queryLower.includes('missing')) {
      requiredAgents.push('GapAnalysis');
    }
    if (queryLower.includes('summary') || queryLower.includes('report') || queryLower.includes('emr') || requiredAgents.length === 1) {
      requiredAgents.push('Medication', 'Research', 'Report');
    }

    const agentsInvoked: Array<{ name: string; confidence: number }> = [];
    const agentOutputs: Record<string, AgentJsonResponse> = {};

    // 2. Execute selected agents to collect structured JSON findings
    const profile = this.historyService.getPatientProfile(patientId);
    agentOutputs['History'] = {
      agent: 'History',
      confidence: 0.98,
      findings: profile
    };
    agentsInvoked.push({ name: 'History Agent', confidence: 0.98 });

    if (requiredAgents.includes('Medication')) {
      const currentPlusProposed = [...profile.medications];
      if (queryLower.includes('ibuprofen')) currentPlusProposed.push('Ibuprofen');
      if (queryLower.includes('amoxicillin')) currentPlusProposed.push('Amoxicillin');

      const interactions = await this.medicationService.checkDrugInteractionsAsync(currentPlusProposed);
      const allergyConflicts = this.medicationService.checkAllergyConflicts(currentPlusProposed, profile.allergies);

      agentOutputs['Medication'] = {
        agent: 'Medication',
        confidence: 0.95,
        findings: { interactions, allergyConflicts }
      };
      agentsInvoked.push({ name: 'Medication Agent', confidence: 0.95 });
    }

    if (requiredAgents.includes('Research')) {
      const researchArticles = await this.researchService.searchPubMed(req.query || 'pneumonia guidelines');
      agentOutputs['Research'] = {
        agent: 'Research',
        confidence: 0.92,
        findings: { articles: researchArticles }
      };
      agentsInvoked.push({ name: 'Research Agent', confidence: 0.92 });
    }

    if (requiredAgents.includes('GapAnalysis')) {
      const gaps = this.gapAnalysisService.analyzeGaps(['Chest Pain', 'Cough'], profile.conditions);
      agentOutputs['GapAnalysis'] = {
        agent: 'GapAnalysis',
        confidence: 0.89,
        findings: gaps
      };
      agentsInvoked.push({ name: 'Gap Analysis Agent', confidence: 0.89 });
    }

    // 3. Assemble Unified Evidence Package
    const evidencePackage: EvidencePackage = {
      patientDemographics: {
        name: profile.name,
        id: profile.patientId,
        age: profile.age,
        gender: profile.gender,
        riskCategory: profile.riskCategory
      },
      medicalHistory: profile.conditions,
      allergies: profile.allergies,
      currentMedications: profile.medications,
      labValues: profile.recentLabs || [],
      imaging: profile.documents ? profile.documents.filter((d: any) => d.category === 'X-ray' || d.category === 'CT').map((d: any) => d.name) : [],
      previousVisits: profile.visitHistory || [],
      researchEvidence: agentOutputs['Research']?.findings?.articles || [],
      drugInteractions: agentOutputs['Medication']?.findings?.interactions || [],
      allergyConflicts: agentOutputs['Medication']?.findings?.allergyConflicts || [],
      differentialDiagnosis: ['Community-Acquired Pneumonia (J18.9)', 'Acute Bronchitis (J20.9)']
    };

    // Extract Citations
    const citations: string[] = [];
    if (evidencePackage.researchEvidence.length > 0) {
      for (const art of evidencePackage.researchEvidence) {
        citations.push(`${art.journal} (${art.year}) - PMID: ${art.pmid}`);
      }
    }
    if (evidencePackage.allergyConflicts.length > 0) {
      citations.push('Patient EHR Documented Allergy Record');
    }
    if (evidencePackage.drugInteractions.length > 0) {
      citations.push('openFDA Drug Label API & RxNorm Database');
    }

    // 4. Formulate System & Multi-Turn Messages for Real LLM
    const systemPrompt = `You are ClinicaMind AI Copilot, an enterprise-grade clinical decision support assistant built on NitroStack MCP.
Your task is to answer the physician's query accurately using ONLY the provided Patient Evidence Package.

CRITICAL INSTRUCTIONS:
- NEVER fabricate patient data or clinical facts not present in the Evidence Package.
- Explicitly cite PMIDs, guidelines (JAMA, NEJM), and EHR documented allergy records whenever applicable.
- If there is a drug contraindication or allergy conflict (e.g. Penicillin allergy), highlight it immediately with high clinical severity.
- Keep the response clear, structured, professional, and directly actionable for an attending physician.

CURRENT PATIENT EVIDENCE PACKAGE:
${JSON.stringify(evidencePackage, null, 2)}`;

    const messages: LlmMessage[] = [{ role: 'system', content: systemPrompt }];

    // Append conversation memory if present
    if (req.conversationHistory && req.conversationHistory.length > 0) {
      for (const turn of req.conversationHistory) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    messages.push({ role: 'user', content: req.query });

    // 5. Generate LLM Completion
    const llmResult = await this.llmProviderService.generateCompletion({
      messages,
      temperature: 0.2,
      maxTokens: 1024
    });

    return {
      answer: llmResult.text,
      providerInfo: { provider: llmResult.provider, model: llmResult.model },
      agentsInvoked,
      evidencePackage,
      citations
    };
  }
}
