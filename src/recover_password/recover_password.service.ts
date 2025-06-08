import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RecoverPassword } from './entities/recover_password.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../src/user/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as nodemailer from 'nodemailer';
import { isUUID } from 'class-validator';
import { UpdateUserDto } from '../../src/user/dto/update-user.dto';

@Injectable()
export class RecoverPasswordService {
   constructor(
    @InjectRepository(RecoverPassword)
    private readonly repository: Repository<RecoverPassword>,
  ) {}

  private readonly transporter = nodemailer.createTransport({
      service: String(process.env.SERVICE),
      auth: {
        user: String(process.env.EMAIL),
        pass: String(process.env.PASSWORD),
      }
    });

  @Transactional()
  async requestPasswordReset(user: User) {
    
    await this.repository.delete({ user })

    const token: string = randomUUID()

    const expireAt = new Date(Date.now() + 30 * 60 * 1000); 

    const recover = this.repository.create({
      token,
      expireAt,
      user
    });

    await this.repository.save(recover);

    const link = `http://localhost:${process.env.PORT}/v1/user/reset-password`;
    await this.sendResetEmail(user.email, link, token)
  }

  async sendResetEmail(to: string, linkUrl: string, token: string) {
    if (token == null) { throw new BadRequestException('Token is required') }

    const filePath = path.join(process.cwd(), 'src', 'templates', 'reset-password-email.html');
    let html = fs.readFileSync(filePath, 'utf8')

    html = html.replace(/{{link}}/g, linkUrl);
    html = html.replace(/{{token}}/g, token);

    await this.transporter.sendMail({
      from: `"Support MyTask" <${process.env.EMAIL}>`,
      to,
      subject: 'Recover your password',
      html
    });
  }

  @Transactional()
  async resetPassword(token: string, password: string, confirmPassword: string) {
    if (!token || !isUUID(token))  { throw new UnauthorizedException(); }

    const recover = await this.repository.findOne({
      where: { token },
      relations: ['user']
    });

    if (!recover) { throw new UnauthorizedException(); }

    if (password !== confirmPassword)  { throw new BadRequestException('password are not equals'); }

    if (recover.used) { throw new BadRequestException('Token used!') }

    if (recover.expireAt.getTime() < Date.now()) {
      throw new BadRequestException('Token expired!');
    }

    const data: UpdateUserDto = { 
      email: recover.user.email,
      password,
      name: recover.user.name,
      version: recover.user.version,
    }

    recover.used = true;
    await this.repository.save(recover);

    return data;
  }

  async sendEmailOfWelcome(to: string, name: string) {
    if (!to || !name ) { throw new NotFoundException('Error the send email of welcome') }

    const filePath = path.join(process.cwd(), 'src', 'templates', 'welcome.email.html');

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Email template not found.');
    }

    let html = fs.readFileSync(filePath, 'utf8')
    const link = `http://localhost:${process.env.PORT}/v1/user`;

    html = html.replace(/{{link}}/g, link);
    html = html.replace(/{{name}}/g, name);

    await this.transporter.sendMail({
      from: `"Support MyBlog" ${process.env.EMAIL}`,
      to,
      subject: 'Welcome to MyBlog',
      html
    });
  }

}
