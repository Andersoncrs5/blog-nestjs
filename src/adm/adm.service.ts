import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentService } from '../../src/comment/comment.service';
import { Comment } from '../../src/comment/entities/comment.entity';
import { Post } from '../../src/post/entities/post.entity';
import { PostService } from '../../src/post/post.service';
import { User } from '../../src/user/entities/user.entity';
import { UserService } from '../../src/user/user.service';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AdmService {
  constructor(
    @Inject(forwardRef(() => UserService)) 
    private readonly userService: UserService,
    @Inject(forwardRef(() => PostService)) 
    private readonly postService: PostService,
    @Inject(forwardRef(() => CommentService)) 
    private readonly commentService: CommentService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  public async getAllCommentBlockeds(page: number, limit: number) {
    const [result, count] = await this.commentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { isBlocked: true },
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
      where: { isBlocked: true },
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
      where: { isBlocked: true },
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  @Transactional()
  public async blockOrUnblockUser(userId: number): Promise<{ message: string; 'status of user': boolean }> {
    const user: User = await this.userService.findOne(userId);
    user.isBlocked = !user.isBlocked;
    await this.userRepository.update(userId, { isBlocked: user.isBlocked });

    return { message: 'Alter with success', 'status of user': user.isBlocked };
  }

  @Transactional()
  public async blockOrUnblockPost(postId: number): Promise<{ message: string; status: boolean }> {
    const post: Post = await this.postService.findOne(postId);
    post.isBlocked = !post.isBlocked;
    await this.postRepository.update(postId, { isBlocked: post.isBlocked });

    return { message: 'Alter with success!!', status: post.isBlocked };
  }

  @Transactional()
  public async blockOrUnblockComment(commentId: number): Promise<{ message: string; status: boolean }> {
    const comment: Comment = await this.commentService.findOne(commentId);
    comment.isBlocked = !comment.isBlocked;
    await this.commentRepository.update(commentId, { isBlocked: comment.isBlocked });

    return { message: 'Alter with success!!', status: comment.isBlocked };
  }

  @Transactional()
  public async turnUserInAdm(userId: number): Promise<{ message: string; 'status of user': boolean }> {
    const user: User = await this.userService.findOne(userId);
    user.isAdm = !user.isAdm;
    await this.userRepository.update(userId, { isAdm: user.isAdm });

    return { message: 'Alter with success', 'status of user': user.isAdm };
  }
}
