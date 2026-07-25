import { NextResponse } from 'next/server';
import { SupervisorService } from '../../../../modules/supervisor/supervisor.service';
import { HistoryService } from '../../../../modules/history/history.service';
import { MedicationService } from '../../../../modules/medication/medication.service';
import { ResearchService } from '../../../../modules/research/research.service';
import { GapAnalysisService } from '../../../../modules/gap-analysis/gap-analysis.service';
import { ReportService } from '../../../../modules/report/report.service';

const historyService = new HistoryService();
const medicationService = new MedicationService();
const researchService = new ResearchService();
const gapAnalysisService = new GapAnalysisService();
const reportService = new ReportService();

const supervisorService = new SupervisorService(
  historyService,
  medicationService,
  researchService,
  gapAnalysisService,
  reportService
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = body.transcript || 'General Consultation';
    const patientId = body.patientId || '1234';

    const result = await supervisorService.orchestrateConsultation(transcript, patientId);

    return NextResponse.json({
      status: 'success',
      agent: 'Supervisor Agent',
      data: result
    });
  } catch (error: any) {
    console.error('❌ [API Evaluate Error]:', error);
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Failed to evaluate consultation', stack: error?.stack },
      { status: 500 }
    );
  }
}
