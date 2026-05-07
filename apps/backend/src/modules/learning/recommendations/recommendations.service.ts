import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(query: RecommendationQueryDto, userId: string) {
    const weakTopics = await this.getWeakTopics(query, userId);
    const recommendedLessons = await this.getRecommendedLessons(query);
    const recommendedMaterials = await this.getRecommendedMaterials(query);
    const recommendedRoadmaps = await this.prisma.learningRoadmap.findMany({
      where: { userId, status: 'active' },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      weakTopics,
      recommendedLessons,
      recommendedMaterials,
      recommendedExercises: [],
      recommendedRoadmaps,
    };
  }

  async getRecommendedLessons(query: RecommendationQueryDto) {
    return this.prisma.lesson.findMany({
      where: query.classId
        ? { course: { classrooms: { some: { id: query.classId } } } }
        : {},
      take: 10,
      orderBy: { orderNo: 'asc' },
    });
  }

  async getRecommendedMaterials(query: RecommendationQueryDto) {
    return this.prisma.material.findMany({
      where: query.classId
        ? {
            lesson: {
              course: {
                classrooms: { some: { id: query.classId } },
              },
            },
          }
        : {},
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWeakTopics(query: RecommendationQueryDto, userId: string) {
    const mastery = await this.prisma.studentTopicMastery.findMany({
      where: {
        studentId: userId,
        ...(query.classId ? { classId: query.classId } : {}),
      },
      orderBy: { masteryScore: 'asc' },
      take: 5,
    });

    return mastery
      .filter((item) => item.masteryScore < 0.7)
      .map((item) => item.topic);
  }

  async getNextLearning(query: RecommendationQueryDto, userId: string) {
    const weakTopics = await this.getWeakTopics(query, userId);
    const weakTopic = weakTopics[0];

    if (weakTopic) {
      const lesson = await this.prisma.lesson.findFirst({
        where: {
          title: { contains: weakTopic, mode: 'insensitive' },
          ...(query.classId
            ? { course: { classrooms: { some: { id: query.classId } } } }
            : {}),
        },
        orderBy: { orderNo: 'asc' },
      });

      if (lesson) {
        return {
          type: 'lesson',
          lessonId: lesson.id,
          title: lesson.title,
        };
      }
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: query.classId
        ? { course: { classrooms: { some: { id: query.classId } } } }
        : {},
      orderBy: { orderNo: 'asc' },
    });

    if (!lesson) {
      return null;
    }

    return {
      type: 'lesson',
      lessonId: lesson.id,
      title: lesson.title,
    };
  }
}
