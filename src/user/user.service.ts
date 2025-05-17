import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CryptoService } from 'CryptoService';
import { LoginUserDTO } from './dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  @Transactional()
  async create(createUserDto: CreateUserDto) {
    const user: User = this.repository.create(createUserDto);
    const userSave: User = await this.repository.save(user);

    return this.authService.token(userSave);
  }
  
  async findOne(id: number): Promise<User> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const user: User | null = await this.repository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  @Transactional()
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user: User = await this.findOne(id); 

    if (updateUserDto.password) {
      updateUserDto.password = await CryptoService.encrypt(updateUserDto.password);
    }

    await this.repository.update(id, updateUserDto);

    return await this.findOne(id); 
  }

  @Transactional()
  async remove(id: number): Promise<string> {
      await this.findOne(id); 
      await this.repository.delete(id); 
  
      return 'User deleted with id';
  }
  
  async LoginAsync(userDto: LoginUserDTO) {
    const email = userDto.email.trim();
    const foundUser = await this.repository.findOne({ where: { email } });
  
    if (!foundUser || !(await CryptoService.compare(userDto.password, foundUser.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    if (foundUser.isBlocked) {
      throw new UnauthorizedException('You are blocked!!!');
    }
  
    return this.authService.token(foundUser);
  }
  
  async refreshToken(refreshToken: string) {
    return this.authService.refreshToken(refreshToken)
  }

  async logout(userId: number) {
    return this.authService.logout(userId);
  }  

}