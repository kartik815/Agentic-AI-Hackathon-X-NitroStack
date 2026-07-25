import { Module } from '@nitrostack/core';
import { HistoryModule } from '../history/history.module';
import { MedicationModule } from '../medication/medication.module';
import { ResearchModule } from '../research/research.module';
import { GapAnalysisModule } from '../gap-analysis/gap-analysis.module';
import { ReportModule } from '../report/report.module';
import { SupervisorService } from './supervisor.service';
import { SupervisorController } from './supervisor.controller';
import { LlmProviderService } from './llm-provider.service';
import { CopilotOrchestratorService } from './copilot-orchestrator.service';

@Module({
  name: 'supervisor',
  description: 'Clinical Supervisor & Multi-Agent Orchestrator Module',
  imports: [
    HistoryModule,
    MedicationModule,
    ResearchModule,
    GapAnalysisModule,
    ReportModule
  ],
  controllers: [SupervisorController],
  providers: [SupervisorService, LlmProviderService, CopilotOrchestratorService],
  exports: [SupervisorService, LlmProviderService, CopilotOrchestratorService]
})
export class SupervisorModule {}
