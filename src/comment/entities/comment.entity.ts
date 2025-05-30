import { CommentMetric } from '../../../src/comment_metrics/entities/comment_metric.entity';
import { Post } from '../../../src/post/entities/post.entity';
import { User } from '../../../src/user/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length:150 })
  nameUser: string

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: true })
  isActived: boolean;

  @Column( {default: false })
  isBlocked: boolean = false;

  @Column({ default: 0, nullable: true })
  parentId: number;

  @VersionColumn()
  version: number;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  user : User; 

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post: Post; 

  @OneToOne(() => CommentMetric, metric => metric.comment, { cascade: true, eager: true })
  @JoinColumn()
  metric: CommentMetric

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}