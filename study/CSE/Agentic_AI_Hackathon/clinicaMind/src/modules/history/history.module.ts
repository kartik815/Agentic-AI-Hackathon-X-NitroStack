import { Module } from '@nitrostack/core';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  name: 'history',
  description: 'Patient Electronic Health Record (EHR) Agent Module',
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService]
})
export class HistoryModule {}
