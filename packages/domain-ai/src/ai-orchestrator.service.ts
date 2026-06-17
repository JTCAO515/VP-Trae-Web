import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  AIChatPayload,
  AIChatRequest,
  AIModelSummary,
  AIRouteSummary,
  AITripPlanPayload,
  AITripPlanRequest,
  AITaskType,
} from '@visepanda/shared-types';

import type { InvocationAttemptLog, InvocationLogEntity } from './invocation-log.entity';
import type { ModelProfileEntity } from './model-profile.entity';
import type { PromptTemplateEntity } from './prompt-template.entity';
import type { RoutePolicyEntity } from './route-policy.entity';
import type { TaskTypeEntity } from './task-type.entity';
import { AI_PROVIDERS, type AIProvider } from './providers/provider.interface';

type AIRequestInput = AIChatRequest | AITripPlanRequest;

@Injectable()
export class AIOrchestratorService {
  private readonly taskTypes: TaskTypeEntity[];
  private readonly modelProfiles: ModelProfileEntity[];
  private readonly routePolicies: RoutePolicyEntity[];
  private readonly promptTemplates: PromptTemplateEntity[];
  private readonly invocationLogs: InvocationLogEntity[] = [];

  constructor(@Inject(AI_PROVIDERS) private readonly providers: AIProvider[]) {
    const now = new Date();

    this.taskTypes = [
      {
        code: 'chat_travel_advice',
        name: 'Travel Chat',
        description: '通用旅行问答与建议。',
        createdAt: now,
        updatedAt: now,
      },
      {
        code: 'trip_planning',
        name: 'Trip Planning',
        description: '结构化行程规划与路线编排。',
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.modelProfiles = [
      {
        id: 'model-chat-primary',
        provider: 'mock-openai',
        model: 'openai:gpt-4.1-mini',
        capabilities: ['chat', 'reasoning'],
        priority: 100,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'model-trip-primary',
        provider: 'mock-google',
        model: 'google:gemini-2.5-pro',
        capabilities: ['planning', 'reasoning'],
        priority: 90,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'model-trip-fallback',
        provider: 'mock-anthropic',
        model: 'anthropic:claude-3-5-haiku',
        capabilities: ['planning', 'fallback'],
        priority: 80,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.routePolicies = [
      {
        id: 'route-chat-default',
        taskType: 'chat_travel_advice',
        routePolicy: 'chat_travel_advice.default',
        primaryModelId: 'model-chat-primary',
        fallbackModelIds: [],
        promptTemplateVersion: 'travel-chat@v1',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'route-trip-default',
        taskType: 'trip_planning',
        routePolicy: 'trip_planning.default',
        primaryModelId: 'model-trip-primary',
        fallbackModelIds: ['model-trip-fallback'],
        promptTemplateVersion: 'trip-plan@v1',
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.promptTemplates = [
      {
        id: 'template-travel-chat-v1',
        taskType: 'chat_travel_advice',
        version: 'travel-chat@v1',
        template: 'travel-chat@v1 请回答旅行问题：{{message}}',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'template-travel-chat-v2',
        taskType: 'chat_travel_advice',
        version: 'travel-chat@v2',
        template: 'travel-chat@v2 请用更强的比较视角回答：{{message}}',
        isActive: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'template-trip-plan-v1',
        taskType: 'trip_planning',
        version: 'trip-plan@v1',
        template:
          'trip-plan@v1 为 {{destination}} 生成 {{days}} 天游行程，重点关注 {{interests}}。',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  async chat(input: AIChatRequest): Promise<AIChatPayload> {
    const taskType = this.resolveTaskType(input.message);
    return this.invoke(taskType, input);
  }

  async planTrip(input: AITripPlanRequest): Promise<AITripPlanPayload> {
    return this.invoke('trip_planning', input);
  }

  listModels(): AIModelSummary[] {
    return this.modelProfiles.map((profile) => ({
      id: profile.id,
      provider: profile.provider,
      model: profile.model,
      capabilities: [...profile.capabilities],
      priority: profile.priority,
      status: profile.status,
    }));
  }

  listRoutes(): AIRouteSummary[] {
    return this.routePolicies.map((policy) => ({
      taskType: policy.taskType,
      routePolicy: policy.routePolicy,
      primaryModelId: policy.primaryModelId,
      fallbackModelIds: [...policy.fallbackModelIds],
      promptTemplateVersion: policy.promptTemplateVersion,
    }));
  }

  getInvocationLog(logId: string): InvocationLogEntity | undefined {
    return this.invocationLogs.find((log) => log.id === logId);
  }

  countInvocationLogs(): number {
    return this.invocationLogs.length;
  }

  resolveTaskType(message: string): AITaskType {
    const normalized = message.trim();

    if (!normalized) {
      throw new BadRequestException('Message is required');
    }

    if (/(行程|规划|计划|几天|路线|攻略)/.test(normalized)) {
      return 'trip_planning';
    }

    return 'chat_travel_advice';
  }

  selectModel(taskType: AITaskType): {
    policy: RoutePolicyEntity;
    candidates: ModelProfileEntity[];
  } {
    const policy = this.routePolicies.find((item) => item.taskType === taskType);

    if (!policy) {
      throw new BadRequestException(`Route policy for ${taskType} not found`);
    }

    const candidates = [policy.primaryModelId, ...policy.fallbackModelIds].map((modelId) =>
      this.getModelProfile(modelId),
    );

    return {
      policy,
      candidates,
    };
  }

  buildPrompt(taskType: AITaskType, input: AIRequestInput): {
    prompt: string;
    promptTemplateVersion: string;
  } {
    const policy = this.getRoutePolicy(taskType);
    const requestedVersion =
      input.promptTemplateVersion?.trim() || policy.promptTemplateVersion;
    const template = this.promptTemplates.find(
      (item) => item.taskType === taskType && item.version === requestedVersion,
    );

    if (!template) {
      throw new BadRequestException(`Prompt template ${requestedVersion} not found`);
    }

    return {
      prompt: this.renderTemplate(template, input),
      promptTemplateVersion: template.version,
    };
  }

  async invoke(taskType: AITaskType, input: AIRequestInput): Promise<AIChatPayload> {
    const { policy, candidates } = this.selectModel(taskType);
    const { prompt, promptTemplateVersion } = this.buildPrompt(taskType, input);
    const attempts: InvocationAttemptLog[] = [];

    for (const candidate of candidates) {
      const provider = this.getProvider(candidate.provider);

      try {
        const result = await provider.invoke({
          modelProfile: candidate,
          taskType,
          prompt,
          promptTemplateVersion,
          input: this.toRequestPayload(input),
        });

        const payload: AIChatPayload = {
          answer: result.answer,
          taskType,
          model: candidate.model,
          provider: candidate.provider,
          routePolicy: policy.routePolicy,
          promptTemplateVersion,
          logId: '',
          fallbackUsed: attempts.length > 0,
          attemptCount: attempts.length + 1,
        };

        attempts.push({
          modelId: candidate.id,
          model: candidate.model,
          provider: candidate.provider,
          status: 'succeeded',
          errorMessage: null,
        });

        const log = this.recordLog({
          taskType,
          routePolicy: policy.routePolicy,
          promptTemplateVersion,
          selectedModelId: candidate.id,
          selectedModel: candidate.model,
          provider: candidate.provider,
          attempts,
          fallbackUsed: payload.fallbackUsed,
          requestPayload: this.toRequestPayload(input),
          responsePayload: {
            answer: payload.answer,
          },
        });

        payload.logId = log.id;
        return payload;
      } catch (error) {
        attempts.push({
          modelId: candidate.id,
          model: candidate.model,
          provider: candidate.provider,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown provider error',
        });
      }
    }

    throw new BadRequestException('All AI providers failed');
  }

  recordLog(
    input: Omit<InvocationLogEntity, 'id' | 'createdAt' | 'completedAt'>,
  ): InvocationLogEntity {
    const now = new Date();
    const log: InvocationLogEntity = {
      id: randomUUID(),
      createdAt: now,
      completedAt: now,
      ...input,
      attempts: input.attempts.map((attempt) => ({ ...attempt })),
      requestPayload: { ...input.requestPayload },
      responsePayload: { ...input.responsePayload },
    };

    this.invocationLogs.push(log);
    return log;
  }

  private getRoutePolicy(taskType: AITaskType): RoutePolicyEntity {
    const policy = this.routePolicies.find((item) => item.taskType === taskType);

    if (!policy) {
      throw new BadRequestException(`Route policy for ${taskType} not found`);
    }

    return policy;
  }

  private getModelProfile(modelId: string): ModelProfileEntity {
    const profile = this.modelProfiles.find((item) => item.id === modelId && item.status === 'active');

    if (!profile) {
      throw new BadRequestException(`Model profile ${modelId} not found`);
    }

    return profile;
  }

  private getProvider(name: string): AIProvider {
    const provider = this.providers.find((item) => item.name === name);

    if (!provider) {
      throw new BadRequestException(`Provider ${name} not found`);
    }

    return provider;
  }

  private renderTemplate(template: PromptTemplateEntity, input: AIRequestInput): string {
    const variables = this.toTemplateVariables(input);

    return Object.entries(variables).reduce((current, [key, value]) => {
      return current.replaceAll(`{{${key}}}`, value);
    }, template.template);
  }

  private toTemplateVariables(input: AIRequestInput): Record<string, string> {
    if ('message' in input) {
      return {
        message: input.message.trim(),
        locale: input.locale?.trim() || 'en-US',
      };
    }

    return {
      destination: input.destination.trim(),
      days: String(input.days),
      interests: input.interests?.join('、') || '常规旅行',
      locale: input.locale?.trim() || 'en-US',
    };
  }

  private toRequestPayload(input: AIRequestInput): Record<string, unknown> {
    if ('message' in input) {
      return {
        message: input.message,
        locale: input.locale ?? 'en-US',
        tripContextId: input.tripContextId ?? null,
        promptTemplateVersion: input.promptTemplateVersion ?? null,
      };
    }

    return {
      destination: input.destination,
      days: input.days,
      interests: [...(input.interests ?? [])],
      locale: input.locale ?? 'en-US',
      promptTemplateVersion: input.promptTemplateVersion ?? null,
    };
  }
}
