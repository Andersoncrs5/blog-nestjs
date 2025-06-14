import { FavoritePost } from "../../../src/favorite_post/entities/favorite_post.entity";
import { Like } from "../../../src/like/entities/like.entity";
import { User } from "../../../src/user/entities/user.entity";
import { Comment } from "../../../src/comment/entities/comment.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { PostMetric } from "../../../src/post_metrics/entities/post_metric.entity";
import { Category } from "../../../src/category/entities/category.entity";

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

    @VersionColumn()
    version: number;

    @ManyToOne(() => Category, (category) => category.posts, { onDelete : 'CASCADE', eager: true, nullable: false })
    category: Category

    @ManyToOne(() => User, (user) => user.posts, { onDelete : 'CASCADE', eager: true, nullable: false })
    user: User

    @OneToMany(() => Comment, (comment) => comment.post )
    comments: Comment[];

    @OneToOne(() => PostMetric, metric => metric.post, { cascade: true, nullable: false })
    @JoinColumn()
    metric: PostMetric

    @OneToMany(() => FavoritePost, (favoritePost) => favoritePost.post)
    favoritePosts: FavoritePost[];

    @OneToMany(() => Like, (like) => like.post)
    likes: Like[];

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}