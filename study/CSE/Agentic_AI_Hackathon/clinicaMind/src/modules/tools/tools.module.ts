import { Module } from '@nitrostack/core';
import { ClinicalToolsService } from './clinical.tools';

@Module({
  name: 'clinical-tools',
  description: 'Module containing 12 clinical MCP tools for EHR data retrieval, diagnosis, guidelines, and report generation.',
  controllers: [ClinicalToolsService],
  providers: [ClinicalToolsService],
  exports: [ClinicalToolsService]
})
export class ToolsModule {}
