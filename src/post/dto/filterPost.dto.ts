import { IsDate, IsOptional, IsString } from 'class-validator';

export class FilterPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  categoryId: number;

  @IsOptional()
  @IsString()
  viewedAfter?: number;

  @IsOptional()
  @IsString()
  viewedBefore?: number;
  
  @IsOptional()
  @IsString()
  authorName?: string;

  @IsDate()
  @IsOptional()
  createdAtAfter?: Date

  @IsDate()
  @IsOptional()
  createdAtBefore?: Date
}