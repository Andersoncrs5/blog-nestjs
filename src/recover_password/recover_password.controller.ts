import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UnitOfWork } from '../../src/utils/UnitOfWork/UnitOfWork';
import { User } from '../../src/user/entities/user.entity';
import { resetPasswordDTO } from './dto/resetPasswordDTO.dto';
import { ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@Controller({ path:'recover-password', version:'1'})
export class RecoverPasswordController {
  constructor(private readonly unit: UnitOfWork) {}

  @Get('request-password-reset/:email')
  @Throttle({long: { ttl: 4000, limit: 2 } })
  async requestPasswordReset(@Param('email') email: string) {
    const user: User = await this.unit.userService.findOneByEmail(email);

    this.unit.recoverPassword.requestPasswordReset(user);

    return {
      'message': 'Token sended!!'
    }
  }
  
  @Post('reset-password')
  @Throttle({long: { ttl: 4000, limit: 4 } })
  @ApiBody({ type: resetPasswordDTO })
  async resetPassword(@Body() dto: resetPasswordDTO ) {
    const user: User = await this.unit.userService.findOneByEmail(dto.email);
    const result = await this.unit.recoverPassword.resetPassword(dto.token, dto.password, dto.confirmPassword);

    this.unit.userService.update(user, result);

    return {
      'message': 'Password updated with successfully'
    }
  }

}
