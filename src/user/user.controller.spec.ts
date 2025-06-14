import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
// Importe suas entidades usando os caminhos corretos:
import { Post } from '../../src/post/entities/post.entity';
import { Category } from '../../src/category/entities/category.entity';
import { Comment } from '../../src/comment/entities/comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity' // Corrigido
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity'; // Corrigido
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity'; // Corrigido
import { Like } from '../../src/like/entities/like.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity'; // Corrigido
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity' // Corrigido
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity'; // Corrigido
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity'; // Corrigido
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { randomUUID } from 'crypto';
import { LoginUserDTO } from './dto/login-user.dto';
import { Follower } from '../../src/followers/entities/follower.entity';
import { TransactionalTestContext } from 'typeorm-transactional-tests';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { RefreshTokenDTO } from 'src/auth/dtos/refresh-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let app: INestApplication;
  let repository: Repository<User>;
  let transactionalContext: TransactionalTestContext;
  let dataSource: DataSource;
  let cacheManager: Cache;

  beforeAll(async () => {
    initializeTransactionalContext(); 

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          useFactory: async () => ({
            store: redisStore as any,
            host: '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            ttl: parseInt(process.env.REDIS_TTL || '120'),
          }),
        }),
        TypeOrmModule.forRootAsync({
          useFactory() {
            return {
              type: 'postgres',
              host: 'localhost',
              port: 5432,
              username: 'postgres',
              password: '',
              database: 'test',
              dropSchema: true,
              entities: [
                User, Post, Category, Comment, FavoritePost,
                FavoriteComment, Like, UserMetric, RecoverPassword,
                LikeComment, PostMetric, CommentMetric, Follower
              ],
              autoLoadEntities: true,
              synchronize: true,
              logging: false,
            }
          },
          async dataSourceFactory(options) {
            if (!options) { throw new Error('Invalid options passed') }
            return addTransactionalDataSource(new DataSource(options))
          }
        }),
        TypeOrmModule.forFeature([
          User, Post, Category, Comment, FavoritePost,
          FavoriteComment, Like, UserMetric, RecoverPassword,
          LikeComment, PostMetric, CommentMetric, Follower
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
    dataSource = app.get(DataSource);
    cacheManager = app.get(CACHE_MANAGER);
  });

  beforeEach(async () => {
    transactionalContext = new TransactionalTestContext(dataSource);
    await transactionalContext.start();
  });

  afterEach(async () => {
    await transactionalContext.finish();
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
  }, 20000);

  it('/POST should login a user', async ()=> {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
      password: '12345678'.trim().toLowerCase()
    }

    await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

    const dtoLogin: LoginUserDTO = {
      email: dto.email,
      password: '12345678'
    }

    const response1 = await request(app.getHttpServer())
      .post('/user/login')
      .send(dtoLogin)
      .expect(200);

    expect(response1.body.message).toBe("Welcome again!!!");
    expect(response1.body.data.access_token).not.toBeNull();
    expect(response1.body.data.access_token).toEqual(expect.any(String));
    expect(response1.body.data.refresh_token).not.toBeNull();
    expect(response1.body.data.refresh_token).toEqual(expect.any(String));
  }, 20000);

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
  }, 20000);

  it('/GET should get the metric of user', async () => {
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
      .get('/user/metric')
      .auth(token, { type: "bearer" })
      .expect(200);

    expect(responseGetUser.body.message).toBe("Metric founded!!");
    expect(responseGetUser.body.data.id).not.toBeNull();
  }, 20000);

  it('should delete user', async () => {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
      password: '12345678'.trim().toLowerCase()
    }

    const response = await request(app.getHttpServer()).post('/user/register').send(dto).expect(201);
    const token: string = response.body.data.access_token;

    const responseDelete = await request(app.getHttpServer())
      .delete('/user/remove')
      .auth(token, { type: "bearer" })
      .expect(200);
    
    expect(responseDelete.body.message).toBe("User deleted");
  }, 20000);

  it('should logout user', async () => {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
      password: '12345678'.trim().toLowerCase()
    }

    const response = await request(app.getHttpServer()).post('/user/register').send(dto).expect(201);
    const token: string = response.body.data.access_token;

    const responseDelete = await request(app.getHttpServer())
      .post('/user/logout')
      .auth(token, { type: "bearer" })
      .expect(200);
    
    expect(responseDelete.body.message).toBe("Bye Bye!!!");
  }, 20000);

  it('should refresh user', async () => {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
      password: '12345678'
    }

    const response = await request(app.getHttpServer()).post('/user/register').send(dto).expect(201);
    const refreshToken: string = response.body.data.refresh_token; // Obtenha o refresh token

    const refreshDto: RefreshTokenDTO = {
      refresh_token: refreshToken
    }

    const responseRefresh = await request(app.getHttpServer())
      .post('/user/refresh')
      .send(refreshDto)
      .expect(200);
    
    expect(responseRefresh.body.access_token).not.toBeNull();
    expect(responseRefresh.body.access_token).toEqual(expect.any(String));
    expect(responseRefresh.body.refresh_token).not.toBeNull();
    expect(responseRefresh.body.refresh_token).toEqual(expect.any(String));
  }, 20000);

  it('/GET should get the user v2', async () => {
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
      .get('/user/v2/me')
      .auth(token, { type: "bearer" })
      .expect(200);

    expect(responseGetUser.body.message).toBe("User founded!!");
    expect(responseGetUser.body.data).toHaveProperty('id');
    expect(responseGetUser.body.data).toHaveProperty('email');
    expect(responseGetUser.body.data).toHaveProperty('name');
    expect(responseGetUser.body.data.name).toBe(dto.name);
    expect(responseGetUser.body.data.email).toBe(dto.email);
    expect(responseGetUser.body.data.id).not.toBeNull();
  }, 20000);


  
