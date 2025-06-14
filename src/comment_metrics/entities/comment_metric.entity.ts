import { Comment } from "../../../src/comment/entities/comment.entity";
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";

@Entity()
export class CommentMetric {

    @PrimaryGeneratedColumn()
    id:number;

    @Column({nullable: false})
    likes: number = 0; // -

    @Column({nullable: false})
    dislikes: number = 0; // -

    @Column({name : "report_count", nullable: false})
    reportCount: number = 0; // -

    @Column({name : "edited_times", nullable: false})
    editedTimes: number = 0; // +

    @Column({name: "engagement_score", nullable: false})
    engagementScore: number = 0.0; // -

    @Column({name: "last_interaction_at"})
    lastInteractionAt: Date // +

    @Column({ nullable: false })
    favoritesCount: number = 0; // -

    @Column({name: "replies_count", nullable: false})
    repliesCount: number = 0; // -

    @Column({name: "views_count", nullable: false})
    viewsCount: number = 0; // +

    @VersionColumn()
    version: number;

    @OneToOne(() => Comment, comment => comment.metric, { onDelete: 'CASCADE', eager: true, nullable: false })
    comment: Comment;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
