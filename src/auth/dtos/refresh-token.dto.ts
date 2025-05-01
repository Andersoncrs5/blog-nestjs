import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDTO {
    @ApiProperty({ example : "" })
    refresh_token: string;
}  