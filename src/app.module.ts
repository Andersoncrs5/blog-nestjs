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
import { AdmModule } from './adm/adm.module';
import { NotificationsModule } from './notifications/notifications.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
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
    AdmModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
