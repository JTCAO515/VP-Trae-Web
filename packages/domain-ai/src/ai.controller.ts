import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import type { AIChatRequest, AITripPlanRequest } from '@visepanda/shared-types';

import { AIOrchestratorService } from './ai-orchestrator.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiOrchestratorService: AIOrchestratorService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: AIChatRequest) {
    return this.aiOrchestratorService.chat(body);
  }

  @Post('tasks/plan-trip')
  @HttpCode(HttpStatus.OK)
  planTrip(@Body() body: AITripPlanRequest) {
    return this.aiOrchestratorService.planTrip(body);
  }

  @Get('models')
  listModels() {
    return this.aiOrchestratorService.listModels();
  }

  @Get('routes')
  listRoutes() {
    return this.aiOrchestratorService.listRoutes();
  }
}
