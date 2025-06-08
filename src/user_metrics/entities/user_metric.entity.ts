import { User } from "../../../src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";

@Entity()
export class UserMetric {

    @PrimaryGeneratedColumn()
    id:number

    @Column({ name : 'likes_given_count_in_comment', type: 'integer', unsigned: true, default: 0 })
    likesGivenCountInComment: number = 0 // +

    @Column({ name : 'deslikes_given_count_in_comment', type: 'integer', unsigned: true, default: 0 })
    deslikesGivenCountInComment: number = 0 // +

    @Column({ name : 'followers_count', type: 'integer', unsigned: true, default: 0 })
    followersCount: number = 0 // -

    @Column({ name : 'following_count', type: 'integer', unsigned: true, default: 0 })
    followingCount: number = 0 // -

    @Column({ name : 'posts_count', type: 'integer', unsigned: true, default: 0 })
    postsCount: number = 0  // +

    @Column({ name : 'comments_count', type: 'integer', unsigned: true, default: 0 })
    commentsCount: number = 0 // +

    @Column({ name : 'likes_given_count_in_post', type: 'integer', unsigned: true, default: 0 })
    likesGivenCountInPost: number = 0 // +

    @Column({ name : 'deslikes_given_count_in_post', type: 'integer', unsigned: true, default: 0 })
    deslikesGivenCountInPost: number = 0 // +

    @Column({ name : 'shares_count', type: 'integer', unsigned: true, default: 0 })
    sharesCount: number = 0 // -

    @Column({ name : 'reports_received_count', type: 'integer', unsigned: true, default: 0 })
    reportsReceivedCount: number = 0 // +

    @Column({ name : 'reputation_score', unsigned: true, default: 0.0 })
    reputationScore: number = 0.0  // -

    @Column({ name : 'media_uploads_count', unsigned: true, default: 0 })
    mediaUploadsCount: number = 0  // -

    @Column({ name : 'saved_posts_count', unsigned: true, default: 0 })
    savedPostsCount: number = 0 // +

    @Column({ name : 'saved_comments_count', unsigned: true, default: 0 })
    savedCommentsCount: number = 0; // -

    @Column({ name : 'saved_media_count', unsigned: true, default: 0 })
    savedMediaCount: number = 0 // -

    @Column({ name : 'edited_count', unsigned: true, default: 0 })
    editedCount: number = 0;

    @Column({ type: 'float', default: 0 })
    avgSessionTime: number = 0.0 // -
    
    @Column({ type: 'int', default: 0 })
    reportsMadeCount: number = 0 // -

    @Column({ type: 'int', default: 0 })
    profileViews: number = 0 // -

    @Column({ name : 'last_login', nullable: true})
    lastLogin?: Date = new Date()

    @Column({ name : 'last_activity', nullable: true})
    lastActivity?: Date = new Date()

    @VersionColumn()
    version: number;

    @OneToOne(() => User, user => user.metric )
    user: User;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
