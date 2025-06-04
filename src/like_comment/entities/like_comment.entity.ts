import { Comment } from "src/comment/entities/comment.entity";
import { LikeOrDislike } from "src/like/entities/likeOrDislike.enum";
import { User } from "src/user/entities/user.entity";
import { PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Entity } from "typeorm";

@Entity('likes_commnet')
export class LikeComment {
    @PrimaryGeneratedColumn() 
    id: number;

    @ManyToOne(() => User, (user) => user.likesComments, { onDelete: 'CASCADE', eager: true })
    user: User; 

    @ManyToOne(() => Comment, (comment) => comment.likesComments, { onDelete: 'CASCADE', eager: true })
    comment: Comment; 

    @Column({type: 'enum',enum: LikeOrDislike})
    action: LikeOrDislike;

    @CreateDateColumn()
    createdAt: Date;
}
