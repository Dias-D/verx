import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisCacheModule } from '../shared/cache/redis-cache.module';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health-indicator';
import { RedisHealthIndicator } from './redis.health-indicator';

@Module({
  imports: [TerminusModule, PrismaModule, RedisCacheModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
