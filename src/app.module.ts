import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './shared/config/env.validation';
import { RedisCacheModule } from './shared/cache/redis-cache.module';
import { LoggerModule } from './shared/logger/logger.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProducersModule } from './producers/producers.module';
import { FarmsModule } from './farms/farms.module';
import { PlantedCropsModule } from './planted-crops/planted-crops.module';
import { SeasonsModule } from './seasons/seasons.module';
import { CropsModule } from './crops/crops.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule,
    PrismaModule,
    RedisCacheModule,
    HealthModule,
    ProducersModule,
    FarmsModule,
    PlantedCropsModule,
    SeasonsModule,
    CropsModule,
    DashboardModule,
  ],
})
export class AppModule {}
