import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateLikeDto {
    @IsNumber({}, { message: 'The field userId should be a number' })
    @IsNotEmpty({ message: "The field name of user cannot be null" })
    @ApiProperty({ example: 0 })
    userId: number

    @IsNumber({}, { message: 'The field userId should be a number' })
    @IsNotEmpty({ message: "The field name of user cannot be null" })
    @ApiProperty({ example: 0 })
    postId: number
}
