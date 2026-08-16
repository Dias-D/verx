import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './shared/config/env.validation';
import { PrismaModule } from './shared/prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';
import { FarmsModule } from './farms/farms.module';
import { PlantedCropsModule } from './planted-crops/planted-crops.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    ProducersModule,
    FarmsModule,
    PlantedCropsModule,
  ],
})
export class AppModule {}
