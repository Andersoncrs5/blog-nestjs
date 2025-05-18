import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from '../../src/auth/auth.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, 
  forwardRef(() => UserMetricsModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
