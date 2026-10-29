/*
AI Declaration:
No Generative AI tools were used for this lab.
All code was written manually by the student.

Reflection:
[ Your Reflection goes here
Today’s lab helped me learn [key takeaway].
I practiced ...
]

- Error handling
- Writing dto
- Throw-catch in room.services
*/


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class RoomsService {

  constructor(private readonly prisma: PrismaService){}
  private readonly logger = new Logger('RoomsService');


  async create(dto: CreateRoomDto) {
    this.logger.log(`Creating room: ${dto.name}`)
    try{ 
      return await this.prisma.rooms.create({
        data:{
          name: dto.name,
          description: dto.description,
          capacity: dto.capacity,
          price_per_night: dto.price_per_night,
          image_url: dto.image_url,
          is_active: dto.is_active,
        }
      })
    } catch(e: any){
      this.logger.error(`Room not created`)
      throw new BadRequestException(e?.message ?? 'Created failed');
    }
  }

  findAll() {
    this.logger.log(`Fetching all rooms`)
    return this.prisma.rooms.findMany();
  }

  async findARoom(id: number) {
    this.logger.log(`Fetching room id=${id}`)
    const room = await this.prisma.rooms.findUnique({where: {id}});
    if (!room) {
      this.logger.error(`Room ${id} not found`)
      throw new NotFoundException(`Room ${id} not found`)
    };
    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    this.logger.log(`Updating room id=${id}`);
    try {
      return await this.prisma.rooms.update({
        where: { id },
        data: updateRoomDto,
      });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`Room ${id} not found`);
      }
      throw e;
    }
  }

  async remove(id: number) {
    this.logger.log(`Removing room id=${id}`);
    try {
      return await this.prisma.rooms.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException(`Room ${id} not found`);
      }
      throw e;
    }
  }

  async disable(id: number){
    this.logger.log(`Disabling room id=${id}`)
    await this.findARoom(id);

    return this.prisma.rooms.update({
      where: {id},
      data: {is_active: false}
    });
  }

  async enable(id: number){
    this.logger.log(`Enabling room id=${id}`)
    await this.findARoom(id);

    return this.prisma.rooms.update({
      where: {id},
      data: {is_active: true}
    });
  }
}
