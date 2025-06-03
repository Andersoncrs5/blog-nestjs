import { Comment } from "src/comment/entities/comment.entity";
import { User } from "src/user/entities/user.entity";
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('favorite_comment')
export class FavoriteComment {
    @PrimaryGeneratedColumn() 
    id: number;

    @ManyToOne(() => User, (user) => user.favoriteComments, { onDelete: 'CASCADE', eager: true })
    user: User; 

    @ManyToOne(() => Comment, (Comment) => Comment.favoriteComments, { onDelete: 'CASCADE', eager: true })
    comment: Comment;

    @CreateDateColumn() 
    createdAt: Date;
}
