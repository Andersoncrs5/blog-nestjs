import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { PostModule } from './post/post.module';
import { FavoritePostModule } from './favorite_post/favorite_post.module';
import { CategoryModule } from './category/category.module';
import { LikeModule } from './like/like.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/entities/user.entity';
import { Post } from './post/entities/post.entity';
import { Like } from './like/entities/like.entity';
import { FavoritePost } from './favorite_post/entities/favorite_post.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { Category } from './category/entities/category.entity';
import { AuthModule } from './auth/auth.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { UserMetricsModule } from './user_metrics/user_metrics.module';
import { PostMetricsModule } from './post_metrics/post_metrics.module';
import { CommentMetricsModule } from './comment_metrics/comment_metrics.module';
import { UnitOfWorkModule } from './utils/UnitOfWork/UnitOfWork.module';
import { FavoriteCommentModule } from './favorite_comment/favorite_comment.module';
import { LikeCommentModule } from './like_comment/like_comment.module';
import { RecoverPasswordModule } from './recover_password/recover_password.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { FollowersModule } from './followers/followers.module';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: String(process.env.REDIS_HOST),
      port: Number(process.env.REDIS_PORT),
      ttl: Number(process.env.REDIS_TTL),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory() {
        return {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASS || '',
          database: process.env.DB_NAME || 'blog',
          entities: [User, Post, Like, FavoritePost, Comment, Category],
          autoLoadEntities: true,
          synchronize: true,
        };
      },
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }

        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    UserModule,
    CommentModule,
    PostModule,
    FavoritePostModule,
    CategoryModule,
    LikeModule,
    AuthModule,
    UserMetricsModule,
    PostMetricsModule,
    CommentMetricsModule,
    UnitOfWorkModule,
    FavoriteCommentModule,
    LikeCommentModule,
    RecoverPasswordModule,
    FollowersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
