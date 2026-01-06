import { RedisConfig } from '@/config/redis.config';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis.Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisConfig = this.configService.get<RedisConfig>('redis');

    this.logger.log(
      `Initializing Redis connection with config: ${JSON.stringify({
        host: redisConfig?.host,
        port: redisConfig?.port,
      })}`,
    );

    const { keepAlive, ...restConfig } = redisConfig || {};
    this.client = new Redis.Redis({
      ...restConfig,
      keepAlive:
        typeof keepAlive === 'boolean' ? (keepAlive ? 30000 : 0) : keepAlive,
      retryStrategy: (times: number) => {
        const delay = redisConfig?.retryStrategy
          ? redisConfig?.retryStrategy(times)
          : Math.min(times * 50, 2000);

        this.logger.warn(
          `Redis reconnecting, attempt ${times}, delay ${delay}ms`,
        );
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });
  }

  onModuleDestroy() {
    void this.client.quit();
    this.logger.log('Redis client disconnected');
  }

  /**
   * Set key-value with expiration (in seconds)
   */
  async set(key: string, value: string, ttlInSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, 'EX', ttlInSeconds);
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set key-value without expiration
   */
  async setPersist(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (error) {
      this.logger.error(
        `Redis SET PERSIST error for key ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    try {
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Redis DEL MANY error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get keys by pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(
        `Redis KEYS error for pattern ${pattern}: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Get TTL (time to live) for a key in seconds
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL error for key ${key}: ${error.message}`);
      return -1;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Increment value by 1
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis INCR error for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrement value by 1
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Redis DECR error for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear all keys matching pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;

      return await this.deleteMany(keys);
    } catch (error) {
      this.logger.error(
        `Redis CLEAR PATTERN error for ${pattern}: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Flush all data from Redis (USE WITH CAUTION!)
   */
  async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
      this.logger.warn('Redis FLUSHALL executed - all data cleared');
    } catch (error) {
      this.logger.error(`Redis FLUSHALL error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Redis info
   */
  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      this.logger.error(`Redis INFO error: ${error.message}`);
      return '';
    }
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(`Redis PING error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get Redis client for advanced operations
   */
  getClient(): Redis.Redis {
    return this.client;
  }
}
