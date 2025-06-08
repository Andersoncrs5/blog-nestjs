import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/user/entities/user.entity';
import { Post } from '../../src/post/entities/post.entity';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>
  ){}

  @Transactional()
  async create(post: Post, user: User, createCommentDto: CreateCommentDto) {
    const commentCreated = { ...createCommentDto, post, user, nameUser: user.name };
    const comment = this.repository.create(commentCreated);

    const commentSave = await this.repository.save(comment);

    return commentSave;
  }

  async findAllOfPost(post: Post, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { post, isActived: true, parentId : 0 }
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findAllOfUser(user: User, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { user }
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

    const comment: Comment | null = await this.repository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment not found with ID: ${id}`);
    }

    return comment;
  }

  @Transactional()
  async update(comment: Comment, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const updatedComment = { ...comment, ...updateCommentDto };
    updatedComment.isEdited = true;

    await this.repository.save(updatedComment);

    return updatedComment;
  }

  @Transactional()
  async remove(comment: Comment) {
    const commentReplies: Comment[] = await this.repository.find({ where: { parentId: comment.id } });

    for (const reply of commentReplies) {
      await this.repository.delete(reply.id);
    }

    await this.repository.delete(comment.id);
  }

  @Transactional()
  async createOnComment(comment: Comment, user: User, createCommentDto: CreateCommentDto) {
    const commentCreated = this.repository.create({
      ...createCommentDto,
      user,
      parentId: comment.id,
      post: comment.post,
      nameUser: user.name,
    });
  
    const commentSave = await this.repository.save(commentCreated);

    return commentSave;
  }

  async findAllOfComment(comment: Comment, page: number, limit: number) {
    const [result, count] = await this.repository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      where: { parentId : comment.id }
    });

    return {
      data: result,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }
}