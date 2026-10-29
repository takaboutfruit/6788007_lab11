import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { NotFoundException, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class MockAuthGuard {
    canActivate() {
      return true;
    }
  },
  PassportStrategy: () => class {},
}));
jest.mock('@nestjs/cache-manager', () => ({
  CacheInterceptor: class MockCacheInterceptor {
    intercept(ctx: any, next: any) {
      return next.handle();
    }
  },
  CacheKey: () => () => {},
  CacheTTL: () => () => {},
  CacheModule: { register: () => ({}), registerAsync: () => ({}) },
}));

// Mock TermsService
// The controller interacts with this mock instead of the real service/DB.
const mockRoomsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findARoom: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RoomsController Integration', () => {
  let controller: RoomsController;
  let service: RoomsService;

  beforeEach(async () => {
    // We override Guards and Interceptors to isolate the controller.
    // 1. JwtAuthGuard & RolesGuard: overridden to allow all requests (return true).
    // 2. CacheInterceptor: overridden to bypass caching logic.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (ctx: ExecutionContext, next: any) => next.handle() })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test Suite: CREATE
  // Verifies the controller delegates to service.create and returns the result.
  describe('create', () => {
    it('should call service.create and return the result', async () => {
      const dto: CreateRoomDto = {
         name: 'Standard Room 101',
        description: 'Standard room with garden view',
        capacity: 2,
        price_per_night: 1800.00,
        image_url: '/images/room101.jpg',
        is_active: true,
      };
      const result = { id: 1, ...dto, created_at: new Date(), updated_at: new Date() };
      mockRoomsService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return terms', async () => {
      const result = [{ id: 1, code: '2024T1' }];
      mockRoomsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  // Test Suite: FIND ONE
  // Verifies:
  // 1. Success: Returns term found by service.
  // 2. Failure: Returns null if service returns null.
  describe('findOne', () => {
    it('should call service.findOne and return the room', async () => {
      const result = { id: 1 };
      mockRoomsService.findARoom.mockResolvedValue(result);

      expect(await controller.findOne('1')).toBe(result);
      expect(service.findARoom).toHaveBeenCalledWith(1);
    });

    it('should return null if room not found', async () => {
      mockRoomsService.findARoom.mockResolvedValue(null);
      expect(await controller.findOne('1')).toBeNull();
    });
  });

  // Test Suite: REMOVE
  // Verifies:
  // 1. Success: Calls service.remove.
  // 2. Failure: Specifically checks that P2025 (Not Found) error from Prisma 
  //    is caught and re-thrown as a NotFoundException by the controller.
  describe('remove', () => {
    it('should call service.remove and return success', async () => {
      mockRoomsService.remove.mockResolvedValue({ id: 1 });
      expect(await controller.remove('1')).toEqual({ success: true });
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if service throws P2025', async () => {
        const error = new Error('Record to delete not found.') as any;
        error.code = 'P2025';
        mockRoomsService.remove.mockRejectedValue(error);

        await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
