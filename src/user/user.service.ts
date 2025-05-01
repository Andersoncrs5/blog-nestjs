import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CryptoService } from 'CryptoService';
import { LoginUserDTO } from './dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
      const user: User = queryRunner.manager.create(User, createUserDto);
      const userSave: User = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      return this.authService.token(userSave);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      if (!id || isNaN(id) || id <= 0) {
        throw new BadRequestException('ID must be a positive number');
      }

      const user: User | null = await this.repository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
      const user: User = await this.findOne(id);

      if (updateUserDto.password) {
        updateUserDto.password = await CryptoService.encrypt(updateUserDto.password);
      }

      await queryRunner.manager.update(User, id, updateUserDto);
      await queryRunner.commitTransaction();

      return await queryRunner.manager.findOne(User, { where: { id } });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<string> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
      await this.findOne(id);
      await queryRunner.manager.delete(User, id);
      await queryRunner.commitTransaction();

      return 'User deleted with id';
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async LoginAsync(userDto: LoginUserDTO) {
    try {
      const email = userDto.email.trim();
      const foundUser = await this.repository.findOne({ where: { email } });
  
      if (!foundUser) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      if (foundUser.isBlocked == true) {
        throw new UnauthorizedException('You are blocked!!!');
      }

      const isPasswordCorrect = await CryptoService.compare(userDto.password, foundUser.password);
  
      if (!isPasswordCorrect) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.authService.token(foundUser);

      return accessToken;
    } catch (error) {
      throw error;
    }
  } 

  async refreshToken(refreshToken: string) {
    try {
      return this.authService.refreshToken(refreshToken)
    } catch (error) {
      throw error;
    }
  }

  async logout(userId: number) {
    try {
      return this.authService.logout(userId);
    } catch (error) {
      throw new InternalServerErrorException('Error logging out');
    }
  }  

}