import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('like')
export class Like {

  @PrimaryGeneratedColumn() 
  id: number;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  user: User; 

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  post: Post; 

  @CreateDateColumn()
  createdAt: Date;
}
