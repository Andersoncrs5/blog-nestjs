import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from "class-transformer";
import * as sanitizeHtml from "sanitize-html";

export class CreatePostDto {
    @IsString({ message: "The field title should be a string" })
    @IsNotEmpty({ message: "The field title cannot be null" })
    @Length(1, 250, { message: "The max length of title is 250 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value) )
    title: string;

    @IsString({ message: "The field content should be a string" })
    @IsNotEmpty({ message: "The field content cannot be null" })
    @Length(1, 2500, { message: "The max length of content is 2500 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value) )
    content: string;

    @IsString({ message: "The field category should be a string" })
    @IsNotEmpty({ message: "The field category cannot be null" })
    @Length(1, 150, { message: "The max length of category is 150 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value) )
    category: string;

}


