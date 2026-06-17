import { Module } from '@nestjs/common';

import { AIOrchestratorService } from '@visepanda/domain-ai';
import {
  INVOCATION_LOG_READER,
  InMemoryTripRepository,
  TripController,
  TripService,
  TRIP_REPOSITORY,
} from '@visepanda/domain-trip';

import { AIModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, AIModule],
  controllers: [TripController],
  providers: [
    TripService,
    {
      provide: TRIP_REPOSITORY,
      useClass: InMemoryTripRepository,
    },
    {
      provide: INVOCATION_LOG_READER,
      useExisting: AIOrchestratorService,
    },
    {
      provide: 'TripService',
      useExisting: TripService,
    },
  ],
  exports: [TripService],
})
export class TripModule {}
