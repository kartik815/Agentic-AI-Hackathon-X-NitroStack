import { ToolDecorator as Tool, Widget, ExecutionContext, Injectable, z } from '@nitrostack/core';
import { SupervisorService } from './supervisor.service';

function clinicalWidget(route: string) {
  return {
    route,
    prefersBorder: true
  };
}

const EvaluateConsultationSchema = z.object({
  transcript: z.string().describe('Live consultation transcript text spoken by doctor or patient'),
  patientId: z.string().optional().default('1234').describe('Target patient EHR ID')
});

@Injectable({ deps: [SupervisorService] })
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Tool({
    name: 'evaluate_consultation',
    description: 'Main ClinicaMind multi-agent orchestrator. Processes live consultation speech transcripts and generates real-time React Flow agent graph nodes.',
    inputSchema: EvaluateConsultationSchema,
    examples: {
      request: { transcript: 'I have chest pain and a productive cough.', patientId: '1234' },
      response: {
        status: 'success',
        agent: 'Supervisor Agent',
        nodesCount: 7
      }
    }
  })
  @Widget(clinicalWidget('clinical-canvas'))
  async evaluateConsultation(args: z.infer<typeof EvaluateConsultationSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`⚡ [Supervisor Agent] Orchestrating consultation transcript (${args.transcript.length} chars)...`);
    const orchestrationResult = await this.supervisorService.orchestrateConsultation(args.transcript, args.patientId);
    return {
      status: 'success',
      agent: 'Supervisor Agent',
      data: orchestrationResult
    };
  }
}
