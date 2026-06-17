import { Module } from '@nestjs/common';

import {
  CONTENT_REPOSITORY,
  ContentController,
  ContentService,
  InMemoryContentRepository,
} from '@visepanda/domain-content';

@Module({
  controllers: [ContentController],
  providers: [
    ContentService,
    {
      provide: CONTENT_REPOSITORY,
      useClass: InMemoryContentRepository,
    },
  ],
  exports: [ContentService],
})
export class ContentModule {}
