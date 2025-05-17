import { IsDate, IsOptional, IsString } from 'class-validator';

export class FilterPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsDate()
  @IsOptional()
  createdAt?: Date
}