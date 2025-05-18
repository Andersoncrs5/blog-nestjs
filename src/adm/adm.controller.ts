import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { AdmService } from './adm.service';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('adm')
export class AdmController {
  constructor(private readonly admService: AdmService) {}

  @Get('getAllCommentBlockeds')
  @HttpCode(HttpStatus.FOUND)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async getAllCommentBlockeds(
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    return await this.admService.getAllCommentBlockeds(pageNumber, limitNumber);
  }

  @Get('getAllPostBlockeds')
  @HttpCode(HttpStatus.FOUND)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async getAllPostBlockeds(
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    return await this.admService.getAllPostBlockeds(pageNumber, limitNumber);
  }

  @HttpCode(HttpStatus.FOUND)
  @Get('getAllUserBlockeds')
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Quantidade de itens por página (máximo 100)' })
  async getAllUserBlockeds(
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, parseInt(limit));
    return await this.admService.getAllUserBlockeds(pageNumber, limitNumber);
  }

  @HttpCode(HttpStatus.OK)
  @Get('blockOrUnblockUser/:id')
  @ApiBearerAuth()
  async blockOrUnblockUser(@Param('id') id: string ) {
    return await this.admService.blockOrUnblockUser(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('blockOrUnblockPost/:id')
  @ApiBearerAuth()
  async blockOrUnblockPost(@Param('id') id: string ) {
    return await this.admService.blockOrUnblockPost(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('blockOrUnblockComment/:id')
  @ApiBearerAuth()
  async blockOrUnblockComment(@Param('id') id: string ) {
    return await this.admService.blockOrUnblockComment(+id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('turnUserInAdm/:id')
  @ApiBearerAuth()
  async turnUserInAdm(@Param('id') id: string ) {
    return await this.admService.turnUserInAdm(+id);
  }

}
