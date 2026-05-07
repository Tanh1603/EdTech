import { Module } from '@nestjs/common';
import { MasteryModule } from './mastery/mastery.module';
import { MaterialsModule } from './materials/materials.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';

@Module({
  imports: [
    MaterialsModule,
    RoadmapsModule,
    RecommendationsModule,
    MasteryModule,
  ],
})
export class LearningModule {}
