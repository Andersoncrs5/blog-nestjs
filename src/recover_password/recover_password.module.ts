import { forwardRef, Module } from '@nestjs/common';
import { RecoverPasswordService } from './recover_password.service';
import { RecoverPasswordController } from './recover_password.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecoverPassword } from './entities/recover_password.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecoverPassword]),
  forwardRef(() => UnitOfWorkModule)],
  controllers: [RecoverPasswordController],
  providers: [RecoverPasswordService],
  exports: [RecoverPasswordService],
  
})
export class RecoverPasswordModule {}