import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RefreshTokenDTO } from '../../src/auth/dtos/refresh-token.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { UnitOfWork } from 'src/utils/UnitOfWork/UnitOfWork';
import { User } from './entities/user.entity';
import { ResponseDto } from 'src/utils/Responses/ResponseDto.reponse';
import { ActionEnum } from 'src/user_metrics/action/ActionEnum.enum';

@Controller('user')
export class UserController {
  constructor(private readonly unit: UnitOfWork) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user: User = await this.unit.userService.create(createUserDto);
    await this.unit.userMetricService.create(user);
    const tokens = await this.unit.authService.token(user);
  
    return ResponseDto.of("Welcome!!", tokens, "no");
  }

  @Get('/seeProfileOfUser/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async seeProfileOfUser(@Req() req, @Param() userId: string ) {
    const user = await this.unit.userService.findOne(+userId);
    const UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceProfileViews(UserMetric, ActionEnum.SUM);

    return ResponseDto.of("User founded!!", user, "no");
  }


  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req) {
    const user = await this.unit.userService.findOne(+req.user.sub);
    return ResponseDto.of("User founded!!", user, "no");
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    const userUpdated = await this.unit.userService.update(user, updateUserDto);
    const UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceEditedCount(UserMetric, ActionEnum.SUM);

    return ResponseDto.of("User updated with success", userUpdated, "no");
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    await this.unit.userService.remove(user);
    
    return ResponseDto.of("User deleted", "null", "no");
  }

  @Post("/login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() user: LoginUserDTO){
    const userFound: User = await this.unit.userService.LoginAsync(user);

    const tokens = await this.unit.authService.token(userFound);

    return ResponseDto.of("Welcome again!!!", tokens, "no");
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req) {
    const user: User = await this.unit.userService.findOne(req.user.sub)
    await this.unit.userService.logout(user);

    return ResponseDto.of("Bye Bye!!!", "null", "no");
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDTO })
  @ApiBearerAuth()
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDTO) {
    
    return await this.unit.authService.refreshToken(refreshTokenDto.refresh_token);
  }

}
