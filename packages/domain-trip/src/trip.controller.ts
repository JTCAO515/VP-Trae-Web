import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { AuthService } from '@visepanda/domain-auth';

import {
  type CreateTripInput,
  type CreateTripSnapshotInput,
  TripService,
} from './trip.service';

@Controller('trips')
export class TripController {
  constructor(
    private readonly tripService: TripService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  createTrip(@Headers('authorization') authorization: string | undefined, @Body() body: CreateTripInput) {
    const userId = this.authService.verifySession(authorization).user.id;
    return this.tripService.createTrip(userId, body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  listTrips(@Headers('authorization') authorization: string | undefined) {
    const userId = this.authService.verifySession(authorization).user.id;
    return this.tripService.listTrips(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getTrip(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    const userId = this.authService.verifySession(authorization).user.id;
    return this.tripService.getTrip(userId, id);
  }

  @Post(':id/snapshot')
  @HttpCode(HttpStatus.CREATED)
  createSnapshot(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: CreateTripSnapshotInput,
  ) {
    const userId = this.authService.verifySession(authorization).user.id;
    return this.tripService.createSnapshot(userId, id, body);
  }
}
