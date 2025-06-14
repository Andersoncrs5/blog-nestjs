import { User } from "../../../src/user/entities/user.entity";
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('followers')
export class Follower {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.follows, { onDelete: 'CASCADE', eager: true, nullable: false })
  follower: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE', eager: true, nullable: false })
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}
