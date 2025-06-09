import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  viewedAfter?: number;

  @IsOptional()
  @IsNumber()
  viewedBefore?: number;

  @IsOptional()
  @IsNumber()
  likeAfter?: number;

  @IsOptional()
  @IsNumber()
  likeBefore?: number;

  @IsOptional()
  @IsNumber()
  dislikeAfter?: number;

  @IsOptional()
  @IsNumber()
  dislikeBefore?: number;

  @IsOptional()
  @IsNumber()
  commentsCountAfter?: number;

  @IsOptional()
  @IsNumber()
  commentsCountBefore?: number;

  @IsOptional()
  @IsNumber()
  favoriteCountAfter?: number;

  @IsOptional()
  @IsNumber()
  favoriteCountBefore?: number;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsDate()
  createdAtAfter?: Date;

  @IsOptional()
  @IsDate()
  createdAtBefore?: Date;
}
