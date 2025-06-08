import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";
import * as sanitizeHtml from "sanitize-html";

export class resetPasswordDTO {
    @IsString()
    @IsNotEmpty({ message: "The field token cannot be null" })
    @ApiProperty({ default: "" })
    @Transform(({ value }) => sanitizeHtml(value))
    token: string;

    @IsString({ message: "The field password should be a string" })
    @IsNotEmpty({ message: "The field password cannot be null" })
    @Length(6, 50, { message: "The max length of password is 50 and min is 6" })
    @Transform(({ value }) => sanitizeHtml(value.trim()))
    @ApiProperty({ default: "12345678" })
    password: string;

    @IsString({ message: "The field confirm password should be a string" })
    @IsNotEmpty({ message: "The field confirm password cannot be null" })
    @Length(6, 50, { message: "The max length of confirm password is 50 and min is 6" })
    @Transform(({ value }) => sanitizeHtml(value.trim()))
    @ApiProperty({ default: "12345678" })
    confirmPassword: string;

    @IsString({ message: "The field email should be a string" })
    @IsNotEmpty({ message: "The field email cannot be null" })
    @Length(1, 150, { message: "The max length of email is 150 and min is 1" })
    @IsEmail({}, { message: "The field email must be a valid email address" })
    @ApiProperty({ example: "" })
    @Transform(({ value }) => value.trim() )
    @Transform(({ value }) => value.toLowerCase() )
    @Transform(({ value }) => sanitizeHtml(value) )
    email: string;
}