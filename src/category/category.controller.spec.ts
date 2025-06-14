import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '../../src/user/entities/user.entity';
import { Post } from '../../src/post/entities/post.entity';
import { Category } from './entities/category.entity';
import { Comment } from '../../src/comment/entities/comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { Like } from '../../src/like/entities/like.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserModule } from '../../src/user/user.module';

let app;

describe('CategoryController', () => {
  let controller: CategoryController;
  let repository: Repository<Category>;

  beforeEach(async () => {
    initializeTransactionalContext();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          useFactory: async () => ({
            store: redisStore as any,
            host: process.env.REDIS_HOST || 'localhost',
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
            };
          },
          async dataSourceFactory(options) {
            if (!options) throw new Error('Invalid options passed');
            return addTransactionalDataSource(new DataSource(options));
          },
        }),
        TypeOrmModule.forFeature([
          User, Post, Category, Comment, FavoritePost,
          FavoriteComment, Like, UserMetric, RecoverPassword,
          LikeComment, PostMetric, CommentMetric, Follower
        ]),
        UnitOfWorkModule,
        UserModule,
      ],
      controllers: [CategoryController],
      providers: [CategoryService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    controller = moduleRef.get<CategoryController>(CategoryController);
    repository = moduleRef.get(getRepositoryToken(Category));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
