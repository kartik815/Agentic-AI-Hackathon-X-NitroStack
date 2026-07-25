import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { SupervisorModule } from './modules/supervisor/supervisor.module';

/**
 * Root Application Module for ClinicaMind
 * 
 * Multi-Agent AI Clinical Decision Support Workspace built with NitroStack MCP.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'clinica-mind-server',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})
@Module({
  name: 'clinica-mind',
  description: 'AI Clinical Intelligence & Multi-Agent Decision Support Workspace',
  imports: [
    ConfigModule.forRoot(),
    SupervisorModule
  ]
})
export class AppModule {}
