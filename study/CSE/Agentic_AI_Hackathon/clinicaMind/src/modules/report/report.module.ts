import { Module } from '@nitrostack/core';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  name: 'report',
  description: 'Clinical Briefing Report Generator Agent Module',
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService]
})
export class ReportModule {}
