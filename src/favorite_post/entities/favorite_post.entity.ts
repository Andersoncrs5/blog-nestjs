import { User } from '../../../src/user/entities/user.entity';
import { Post } from '../../../src/post/entities/post.entity';
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('favorite_post') 
export class FavoritePost {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.favoritePosts, { onDelete: 'CASCADE', eager: true })
  user: User; 

  @ManyToOne(() => Post, (post) => post.favoritePosts, { onDelete: 'CASCADE', eager: true })
  post: Post;

  @CreateDateColumn() 
  createdAt: Date;
}
