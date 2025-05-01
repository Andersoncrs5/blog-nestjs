import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    @ManyToOne(() => User, (user) => user.categories, { onDelete : 'CASCADE' } )
    user: User

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
