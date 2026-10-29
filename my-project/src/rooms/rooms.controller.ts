/*
AI Declaration:
No Generative AI tools were used for this lab.
All code was written manually by the student.

Reflection:
[ Your Reflection goes here
Today’s lab helped me learn [key takeaway].
I practiced ...
]

- How to make API documentation with Swagger.
*/

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';


@ApiTags('rooms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully', type: CreateRoomDto }) // Returns the created object, conceptually matches DTO structure usually
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30000) // Cache for 30 seconds
  @Get()
  @ApiOperation({ summary: 'Retrieve all rooms' })
  @ApiResponse({ status: 200, description: 'List of all rooms', type: [CreateRoomDto] })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  findAll() {
    return this.roomsService.findAll();
  }


  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // Cache for 30 seconds
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific room by ID' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room details', type: CreateRoomDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findARoom(+id);
    if(!room){
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  @Patch(':id/disable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Disable a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room updated successfully', type: CreateRoomDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  disable(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.disable(+id);
  }

  @Patch(':id/enable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Room updated successfully', type: CreateRoomDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  enable(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.enable(+id);
  }


  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a room' })
  @ApiParam({ name: 'id', description: 'Room ID', type: Number })
  @ApiResponse({ status: 200, description: 'Term deleted successfully', type: CreateRoomDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
