import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { UserMetricsService } from './user_metrics.service';

@Controller('user-metrics')
export class UserMetricsController {
  constructor(private readonly userMetricsService: UserMetricsService) {}

//   @Get('/metric')
//   async findOne(@Req() req) {
//     return await this.userMetricsService.findOne(res.user.sub);
//   }

}
