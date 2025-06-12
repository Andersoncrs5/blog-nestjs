import { Controller, Get, Post, Param, Delete, HttpCode, UseGuards, HttpStatus, Req } from '@nestjs/common';
import { UnitOfWork } from '../../src/utils/UnitOfWork/UnitOfWork';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { User } from '../../src/user/entities/user.entity';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';

@Controller('followers')
export class FollowersController {
  constructor(private readonly unit: UnitOfWork) {}

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async create(@Req() req,@Param('userId') userId: string) {
    const follower: User = await this.unit.userService.findOneV2(+req.user.sub)
    const following: User = await this.unit.userService.findOne(+userId)

    const followerMetric = await this.unit.userMetricService.findOneV2(follower);
    await this.unit.userMetricService.sumOrReduceFollowersCount(followerMetric, ActionEnum.SUM);

    const followingMetric = await this.unit.userMetricService.findOneV2(following);
    await this.unit.userMetricService.sumOrReduceFollowersCount(followingMetric, ActionEnum.SUM);

    this.unit.followersService.create(follower, following);
  }

  @Get('/findAllFollower')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAllFollower(@Req() req) {
    const follower: User = await this.unit.userService.findOneV2(+req.user.sub)
    await this.unit.followersService.findAllFollower(follower);
  }

  @Get('/findAllFollowing/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@Param('userId') userId: string ) {
    const followering: User = await this.unit.userService.findOne(+userId)
    await this.unit.followersService.findAllFollowing(followering);
  }

  @Get('/check/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkIfFollowing(@Req() req, @Param('userId') userId: string ) {
    const follower: User = await this.unit.userService.findOneV2(+req.user.sub)
    const following: User = await this.unit.userService.findOne(+userId)
    await this.unit.followersService.checkIfFollowing(follower, following);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req, @Param('userId') userId: string) {
    const follower: User = await this.unit.userService.findOneV2(+req.user.sub)
    const following: User = await this.unit.userService.findOne(+userId)

    const followerMetric = await this.unit.userMetricService.findOneV2(follower);
    await this.unit.userMetricService.sumOrReduceFollowersCount(followerMetric, ActionEnum.REDUCE);

    const followingMetric = await this.unit.userMetricService.findOneV2(following);
    await this.unit.userMetricService.sumOrReduceFollowersCount(followingMetric, ActionEnum.REDUCE);

    await this.unit.followersService.remove(+userId, follower);
  }
}
