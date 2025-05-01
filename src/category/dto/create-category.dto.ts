import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from "class-transformer";
import * as sanitizeHtml from "sanitize-html";

export class CreateCategoryDto {
    
    @IsString({ message: "The field name should be a string" })
    @IsNotEmpty({ message: "The field name cannot be null" })
    @Length(1, 250, { message: "The max length of name is 250 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value) )
    name: string;

    @IsString({ message: "The field name of user should be a string" })
    @IsNotEmpty({ message: "The field name of user cannot be null" })
    @Length(1, 150, { message: "The max length of name of user is 150 and min is 1" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => sanitizeHtml(value) )
    nameUser: string

}
