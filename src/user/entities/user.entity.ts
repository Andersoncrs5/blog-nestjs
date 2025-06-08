import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import * as bcrypt from "bcrypt";
import { Post } from "../../../src/post/entities/post.entity";
import { Category } from "../../../src/category/entities/category.entity";
import { FavoritePost } from "../../../src/favorite_post/entities/favorite_post.entity";
import { Like } from "../../../src/like/entities/like.entity";
import { Comment } from "../../../src/comment/entities/comment.entity";
import { UserMetric } from "../../../src/user_metrics/entities/user_metric.entity";
import { FavoriteComment } from "../../../src/favorite_comment/entities/favorite_comment.entity";
import { LikeComment } from "../../../src/like_comment/entities/like_comment.entity";
import { RecoverPassword } from "../../../src/recover_password/entities/recover_password.entity";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id:number

    @Column({ type: "varchar", length: 150})
    name: string

    @Column({ type: "varchar", unique: true, length: 250 })
    email: string

    @Column({ type: "varchar" , length: 350 })
    password: string

    @Column({ type: "varchar", nullable: true })
    refreshToken: string | null

    @Column( {default: false })
    isAdm: boolean;

    @Column( {default: false })
    isBlocked: boolean = false;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn()
    version: number;

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[]

    @OneToMany(() => Category, (category) => category.user)
    categories: Category[]
    
    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[]; 

    @OneToMany(() => FavoritePost, (favoritePost) => favoritePost.user)
    favoritePosts: FavoritePost[];

    @OneToMany(() => FavoriteComment, (favorite_comment) => favorite_comment.user)
    favoriteComments: FavoriteComment[];

    @OneToMany(() => Like, (like) => like.user)
    likes: Like[];

    @OneToOne(() => UserMetric, metric => metric.user, { cascade: true, eager: true } )
    @JoinColumn()
    metric: UserMetric;

    @OneToOne(() => RecoverPassword, result => result.user, { cascade: true } )
    @JoinColumn()
    recover: RecoverPassword;

    @OneToMany(() => LikeComment, (like) => like.user)
    likesComments: LikeComment[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 14);
        }
    }
}
