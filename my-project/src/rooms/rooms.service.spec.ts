import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { beforeEach, jest, describe, it, expect } from '@jest/globals';

// Mocking the PrismaService to avoid connecting to a real database.
// We define the specific methods we expect to be called (create, findMany, etc.)
// and use jest.fn() to simulate their behavior and return values.
const mockPrismaService = {
  rooms: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};


describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test Suite for creating a room
  // Verifies that:
  // 1. The service transforms DTO string dates into Date objects.
  // 2. It calls Prisma with the correct data structure.
  describe('create', () => {
    it('should create a room with parsed dates', async () => {
      const dto: CreateRoomDto = {
        name: 'Standard Room 101',
        description: 'Standard room with garden view',
        capacity: 2,
        price_per_night: 1800.00,
        image_url: '/images/room101.jpg',
        is_active: true,
      };

      const result = { id: 1, ...dto, created_at: new Date(), updated_at: new Date() };
      mockPrismaService.rooms.create.mockResolvedValue(result);

      expect(await service.create(dto)).toEqual(result);
      expect(prisma.rooms.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
            name: dto.name,
            description: dto.description,
            capacity: dto.capacity,
            price_per_night: dto.price_per_night,
            image_url: dto.image_url,
            is_active: dto.is_active,
        }),
      });
    });
  });

  // Test Suite for retrieving all rooms
  // Verifies that the service simply delegates to prisma.rooms.findMany.
  describe('findAll', () => {
    it('should return an array of rooms', async () => {
      const result = [{ id: 1 }];
      mockPrismaService.rooms.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(prisma.rooms.findMany).toHaveBeenCalled();
    });
  });

  // Test Suite for retrieving a single room
  // Verifies:
  // 1. Success: Returns the room when found.
  // 2. Failure: Returns null when the ID does not exist.
  describe('findOne', () => {
    it('should return a single room', async () => {
        const result = { id: 1};
        mockPrismaService.rooms.findUnique.mockResolvedValue(result);
  
        expect(await service.findARoom(1)).toBe(result);
        expect(prisma.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throwNotFoundExcepection if room not found', async () => {
        mockPrismaService.rooms.findUnique.mockResolvedValue(null);
  
        await expect(service.findARoom(999)).rejects.toThrow('Room 999 not found');
        expect(prisma.rooms.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  // Test Suite for updating a room
  // Verifies:
  // 1. Success: Calls prisma.update with correct ID and data.
  // 2. Failure: Throws an error if the record is not found (simulated rejection).
  describe('update', () => {
    it('should update a room', async () => {
      const dto: UpdateRoomDto = { name: 'Updated Name' };
      const result = { id: 1, name: 'Updated Name' };
      mockPrismaService.rooms.update.mockResolvedValue(result);

      expect(await service.update(1, dto)).toBe(result);
      expect(prisma.rooms.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ name: dto.name }),
      });
    });
    it('should throw if room not found', async () => {
      const dto: UpdateRoomDto = { name: 'Updated Name' };
      mockPrismaService.rooms.update.mockRejectedValue(new Error('Record to update not found.'));

      await expect(service.update(999, dto)).rejects.toThrow('Record to update not found.');
    });
  });
  
//   // Test Suite for deleting a term
//   // Verifies:
//   // 1. Success: Calls prisma.delete with correct ID.
//   // 2. Failure: Throws an error if the record is not found (simulated rejection).
  describe('remove', () => {
      it('should delete a term', async () => {
          const result = { id: 1, code: '2024T1' };
          mockPrismaService.rooms.delete.mockResolvedValue(result);
          
          expect(await service.remove(1)).toBe(result);
          expect(prisma.rooms.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      });
    it('should throw if rooms not found', async () => {
        mockPrismaService.rooms.delete.mockRejectedValue(new Error('Record to delete not found.'));

        await expect(service.remove(999)).rejects.toThrow('Record to delete not found.');
    });
  });
});