// it('/GET should seeProfileOfUser', async () => {
  //   const dto: CreateUserDto = {
  //     name: 'user',
  //     email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
  //     password: '12345678'.trim().toLowerCase()
  //   }

  //   const dto1: CreateUserDto = {
  //     name: 'user',
  //     email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
  //     password: '12345678'.trim().toLowerCase()
  //   }

  //   const response = await request(app.getHttpServer()).post('/user/register').send(dto).expect(201);

  //   await request(app.getHttpServer()).post('/user/register').send(dto1).expect(201);

  //   const token: string = response.body.data.access_token;

  //   const reponseGetProfile = await request(app.getHttpServer())
  //     .get('/user/see-profile-of-user/'+dto1.email)
  //     .auth(token, { type: "bearer" })
  //     .expect(200);

  //   expect(reponseGetProfile.body.message).toBe("User founded!!");
  //   expect(reponseGetProfile.body.data).toHaveProperty('id');
  //   expect(reponseGetProfile.body.data).toHaveProperty('email');
  //   expect(reponseGetProfile.body.data).toHaveProperty('name');
  //   expect(reponseGetProfile.body.data.name).toBe(dto1.name);
  //   expect(reponseGetProfile.body.data.email).toBe(dto1.email);
  //   expect(reponseGetProfile.body.data.id).not.toBeNull();
  // }, 20000);

  it('should update the user', async () => {
    const dto: CreateUserDto = {
      name: 'user',
      email: `user${randomUUID()}@gmail.com`.trim().toLowerCase(),
      password: '12345678' 
    };

    const dtoToUpdate: UpdateUserDto = {
      name: 'user updated name',
      password: 'newpassword123' 
    };

    const response = await request(app.getHttpServer())
      .post('/user/register')
      .send(dto)
      .expect(201);

    const token: string = response.body.data.access_token;

    const result = await request(app.getHttpServer())
      .put('/user/update')
      .send(dtoToUpdate)
      .auth(token, { type: "bearer" })
      .expect(200);
    
    expect(result.body.message).toBe("User updated with success!!");
    console.log(result.body)
    
    expect(result.body.data).toHaveProperty('id');
    expect(result.body.data).toHaveProperty('email');
    expect(result.body.data).toHaveProperty('name');
    expect(result.body.data.name).toBe(dtoToUpdate.name); 
    expect(result.body.data.email).toBe(dto.email);
    expect(result.body.data.id).not.toBeNull();
  }, 30000);

})