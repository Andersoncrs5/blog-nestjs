import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { Comment } from '../../src/comment/entities/comment.entity'
import { User } from '../../src/user/entities/user.entity';
import { UserMetric } from '../../src/user_metrics/entities/user_metric.entity';
import { RecoverPassword } from '../../src/recover_password/entities/recover_password.entity';
import { Category } from '../../src/category/entities/category.entity';
import { Post } from '../../src/post/entities/post.entity';
import { PostMetric } from '../../src/post_metrics/entities/post_metric.entity';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import * as redisStore from 'cache-manager-redis-store';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteComment } from '../../src/favorite_comment/entities/favorite_comment.entity';
import { LikeComment } from '../../src/like_comment/entities/like_comment.entity';
import { Like } from '../../src/like/entities/like.entity';
import { CommentMetric } from '../../src/comment_metrics/entities/comment_metric.entity';
import { Follower } from '../../src/followers/entities/follower.entity';
import { UnitOfWorkModule } from '../../src/utils/UnitOfWork/UnitOfWork.module';
import { UserMetricsModule } from '../../src/user_metrics/user_metrics.module';
import { FavoritePost } from '../../src/favorite_post/entities/favorite_post.entity';
import { CommentMetricsService } from './comment_metrics.service';
import { CommentMetricsController } from './comment_metrics.controller';

let app;

describe('CommentMetricsService', () => {
  let service: CommentMetricsService;
  let repository: Repository<CommentMetric>;

  beforeAll(async () => {
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
                User, Post, Category, Comment, FavoritePost, FavoriteComment,
                Like, UserMetric, RecoverPassword, LikeComment, PostMetric,
                CommentMetric, Follower
              ],
              autoLoadEntities: true,
              synchronize: true,
            };
          },
          async dataSourceFactory(options) {
            if (!options) throw new Error('Invalid options passed');
            return addTransactionalDataSource(new DataSource(options));
          }
        }),
        TypeOrmModule.forFeature([
          User, Post, Category, Comment, FavoritePost, FavoriteComment,
          Like, UserMetric, RecoverPassword, LikeComment, PostMetric,
          CommentMetric, Follower
        ]),
        UnitOfWorkModule,
        UserMetricsModule
      ],
      
      controllers: [CommentMetricsController],
      providers: [CommentMetricsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    service = moduleRef.get<CommentMetricsService>(CommentMetricsService);
    repository = moduleRef.get<Repository<CommentMetric>>(getRepositoryToken(CommentMetric));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentMetricsService,
        {
          provide: getRepositoryToken(CommentMetric),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommentMetricsService>(CommentMetricsService);
    repository = module.get<Repository<CommentMetric>>(getRepositoryToken(CommentMetric));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});