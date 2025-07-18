import { User } from "../../../src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RecoverPassword {
    @PrimaryGeneratedColumn()
    id:number

    @Column({ name: 'token', type:'varchar', nullable: false })
    token:string;

    @Column({ name:'expire_at', nullable: true })
    expireAt: Date

    @Column({ default: false })
    used: boolean;

    @OneToOne(() => User, user => user.recover, { nullable: false, eager: true })
    user: User;

    @CreateDateColumn()
    createdAt: Date
}
