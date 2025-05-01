import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('favorite_post') 
export class FavoritePost {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.favoritePosts, { onDelete: 'CASCADE' })
  user: User; 

  @ManyToOne(() => Post, (post) => post.favoritePosts, { onDelete: 'CASCADE' })
  post: Post;

  @CreateDateColumn() 
  createdAt: Date;
}
