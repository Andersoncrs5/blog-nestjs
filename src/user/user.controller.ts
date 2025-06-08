import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RefreshTokenDTO } from '../../src/auth/dtos/refresh-token.dto';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { UnitOfWork } from '../../src/utils/UnitOfWork/UnitOfWork';
import { User } from './entities/user.entity';
import { ResponseDto } from '../../src/utils/Responses/ResponseDto.reponse';
import { ActionEnum } from '../../src/user_metrics/action/ActionEnum.enum';
import { Throttle } from '@nestjs/throttler';

// @Controller({ path:'user', version:'1'})
@Controller('/user')
export class UserController {
  constructor(private readonly unit: UnitOfWork) {}

  @Get('/see-profile-of-user/:email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ long: { ttl: 2000, limit: 6 } })
  @HttpCode(HttpStatus.OK)
  async seeProfileOfUser(@Param('email') email: string, @Req() req) {
    const user = await this.unit.userService.findOneByEmail(email);
    const UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceProfileViews(UserMetric, ActionEnum.SUM);

    return ResponseDto.of("User founded!!", user, "no");
  }


  @Post('/register')
  @Throttle({ short: { ttl: 1000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user: User = await this.unit.userService.create(createUserDto);
    await this.unit.userMetricService.create(user);
    const tokens = await this.unit.authService.token(user);
    // await this.unit.recoverPassword.sendEmailOfWelcome(user.email, user.name);
  
    return ResponseDto.of("Welcome!!", tokens, "no");
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 8 } })
  async findOne(@Req() req) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);

    return ResponseDto.of(
      "User founded!!", 
      user, 
      "no"
    );
  }

  @Put('/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 3000, limit: 4 } })
  async update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    console.log('UPDATE USER CONTROLLER CHAMADO');

    const user: User = await this.unit.userService.findOne(+req.user.sub);
    const userUpdated = await this.unit.userService.update(user, updateUserDto);
    const UserMetric = await this.unit.userMetricService.findOne(user);
    await this.unit.userMetricService.sumOrReduceEditedCount(UserMetric, ActionEnum.SUM);

    return ResponseDto.of(
      "User updated with success", 
      userUpdated, 
      "no"
    );
  }

  @Delete('/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 2000, limit: 2 } })
  async remove(@Req() req) {
    const user: User = await this.unit.userService.findOne(+req.user.sub);
    await this.unit.userService.remove(user);
    
    return ResponseDto.of("User deleted", "null", "no");
  }

  @Post("/login")
  @HttpCode(HttpStatus.OK)
  @Throttle({long: { ttl: 4000, limit: 5 } })
  async login(@Body() user: LoginUserDTO){
    const userFound: User = await this.unit.userService.LoginAsync(user);

    const tokens = await this.unit.authService.token(userFound);

    return ResponseDto.of(
      "Welcome again!!!", 
      tokens, 
      "no"
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({long: { ttl: 2000, limit: 4 } })
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
  @Throttle({long: { ttl: 2000, limit: 6 } })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDTO) {
    return await this.unit.authService.refreshToken(refreshTokenDto.refresh_token);
  }

}
