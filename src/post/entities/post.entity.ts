import { FavoritePost } from "src/favorite_post/entities/favorite_post.entity";
import { Like } from "src/like/entities/like.entity";
import { User } from "src/user/entities/user.entity";
import { Comment } from "src/comment/entities/comment.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id:number

    @Column({ type: "varchar", length: 250})
    title: string

    @Column({ type: "text" })
    content: string

    @Column({ default: true })
    isActived: boolean;

    @Column( {default: false })
    isBlocked: boolean = false;

    @ManyToOne(() => User, (user) => user.posts, { onDelete : 'CASCADE' } )
    user: User

    @OneToMany(() => Comment, (comment) => comment.post )
    comments: Comment[];

    @OneToMany(() => FavoritePost, (favoritePost) => favoritePost.post)
    favoritePosts: FavoritePost[];

    @OneToMany(() => Like, (like) => like.post)
    likes: Like[];

    @Column({ type: "varchar", length: 150})
    category: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}