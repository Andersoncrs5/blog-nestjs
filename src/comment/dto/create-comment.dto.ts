import { IsNotEmpty, IsNumber, IsString, Length } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from "class-transformer";
import * as sanitizeHtml from "sanitize-html";

export class CreateCommentDto {

    @IsString({ message: "The field name of user should be a string" })
    @IsNotEmpty({ message: "The field name of user cannot be null" })
    @Length(1, 150, { message: "The max length of name of user is 150 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value))
    nameUser: string;

    @IsString({ message: "The field content should be a string" })
    @IsNotEmpty({ message: "The field content cannot be null" })
    @Length(1, 500, { message: "The max length of content is 500 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value))
    content: string;

    @IsNumber({}, { message: "The field parentId should be a number" })
    @ApiProperty({ example: 0 })
    parentId: number;
}