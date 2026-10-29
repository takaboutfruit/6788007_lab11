/*
AI Declaration:
Antigravity AI (Google DeepMind) was used to help generate this E2E test file.
The skeleton was adapted from the terms.e2e-spec.ts example provided in class.
I reviewed and understood all generated code before submission.

Reflection:
Writing E2E tests helped me understand the full request lifecycle of a NestJS app —
from authentication with JWT, to seeding real DB data, to making HTTP requests via
Supertest and asserting on actual HTTP responses. I learned how mocking Redis in jest
allows E2E tests to run without external dependencies like a live cache server.
*/

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { CreateRoomDto } from '../src/rooms/dto/create-room.dto';
import { UpdateRoomDto } from '../src/rooms/dto/update-room.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';

// Mock Redis Store to avoid connectivity issues during tests.
// This ensures we can run E2E tests without needing a separate Redis instance running.
// We return null for get() (cache miss) so every request hits the real handler.
jest.mock('cache-manager-redis-yet', () => ({
  redisStore: () => ({
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn().mockResolvedValue([]),
    ttl: jest.fn().mockResolvedValue(0),
  }),
}));

describe('RoomsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cacheManager: Cache;
  let accessToken: string;
  let createdRoomId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Initialize the full NestJS application (uses AppModule with real DB)
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same global ValidationPipe as in main.ts
    // so that DTO validation works correctly in E2E tests
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    cacheManager = app.get<Cache>(CACHE_MANAGER);

    // Seed Admin User
    // The RoomsController requires Role.ADMIN for Create/Delete/Disable/Enable operations.
    // Since we are running against the full app, we need a real user in the DB to login with.
    const email = `test-admin-rooms-${Date.now()}@example.com`;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name: 'Test Admin',
        role: Role.ADMIN,
      },
    });
    testUserId = user.id;

    // Login using the seeded admin credentials.
    // We capture the JWT access_token to use in Authorization headers for subsequent requests.
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Cleanup: remove the room created during tests (if it still exists)
    if (createdRoomId) {
      try {
        await prisma.rooms.delete({ where: { id: createdRoomId } });
      } catch (e) {
        // Already deleted during the DELETE test — ignore
      }
    }

    // Cleanup: remove the seeded test admin user
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (e) {}
    }

    await app.close();
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────

  // Test Scenario: CREATE Room (authenticated as Admin)
  // Should return 201 Created with the new room object including its generated id.
  it('/rooms (POST) - Create Room', async () => {
    const createDto: CreateRoomDto = {
      name: 'E2E Test Room 101',
      description: 'A room created during E2E testing',
      capacity: 2,
      price_per_night: 1800.0,
      image_url: '/images/e2e-room101.jpg',
      is_active: true,
    };

    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(createDto.name);
    expect(response.body.capacity).toBe(createDto.capacity);
    // Prisma returns Decimal fields as strings in JSON; coerce to number before comparing
    expect(Number(response.body.price_per_night)).toBe(createDto.price_per_night);

    // Save the created room's id for subsequent tests
    createdRoomId = response.body.id;
  });

  // ─── UNAUTHORIZED ACCESS ──────────────────────────────────────────────────

  // Test Scenario: Unauthorized POST
  // Sending a POST request without an Authorization header should return 401 Unauthorized.
  it('/rooms (POST) - Fail Unauthorized', async () => {
    await request(app.getHttpServer())
      .post('/rooms')
      .send({ name: 'Should Fail', capacity: 1, price_per_night: 500 })
      .expect(401);
  });

  // ─── GET ALL ──────────────────────────────────────────────────────────────

  // Test Scenario: GET All Rooms
  // Verify 200 OK and that the room we just created exists in the response array.
  it('/rooms (GET) - Get All Rooms', async () => {
    const response = await request(app.getHttpServer())
      .get('/rooms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const found = response.body.find((r: any) => r.id === createdRoomId);
    expect(found).toBeDefined();
    expect(found.name).toBe('E2E Test Room 101');
  });

  // ─── GET SINGLE ───────────────────────────────────────────────────────────

  // Test Scenario: GET Single Room
  // Retrieve the specific room by ID and verify the response data matches what we created.
  it('/rooms/:id (GET) - Get Single Room', async () => {
    const response = await request(app.getHttpServer())
      .get(`/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdRoomId);
    expect(response.body.name).toBe('E2E Test Room 101');
    expect(response.body.capacity).toBe(2);
  });

  // ─── UPDATE (DISABLE) ─────────────────────────────────────────────────────

  // Test Scenario: Disable a Room (acts as the update operation for this API)
  // PATCH /rooms/:id/disable should return 200 OK with the updated room (is_active: false).
  it('/rooms/:id/disable (PATCH) - Update Room (Disable)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/rooms/${createdRoomId}/disable`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdRoomId);
    expect(response.body.is_active).toBe(false);
  });

  // Test Scenario: Update Not Found
  // PATCH /rooms/:id/disable with a non-existent ID should return 404 Not Found.
  it('/rooms/:id/disable (PATCH) - Fail Not Found', async () => {
    await request(app.getHttpServer())
      .patch('/rooms/999999/disable')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  // Test Scenario: DELETE Room
  // Send DELETE request and verify 200 OK response.
  it('/rooms/:id (DELETE) - Delete Room', async () => {
    await request(app.getHttpServer())
      .delete(`/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  // Test Scenario: Verify Deletion
  // After deletion, verify the room is gone:
  // 1. Check directly via Prisma — the record must not exist in the DB.
  // 2. Send a GET request — should return 404 Not Found (the CacheInterceptor
  //    mock always returns a cache miss, so the real DB state is reflected).
  it('/rooms/:id (GET) - Verify Room Deleted (404)', async () => {
    // Authoritative check: confirm the row is gone from the database
    const deletedRoom = await prisma.rooms.findUnique({
      where: { id: createdRoomId },
    });
    expect(deletedRoom).toBeNull();

    // Clear in-memory cache so the HTTP GET hits the real DB handler
    await cacheManager.clear();

    // HTTP check: GET should now return 404
    await request(app.getHttpServer())
      .get(`/rooms/${createdRoomId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    // Room is confirmed deleted; clear the id so afterAll cleanup doesn't fail
    createdRoomId = 0;
  });
});
