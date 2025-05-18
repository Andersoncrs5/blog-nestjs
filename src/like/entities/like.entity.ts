import { User } from '../../../src/user/entities/user.entity';
import { Post } from '../../../src/post/entities/post.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LikeOrDislike } from './likeOrDislike.enum';

@Entity('like')
export class Like {

  @PrimaryGeneratedColumn() 
  id: number;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  user: User; 

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  post: Post; 

  @Column({type: 'enum',enum: LikeOrDislike})
  action: LikeOrDislike;

  @CreateDateColumn()
  createdAt: Date;
}
