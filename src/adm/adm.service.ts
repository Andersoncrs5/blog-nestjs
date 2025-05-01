import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentService } from 'src/comment/comment.service';
import { Comment } from 'src/comment/entities/comment.entity';
import { Post } from 'src/post/entities/post.entity';
import { PostService } from 'src/post/post.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AdmService {
    constructor(
      private readonly userService : UserService,
      private readonly postService : PostService,
      private readonly commentService : CommentService,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Comment)
      private readonly commentRepository: Repository<Comment>,
      @InjectRepository(Post)
      private readonly postRepository: Repository<Post>,
    ){}

    public async getAllCommentBlockeds(page: number, limit: number) {
      const [result, count] = await this.commentRepository.findAndCount({ 
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
        where : { isBlocked: true }
      });
  
      return {
        data: result,
        totalItems: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      };
    }

    public async getAllPostBlockeds(page: number, limit: number) {
      const [result, count] = await this.postRepository.findAndCount({ 
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
        where : { isBlocked: true }
      });
        
      return {
        data: result,
        totalItems: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      };
    }

    public async getAllUserBlockeds(page: number, limit: number) {
      const [result, count] = await this.userRepository.findAndCount({ 
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
        where : { isBlocked: true }
      });

      return {
        data: result,
        totalItems: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      };
    }

    public async blockOrUnblockUser(userId: number) : Promise<{message: string;'status of user': boolean;}>{
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();
        
        const user : User = await this.userService.findOne(userId);
          
        user.isBlocked = !user.isBlocked;

        try {
          await queryRunner.manager.update(User, userId, user);
          await queryRunner.commitTransaction();
        
          return { 'message': 'Alter with success', 'status of user' : user.isBlocked };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw new InternalServerErrorException(error);
        } finally {
          await queryRunner.release();
        }
    }

    public async blockOrUnblockPost(postId: number) : Promise<{message: string;'status': boolean;}>{
        const queryRunner = this.postRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();
        
        const post : Post = await this.postService.findOne(postId);
          
        post.isBlocked = !post.isBlocked;

        try {
          await queryRunner.manager.update(Post, postId, post);
          await queryRunner.commitTransaction();
        
          return { 'message': 'Alter with success!!', 'status' : post.isBlocked };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw new InternalServerErrorException(error);
        } finally {
          await queryRunner.release();
        }
    }

    public async blockOrUnblockComment(commentId: number) : Promise<{message: string;'status': boolean;}>{
        const queryRunner = this.commentRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();
        
        const comment : Comment = await this.commentService.findOne(commentId);
          
        comment.isBlocked = !comment.isBlocked;

        try {
          
          await queryRunner.manager.update(Comment, commentId, comment);
          await queryRunner.commitTransaction();
        
          return { 'message': 'Alter with success!!', 'status' : comment.isBlocked };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw new InternalServerErrorException(error);
        } finally {
          await queryRunner.release();
        }
    }

    public async turnUserInAdm(userId: number): Promise<{message: string;'status of user': boolean;}> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();
    
        const user : User = await this.userService.findOne(userId);
          
        user.isAdm = !user.isAdm;
        
        try {
    
          await queryRunner.manager.update(User, userId, user);
          await queryRunner.commitTransaction();
        
          return { 'message': 'Alter with success', 'status of user' : user.isAdm };
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw new InternalServerErrorException(error);
        } finally {
          await queryRunner.release();
        }
    }

    

}