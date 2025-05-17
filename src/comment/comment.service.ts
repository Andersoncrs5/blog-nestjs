import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';
import { UserService } from 'src/user/user.service';
import { PostService } from 'src/post/post.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    private readonly userService : UserService,
    private readonly postService : PostService,
  ){}

  @Transactional()
  async create(postId: number, userId: number, createCommentDto: CreateCommentDto) {
    const user: User = await this.userService.findOne(userId);
    const post: Post = await this.postService.findOne(postId);

    const commentCreated = { ...createCommentDto, post, user, nameUser: user.name };
    const comment = this.repository.create(commentCreated);
    return this.repository.save(comment);
  }

  async findAllOfPost(id: number, page: number, limit: number) {
    const post: Post = await this.postService.findOne(id);

    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { post: { id }, isActived: true, parentId : 0 }
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findAllOfUser(id: number, page: number, limit: number) {
    const user: User = await this.userService.findOne(id);

    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user: { id } }
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Comment> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const comment = await this.repository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment not found with ID: ${id}`);
    }

    return comment;
  }

  @Transactional()
  async update(id: number, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment: Comment = await this.findOne(id);

    const updatedComment = { ...comment, ...updateCommentDto };
    updatedComment.isEdited = true;

    await this.repository.save(updatedComment);
    return updatedComment;
  }

  @Transactional()
  async remove(id: number) {
    const comment: Comment = await this.findOne(id);

    const commentReplies: Comment[] = await this.repository.find({ where: { parentId: id } });

    for (const reply of commentReplies) {
      await this.repository.delete(reply.id);
    }

    await this.repository.delete(id);
    return `Comment deleted with ID: ${id}`;
  }

  @Transactional()
  async createOnComment(idComment: number, idUser: number, createCommentDto: CreateCommentDto) {
    const comment: Comment = await this.findOne(idComment);
    const user: User = await this.userService.findOne(idUser);

    const commentCreated = this.repository.create({
      ...createCommentDto,
      user,
      parentId: comment.id,
      post: comment.post,
      nameUser: user.name,
    });

    return this.repository.save(commentCreated);
  }

  async findAllOfComment(id: number, page: number, limit: number) {
    const comment: Comment = await this.findOne(id);

    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { parentId : id }
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }
}