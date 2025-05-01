import { PartialType } from '@nestjs/swagger';
import { CreateFavoritePostDto } from './create-favorite_post.dto';

export class UpdateFavoritePostDto extends PartialType(CreateFavoritePostDto) {}
