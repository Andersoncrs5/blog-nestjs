import { Test, TestingModule } from '@nestjs/testing';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../src/category/entities/category.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { User } from '../../src/user/entities/user.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { Like } from './entities/like.entity';
import { Post } from '../../src/post/entities/post.entity';
import { Comment } from '../../src/comment/entities/comment.entity';
import { DataSource, Repository } from 'typeorm';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserModule } from '../../src/user/user.module';

let app;

describe('LikeController', () => {
  let controller: LikeController;
  let repository: Repository<Like>;

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
                PostMetric, CommentMetric, Follower
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
          PostMetric, CommentMetric, Follower
        ]),
        UnitOfWorkModule,
        UserModule
      ],

      controllers: [LikeController],
      providers: [LikeService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = moduleRef.get(getRepositoryToken(Like));
    controller = moduleRef.get<LikeController>(LikeController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
