import { Module } from '@nitrostack/core';
import { ResearchService } from './research.service';
import { ResearchController } from './research.controller';

@Module({
  name: 'research',
  description: 'PubMed Medical Literature Research Agent Module',
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService]
})
export class ResearchModule {}
