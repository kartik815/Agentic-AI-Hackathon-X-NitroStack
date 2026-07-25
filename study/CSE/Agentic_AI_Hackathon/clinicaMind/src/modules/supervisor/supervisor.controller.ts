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
  patientId: z.string().optional().default('1234').describe('Target patient EHR ID'),
  doctorQuestion: z.string().optional().describe('Doctor question or decision query')
});

const PlanExecutionSchema = z.object({
  doctorQuestion: z.string().optional().describe('Doctor query or inquiry'),
  patientId: z.string().optional().default('1234').describe('Target patient EHR ID'),
  transcript: z.string().optional().describe('Live consultation speech transcript'),
  consultationContext: z.record(z.any()).optional().describe('Additional clinical context object')
});

@Injectable({ deps: [SupervisorService] })
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Tool({
    name: 'plan_consultation_execution',
    description: 'Supervisor Agent planning tool. Accepts doctor questions, patient ID, transcript, and context to produce an MCP execution plan of required tools.',
    inputSchema: PlanExecutionSchema
  })
  async planExecution(args: z.infer<typeof PlanExecutionSchema>, ctx: ExecutionContext) {
    ctx.logger.info(`[Supervisor Agent] Planning execution for patient ${args.patientId}...`);
    const plan = await this.supervisorService.planExecution(args);
    return {
      status: 'success',
      agent: 'Supervisor Agent',
      executionPlan: plan
    };
  }

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
