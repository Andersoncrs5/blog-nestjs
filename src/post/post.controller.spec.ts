import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { Comment } from '../../src/comment/entities/comment.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../src/category/entities/category.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { User } from '../../src/user/entities/user.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { Like } from '../../src/like/entities/like.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserModule } from '../../src/user/user.module';

let app

describe('PostController', () => {
  let controller: PostController;
  let repository: Repository<Post>

  beforeEach(async () => {
    initializeTransactionalContext()


    const moduleRuf: TestingModule = await Test.createTestingModule({
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
              port:  5432,
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

      controllers: [PostController],
      providers: [PostService],
    }).compile();

    app = moduleRuf.createNestApplication();
    await app.init();

    controller = moduleRuf.get<PostController>(PostController);
    repository = moduleRuf.get(getRepositoryToken(Post))
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
