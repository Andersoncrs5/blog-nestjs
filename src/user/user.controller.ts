import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RefreshTokenDTO } from 'src/auth/dtos/refresh-token.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.FOUND)
  async findOne(@Req() req) {
    return await this.userService.findOne(+req.user.sub);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+req.user.sub, updateUserDto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req) {
    return await this.userService.remove(+req.user.sub);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() user: LoginUserDTO){
    return await this.userService.LoginAsync(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req) {
    return await this.userService.logout(req.user.sub);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDTO })
  @ApiBearerAuth()
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDTO) {
    return await this.userService.refreshToken(refreshTokenDto.refresh_token);
  }

}
