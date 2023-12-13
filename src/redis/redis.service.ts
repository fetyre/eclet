import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
	constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

	async getValue(key: string): Promise<string> {
		return this.redisClient.get(key);
	}

	async setValue(key: string, value: string, ttl: number): Promise<void> {
		await this.redisClient.set(key, value, 'EX', ttl);
	}
}
