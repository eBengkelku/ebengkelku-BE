# Redis Implementation Guide

## Overview

This guide explains how to use Redis in nestjs starter with the configured RedisService. Focus on practical patterns for caching, sessions, and real-time features.

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Basic Caching](#basic-caching)
3. [Common Patterns](#common-patterns)
4. [Testing](#testing)

## Quick Setup

### 1. Import RedisModule in Your Feature Module

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { UsersService } from './users.service';

@Module({
  imports: [RedisModule],
  providers: [UsersService],
})
export class UsersModule {}
```

### 2. Inject RedisService

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(private readonly redisService: RedisService) {}
}
```

## Basic Caching

### Cache Database Queries

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUser(id: string): Promise<User> {
    // Check cache first
    const cacheKey = `user:${id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const user = await this.userRepository.findOne({ where: { id } });

    if (user) {
      // Cache for 1 hour
      await this.redisService.set(cacheKey, JSON.stringify(user), 3600);
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    // Update database
    await this.userRepository.update(id, data);
    const user = await this.userRepository.findOne({ where: { id } });

    // Update cache
    const cacheKey = `user:${id}`;
    await this.redisService.set(cacheKey, JSON.stringify(user), 3600);

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);

    // Remove from cache
    const cacheKey = `user:${id}`;
    await this.redisService.delete(cacheKey);
  }
}
```

### Cache API Responses

```typescript
@Injectable()
export class TicketsService {
  constructor(private readonly redisService: RedisService) {}

  async getTicketsList(userId: string): Promise<Ticket[]> {
    const cacheKey = `tickets:user:${userId}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const tickets = await this.ticketRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Cache for 15 minutes
    await this.redisService.set(cacheKey, JSON.stringify(tickets), 900);

    return tickets;
  }
}
```

### Clear Cache Patterns

```typescript
@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  // Clear user-related cache when user data changes
  async clearUserCache(userId: string): Promise<void> {
    await this.redisService.clearPattern(`user:${userId}*`);
  }

  // Clear all tickets cache
  async clearTicketsCache(): Promise<void> {
    await this.redisService.clearPattern('tickets:*');
  }

  // Check if data exists in cache
  async isCached(key: string): Promise<boolean> {
    return await this.redisService.exists(key);
  }
}
```

## Common Patterns

### Rate Limiting

```typescript
@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  // Simple rate limiting (100 requests per hour)
  async checkRateLimit(
    identifier: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${identifier}`;
    const current = await this.redisService.incr(key);

    if (current === 1) {
      // First request in window, set expiration
      await this.redisService.expire(key, 3600); // 1 hour
    }

    const limit = 100;
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }
}
```

### Counter Operations

```typescript
@Injectable()
export class StatsService {
  constructor(private readonly redisService: RedisService) {}

  // Increment ticket views
  async incrementTicketViews(ticketId: string): Promise<number> {
    const key = `ticket:views:${ticketId}`;
    return await this.redisService.incr(key);
  }

  // Track login attempts for rate limiting
  async trackLoginAttempt(email: string): Promise<number> {
    const key = `login:attempts:${email}`;
    const attempts = await this.redisService.incr(key);

    // Set expiry on first attempt (15 minutes)
    if (attempts === 1) {
      await this.redisService.expire(key, 900);
    }

    return attempts;
  }
}
```

## Testing

### Unit Testing with Mocks

```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RedisService } from '../redis/redis.service';

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  clearPattern: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should get user from cache', async () => {
    const userId = '123';
    const cachedUser = { id: '123', name: 'John Doe' };

    mockRedisService.get.mockResolvedValue(JSON.stringify(cachedUser));

    const result = await service.getUser(userId);

    expect(redisService.get).toHaveBeenCalledWith(`user:${userId}`);
    expect(result).toEqual(cachedUser);
  });
});
```

### Health Check

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly redisService: RedisService) {}

  @Get('redis')
  async checkRedis() {
    try {
      const isConnected = await this.redisService.ping();
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

## Key Guidelines

1. **Use consistent key naming**: `entity:id` or `entity:user:id`
2. **Set appropriate TTL**: Short for dynamic data (15min), longer for static data (1-24h)
3. **Always handle cache misses**: Gracefully fall back to database
4. **Clear cache on updates**: Remove or update cached data when source changes
5. **Test Redis operations**: Mock RedisService in unit tests

## Common TTL Values

- **User sessions**: 24 hours (86400 seconds)
- **API responses**: 15-30 minutes (900-1800 seconds)
- **Database queries**: 1 hour (3600 seconds)
- **Static data**: 24 hours (86400 seconds)
- **Rate limiting**: 1 hour (3600 seconds)
