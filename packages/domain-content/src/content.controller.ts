import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

import {
  ContentService,
  type CreateDestinationDraftInput,
  type CreateToolGuideDraftInput,
  type ReviewContentInput,
  type RollbackContentInput,
  type UpdateDestinationDraftInput,
} from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('content/destinations/drafts')
  createDestinationDraft(@Body() body: CreateDestinationDraftInput) {
    return this.contentService.createDestinationDraft(body);
  }

  @Patch('content/destinations/:id/draft')
  updateDestinationDraft(@Param('id') id: string, @Body() body: UpdateDestinationDraftInput) {
    return this.contentService.updateDestinationDraft(id, body);
  }

  @Post('content/destinations/:id/review')
  @HttpCode(HttpStatus.OK)
  reviewDestination(@Param('id') id: string, @Body() body: ReviewContentInput) {
    return this.contentService.reviewDestination(id, body);
  }

  @Post('content/destinations/:id/publish')
  @HttpCode(HttpStatus.OK)
  publishDestination(@Param('id') id: string) {
    return this.contentService.publishDestination(id);
  }

  @Post('content/destinations/:id/rollback')
  @HttpCode(HttpStatus.OK)
  rollbackDestination(@Param('id') id: string, @Body() body: RollbackContentInput) {
    return this.contentService.rollbackDestination(id, body);
  }

  @Get('destinations')
  listDestinations(@Query('locale') locale?: string) {
    return this.contentService.listPublishedDestinations(locale);
  }

  @Get('destinations/:id')
  getDestination(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.contentService.getPublishedDestination(id, locale);
  }

  @Post('content/tools/drafts')
  createToolGuideDraft(@Body() body: CreateToolGuideDraftInput) {
    return this.contentService.createToolGuideDraft(body);
  }

  @Post('content/tools/:id/review')
  @HttpCode(HttpStatus.OK)
  reviewToolGuide(@Param('id') id: string, @Body() body: ReviewContentInput) {
    return this.contentService.reviewToolGuide(id, body);
  }

  @Post('content/tools/:id/publish')
  @HttpCode(HttpStatus.OK)
  publishToolGuide(@Param('id') id: string) {
    return this.contentService.publishToolGuide(id);
  }

  @Get('tools')
  listToolGuides(@Query('locale') locale?: string) {
    return this.contentService.listPublishedToolGuides(locale);
  }

  @Get('tools/:id')
  getToolGuide(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.contentService.getPublishedToolGuide(id, locale);
  }
}
