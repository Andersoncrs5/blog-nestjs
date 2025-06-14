import { Post } from "../../../src/post/entities/post.entity";
import { User } from "../../../src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id:number

    @Column({ type: "varchar", unique: true, length: 150})
    name: string

    @Column({ type: "varchar", length: 150})
    nameUser: string

    @Column({ default: false })
    isActived: boolean;

    @VersionColumn()
    version: number;

    @OneToMany(() => Post, (post) => post.category)
    posts: Post[];

    @ManyToOne(() => User, (user) => user.categories, { onDelete : 'CASCADE', eager: true, nullable: false })
    user: User

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}

