import { Post } from "../../post/entities/post.entity";
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";

@Entity()
export class PostMetric {
    @PrimaryGeneratedColumn()
    id:number

    @VersionColumn()
    version: number;

    @Column({ name : 'likes', type: 'integer', unsigned: true, default: 0 })
    likes: number = 0 // +

    @Column({ name : 'dislikes', type: 'integer', unsigned: true, default: 0 })
    dislikes: number = 0 // +

    @Column({ name : 'shares', type: 'integer', unsigned: true, default: 0 })
    shares: number = 0 // -

    @Column({ name : 'comments_count', type: 'integer', unsigned: true, default: 0 })
    commentsCount: number = 0 // +

    @Column({ name : 'favorite_count', type: 'integer', unsigned: true, default: 0 })
    favoriteCount: number = 0 // +

    @Column({ name : 'bookmarks', type: 'integer', unsigned: true, default: 0 })
    bookmarks: number = 0 // -

    @Column({ name : 'viewed', type: 'integer', unsigned: true, default: 0 })
    viewed: number = 0 

    @Column({ name : 'last_interaction_at' })
    lastInteractionAt: Date // +

    @Column({name: "engagement_score"})
    engagementScore: number = 0.0; // -

    @Column({ name : 'reports_received_count', type: 'integer', unsigned: true, default: 0 })
    reportsReceivedCount: number = 0 // -

    @Column({ name : 'edited_count', unsigned: true, default: 0 })
    editedCount: number = 0; // +

    @Column({ default: 0.0 })
    averageViewTime: number = 0.0 // -

    @Column({ default: 0.0 })
    readThroughRate: number = 0.0; // -

    @Column({ type: 'boolean', default: false })
    isTrending: boolean; // -

    @OneToOne(() => Post, post => post.metric, { nullable: false, eager: true })
    post: Post;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
