import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ){}

  @Transactional()
  async token(user: User){
    if (!user) {
      throw new NotFoundException('User is required');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      isAdm: user.isAdm, 
      isBlocked: user.isBlocked 
    };
    
    const accessToken = this.jwtService.sign(payload); 

    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    this.repository.save(user);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Transactional()
  async logout(userId: number) {
    const user = await this.repository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    user.refreshToken = null;
    await this.repository.save(user);

    return { message: 'Logout realizado com sucesso' };
  }

  @Transactional()
  async refreshToken(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);

    const foundUser = await this.repository.findOne({
      where: { id: payload.sub, refreshToken },
    });

    if (!foundUser) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const newAccessToken = this.jwtService.sign(
      { 
        sub: foundUser.id, 
        email: foundUser.email, 
        isAdm: foundUser.isAdm, 
        isBlocked: foundUser.isBlocked 
      }
    );

    return { access_token: newAccessToken };
  }
}
