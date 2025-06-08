import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CryptoService } from '../../CryptoService';
import { LoginUserDTO } from './dto/login-user.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User> {
    if (!email || email == "") { throw new BadRequestException('Email is required'); }

    const user: User | null = await this.repository.findOne({ where: { email } });

    if (user == null) {
      throw new NotFoundException('User not found');
    }

    return user
  }

  @Transactional()
  async create(createUserDto: CreateUserDto) {
    const check: boolean = await this.repository.exists({ where: { email: createUserDto.email } })

    if (check) {  throw new ConflictException('Email in used'); }

    const user: User = await this.repository.create(createUserDto);
    const userSave: User = await this.repository.save(user);

    return userSave;
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
  async update(user: User, updateUserDto: UpdateUserDto) {
    // if (updateUserDto.password) {
    //   updateUserDto.password = await CryptoService.encrypt(updateUserDto.password);
    // }

    const data = { ...updateUserDto, version: user.version }

    return await this.repository.update(user.id, data);
  }

  @Transactional()
  async remove(user: User) {
    await this.repository.delete(user.id); 
  }
  
  @Transactional()
  async LoginAsync(userDto: LoginUserDTO) {
    const email = userDto.email.trim();
    const foundUser = await this.repository.findOne({ where: { email } });
  
    if (!foundUser || !(await CryptoService.compare(userDto.password, foundUser.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    if (foundUser.isBlocked) {
      throw new UnauthorizedException('You are blocked!!!');
    }

    return foundUser;
  }

  @Transactional()
  async logout(user: User) {
    user.refreshToken = null;
    await this.repository.save(user);
  }  

}