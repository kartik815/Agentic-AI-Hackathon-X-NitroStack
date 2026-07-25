import { Module } from '@nitrostack/core';
import { MedicationService } from './medication.service';
import { MedicationController } from './medication.controller';

@Module({
  name: 'medication',
  description: 'Medication Safety & Interaction Agent Module',
  controllers: [MedicationController],
  providers: [MedicationService],
  exports: [MedicationService]
})
export class MedicationModule {}
