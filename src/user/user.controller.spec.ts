import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { Post } from '../../src/post/entities/post.entity';
import { Category } from '../../src/category/entities/category.entity';
import { Comment } from '../../src/comment/entities/comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { Like } from '../../src/like/entities/like.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { randomUUID } from 'crypto';
import { LoginUserDTO } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let app: INestApplication;
  let repository: Repository<User>

  beforeAll(async () => {
    initializeTransactionalContext()
    
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory() { 
            return {
              type: 'postgres',
              host: 'localhost',
              port:  5432,
              username: 'postgres',
              password: '',
              database: 'test',
              dropSchema: true,
              entities: [
                User, 
                Post, 
                Category, 
                Comment, 
                FavoritePost, 
                FavoriteComment, 
                Like, 
                UserMetric, 
                RecoverPassword, 
                LikeComment,
                PostMetric,
                CommentMetric
              ],
              autoLoadEntities: true,
              synchronize: true,
            }
          },
          async dataSourceFactory(options) {
            if (!options) { throw new Error('Invalid options passed') }

            return addTransactionalDataSource(new DataSource(options))
          }
        }),
        TypeOrmModule.forFeature([
          CommentMetric, 
          PostMetric, 
          User, 
          Post, 
          Category, 
          Comment, 
          FavoritePost, 
          FavoriteComment, 
          Like, 
          UserMetric, 
          RecoverPassword, 
          LikeComment
        ]),
        UnitOfWorkModule,
        UserModule
      ],
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = moduleRef.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });
  
  it('/POST should create a user', async () => {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`,
      password: '12345678'
    }

    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

    expect(response.body.message).toBe("Welcome!!");
    expect(response.body.data.access_token).not.toBeNull();
    expect(response.body.data.access_token).toEqual(expect.any(String))
    expect(response.body.data.refresh_token).not.toBeNull();
    expect(response.body.data.refresh_token).toEqual(expect.any(String))
  });

  it('/POST shouldlogin a user', async ()=> {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`,
      password: '12345678'
    }

    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

      const dtoLogin: LoginUserDTO = {
        email: dto.email,
        password: dto.password
      }

      const response1 = await request(app.getHttpServer())
        .post('/user/login')
        .send(dtoLogin)
        .expect(200);

      expect(response1.body.message).toBe("Welcome again!!!")
      expect(response1.body.data.access_token).not.toBeNull();
      expect(response1.body.data.access_token).toEqual(expect.any(String))
      expect(response1.body.data.refresh_token).not.toBeNull();
      expect(response1.body.data.refresh_token).toEqual(expect.any(String))
  });

  it('/GET should get the user', async () => {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`,
      password: '12345678'
    };

    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

    expect(response.body.data.access_token).not.toBeNull();

    const token: string = response.body.data.access_token;

    const responseGetUser = await request(app.getHttpServer())
      .get('/user/me')
      .auth(token, { type: "bearer" })
      .expect(200);

    expect(responseGetUser.body.message).toBe("User founded!!");
    expect(responseGetUser.body.data).toHaveProperty('id');
    expect(responseGetUser.body.data).toHaveProperty('email');
    expect(responseGetUser.body.data).toHaveProperty('name');
    expect(responseGetUser.body.data.name).toBe(dto.name);
    expect(responseGetUser.body.data.email).toBe(dto.email);
    expect(responseGetUser.body.data.id).not.toBeNull();
  });

  // it('/GET hould get the profile of another user', async ()=> {
  //   const dto: CreateUserDto = {
  //     name: 'user',
  //     email: `user${randomUUID()}@gmail.com`,
  //     password: '12345678'
  //   };

  //   const response = await request(app.getHttpServer())
  //     .post('/user/register')
  //     .send(dto)
  //     .expect(201);

  //   const dto1: CreateUserDto = {
  //     name: 'user',
  //     email: `user${randomUUID()}@gmail.com`,
  //     password: '12345678'
  //   };

  //   await request(app.getHttpServer())
  //     .post('/user/register')
  //     .send(dto1)
  //     .expect(201);

  //   const token: string = response.body.data.access_token;
    
  //   const responseseeProfileOfUser = await request(app.getHttpServer())
  //     .get(`/user/see-profile-of-user/${dto1.email.trim().toLowerCase()}`)
  //     .auth(token, { type: "bearer" })
  //     .expect(200);
    
  //   expect(responseseeProfileOfUser.body.message).toBe("User founded!!");
  //   expect(responseseeProfileOfUser.body.data).toHaveProperty('id');
  //   expect(responseseeProfileOfUser.body.data).toHaveProperty('email');
  //   expect(responseseeProfileOfUser.body.data).toHaveProperty('name');
  //   expect(responseseeProfileOfUser.body.data.name).toBe(dto1.name);
  //   expect(responseseeProfileOfUser.body.data.email).toBe(dto1.email);
  //   expect(responseseeProfileOfUser.body.data.id).not.toBeNull();
  // });

  it('/DELETE should delete the user', async ()=> {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`,
      password: '12345678'
    }

    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

    expect(response.body.data.access_token).not.toBeNull();

    const token: string = response.body.data.access_token;

    const responseDeleteUser = await request(app.getHttpServer())
      .delete('/user/remove')
      .auth(token, { type: "bearer" })
      .expect(200);

    expect(responseDeleteUser.body.message).toBe("User deleted");
  });

  it('/PUT should update the user', async ()=> {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`,
      password: '12345678'
    };

    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

    expect(response.body.data.access_token).not.toBeNull();

    const token: string = response.body.data.access_token;

    const update: UpdateUserDto = {
      name: 'user update',
      email: dto.email,
      password: '12345678'
    }

    const responseUpdate = await request(app.getHttpServer())
      .put('/user/update')
      .send(update)
      .auth(token, { type: "bearer" })
      .expect(200);

    expect(responseUpdate.body.message).toBe("User updated with success");
    expect(responseUpdate.body.data).toHaveProperty('id');
    expect(responseUpdate.body.data).toHaveProperty('email');
    expect(responseUpdate.body.data).toHaveProperty('name');
    expect(responseUpdate.body.data.name).toBe(update.name);
    expect(responseUpdate.body.data.email).toBe(dto.email);
    expect(responseUpdate.body.data.id).not.toBeNull();
  }, 20000);

});
