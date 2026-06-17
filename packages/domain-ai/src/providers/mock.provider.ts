import { Injectable } from '@nestjs/common';

import type {
  AIProvider,
  AIProviderInvocationRequest,
  AIProviderInvocationResult,
} from './provider.interface';

@Injectable()
export class MockOpenAIProvider implements AIProvider {
  readonly name = 'mock-openai';

  async invoke(request: AIProviderInvocationRequest): Promise<AIProviderInvocationResult> {
    return {
      answer: `[${request.promptTemplateVersion}] ${request.prompt}`,
    };
  }
}

@Injectable()
export class MockGoogleProvider implements AIProvider {
  readonly name = 'mock-google';

  async invoke(request: AIProviderInvocationRequest): Promise<AIProviderInvocationResult> {
    if (request.prompt.includes('故障演练')) {
      throw new Error('Primary planner temporarily unavailable');
    }

    return {
      answer: `[${request.promptTemplateVersion}] ${request.prompt}`,
    };
  }
}

@Injectable()
export class MockAnthropicProvider implements AIProvider {
  readonly name = 'mock-anthropic';

  async invoke(request: AIProviderInvocationRequest): Promise<AIProviderInvocationResult> {
    return {
      answer: `[${request.promptTemplateVersion}] ${request.prompt}`,
    };
  }
}
