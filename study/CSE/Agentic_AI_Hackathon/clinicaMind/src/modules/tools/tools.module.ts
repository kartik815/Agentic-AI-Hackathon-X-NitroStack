import { Module } from '@nitrostack/core';
import { ClinicalToolsService } from './clinical.tools';
import { HistoryModule } from '../history/history.module';
import { MedicationModule } from '../medication/medication.module';
import { ResearchModule } from '../research/research.module';
import { GapAnalysisModule } from '../gap-analysis/gap-analysis.module';
import { ReportModule } from '../report/report.module';
import { SupervisorModule } from '../supervisor/supervisor.module';

@Module({
  name: 'clinical-tools',
  description: 'Module containing 12 clinical MCP tools for EHR data retrieval, diagnosis, guidelines, and report generation.',
  imports: [
    HistoryModule,
    MedicationModule,
    ResearchModule,
    GapAnalysisModule,
    ReportModule,
    SupervisorModule
  ],
  controllers: [ClinicalToolsService],
  providers: [ClinicalToolsService],
  exports: [ClinicalToolsService]
})
export class ToolsModule {}
