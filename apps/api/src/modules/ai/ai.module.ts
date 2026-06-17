import { Module } from '@nestjs/common';

import {
  AIController,
  AIOrchestratorService,
  AI_PROVIDERS,
  MockAnthropicProvider,
  MockGoogleProvider,
  MockOpenAIProvider,
} from '@visepanda/domain-ai';

@Module({
  controllers: [AIController],
  providers: [
    AIOrchestratorService,
    MockOpenAIProvider,
    MockGoogleProvider,
    MockAnthropicProvider,
    {
      provide: AI_PROVIDERS,
      useFactory: (
        openAIProvider: MockOpenAIProvider,
        googleProvider: MockGoogleProvider,
        anthropicProvider: MockAnthropicProvider,
      ) => [openAIProvider, googleProvider, anthropicProvider],
      inject: [MockOpenAIProvider, MockGoogleProvider, MockAnthropicProvider],
    },
  ],
  exports: [AIOrchestratorService],
})
export class AIModule {}
