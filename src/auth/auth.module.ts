import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../../src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './JwtStrategy';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: String(process.env.JWT_EXPIRES_IN + 'h' ) || '24h' },
    }),
  ], 
  providers: [AuthService, JwtStrategy],
  controllers: [],
  exports : [AuthService]
})
export class AuthModule {}