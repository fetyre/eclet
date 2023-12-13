//   import { CacheModule, Module } from '@nestjs/common';

//     import { ConfigModule, ConfigService } from '@nestjs/config';
//     import * as redisStore from 'cache-manager-redis-store';
// import { RedisService } from './redis.service';

//     @Module({
//         imports: [
//             CacheModule.*registerAsync*({
//                 imports: [ConfigModule],
//                 inject: [ConfigService],
//                 useFactory: async () => ({
//                     store: redisStore,
//                     host: localhost,
//                     port: 6479,
//                     ttl: 5000,
//                     max: 5
//                 })
//             })
//         ],
//         providers: [RedisService],
//         exports: [RedisService]
//     })
//     export class RedisCacheModule {}