import { Injectable } from '@nestjs/common';
import { PageDto, toIsoString, UserRole } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toUserSummary, userSummarySelect } from '../../../common/rbac/rbac.mapper';
import { Prisma } from '../../../generated/prisma/client';
import { CourseQueryDto } from '@edtech/contracts';
import { CreateCourseDto } from '@edtech/contracts';
import { UpdateCourseDto } from '@edtech/contracts';

@Injectable()
export class CoursesService {
  constructor(
    private readonly accessPolicy: AccessPolicyService,
    private readonly prisma: PrismaService,
  ) {}

  async getCourses(
    query: CourseQueryDto,
    userId: string,
    roles: UserRole[] = [],
  ): Promise<PageDto<unknown>> {

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CourseWhereInput = {
      ...(roles.includes(UserRole.admin)
        ? query.teacherId
          ? { teacherId: query.teacherId }
          : {}
        : roles.includes(UserRole.teacher)
          ? { teacherId: userId }
          : {}),

      ...(query.search
        ? {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            select: userSummarySelect,
          },
        },
      }),

      this.prisma.course.count({ where }),
    ]);

    return this.toPage(
      items.map((course) =>
        this.toCourseResponse(course),
      ),
      page,
      limit,
      total,
    );
  }

  async createCourse(
    payload: CreateCourseDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    this.accessPolicy.assertTeacher(roles);
    const course = await this.prisma.course.create({
      data: {
        ...payload,
        teacherId: roles.includes(UserRole.admin) ? payload.teacherId : userId,
      },
      include: { teacher: { select: userSummarySelect } },
    });

    return this.toCourseResponse(course);
  }

  async getCourseDetail(
    courseId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {

    const course = await this.prisma.course.findUniqueOrThrow({
      where: { id: courseId },

      include: {
        teacher: {
          select: userSummarySelect,
        },

        classrooms: true,

        lessons: {
          orderBy: {
            orderNo: 'asc',
          },
        },
      },
    });

    const isAdmin =
      roles.includes(UserRole.admin);

    const isTeacher =
      course.teacherId === userId;

    const isEnrolled =
      await this.prisma.enrollment.findFirst({
        where: {
          userId,
          classroom: { courseId },
        },
        select: { id: true },
      });

    // Public course
    // Hide classroom info if not enrolled
    if (!isAdmin && !isTeacher && !isEnrolled) {
      course.classrooms = [];
    }

    return this.toCourseDetailResponse(course);
  }

  async updateCourse(
    courseId: string,
    payload: UpdateCourseDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertCourseTeacherOrAdmin(courseId, userId, roles);
    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: payload,
      include: { teacher: { select: userSummarySelect } },
    });

    return this.toCourseResponse(course);
  }

  async deleteCourse(courseId: string, userId: string, roles: UserRole[] = []) {
    await this.accessPolicy.assertCourseTeacherOrAdmin(courseId, userId, roles);
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Get classroom IDs
      const classrooms = await tx.classroom.findMany({
        where: { courseId },
        select: { id: true }
      });
      const classIds = classrooms.map(c => c.id);

      // 2. Get lesson IDs
      const lessons = await tx.lesson.findMany({
        where: { courseId },
        select: { id: true }
      });
      const lessonIds = lessons.map(l => l.id);

      // 3. Delete Classrooms related items
      if (classIds.length > 0) {
        // Get all Chat Sessions for these classrooms
        const chatSessions = await tx.chatSession.findMany({
          where: { classId: { in: classIds } },
          select: { id: true }
        });
        const chatSessionIds = chatSessions.map(cs => cs.id);

        if (chatSessionIds.length > 0) {
          await tx.chatMessage.deleteMany({
            where: { sessionId: { in: chatSessionIds } }
          });
          await tx.chatSession.deleteMany({
            where: { id: { in: chatSessionIds } }
          });
        }

        // Get all Exams for these classrooms
        const exams = await tx.exam.findMany({
          where: { classId: { in: classIds } },
          select: { id: true }
        });
        const examIds = exams.map(e => e.id);

        if (examIds.length > 0) {
          // Get all submissions for these exams
          const submissions = await tx.submission.findMany({
            where: { examId: { in: examIds } },
            select: { id: true }
          });
          const submissionIds = submissions.map(s => s.id);

          if (submissionIds.length > 0) {
            await tx.result.deleteMany({
              where: { submissionId: { in: submissionIds } }
            });
            await tx.submission.deleteMany({
              where: { id: { in: submissionIds } }
            });
          }

          await tx.question.deleteMany({
            where: { examId: { in: examIds } }
          });
          await tx.exam.deleteMany({
            where: { id: { in: examIds } }
          });
        }

        // Delete enrollments
        await tx.enrollment.deleteMany({
          where: { classId: { in: classIds } }
        });

        // Delete student topic mastery stats
        await tx.studentTopicMastery.deleteMany({
          where: { classId: { in: classIds } }
        });

        // Set classId to null associated with classrooms
        await tx.learningRoadmap.updateMany({
          where: { classId: { in: classIds } },
          data: { classId: null }
        });

        // Delete classroom lessons association
        await tx.classroomLesson.deleteMany({
          where: { classId: { in: classIds } }
        });

        // Finally delete the classrooms
        await tx.classroom.deleteMany({
          where: { id: { in: classIds } }
        });
      }

      // 4. Delete Lessons related items
      if (lessonIds.length > 0) {
        // Get all materials for these lessons
        const materials = await tx.material.findMany({
          where: { lessonId: { in: lessonIds } },
          select: { id: true }
        });
        const materialIds = materials.map(m => m.id);

        if (materialIds.length > 0) {
          await tx.materialChunk.deleteMany({
            where: { materialId: { in: materialIds } }
          });
          await tx.material.deleteMany({
            where: { id: { in: materialIds } }
          });
        }

        // Delete classroom lessons association (if not already deleted)
        await tx.classroomLesson.deleteMany({
          where: { lessonId: { in: lessonIds } }
        });

        // Delete lessons
        await tx.lesson.deleteMany({
          where: { id: { in: lessonIds } }
        });
      }

      // 5. Delete the course
      const deleted = await tx.course.delete({
        where: { id: courseId }
      });

      return { id: deleted.id, deleted: true };
    });
  }

  private toPage<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
  ): PageDto<T> {
    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toCourseResponse(course: {
    id: string;
    teacherId: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    teacher?: Parameters<typeof toUserSummary>[0];
  }) {
    return {
      id: course.id,
      teacherId: course.teacherId,
      name: course.name,
      description: course.description ?? '',
      thumbnailUrl: course.thumbnailUrl ?? '',
      teacher: toUserSummary(course.teacher),
      createdAt: toIsoString(course.createdAt),
      updatedAt: toIsoString(course.updatedAt),
    };
  }

  private toCourseDetailResponse(course: Parameters<typeof this.toCourseResponse>[0] & {
    classrooms?: Array<{
      id: string;
      courseId: string;
      name: string;
      inviteCode: string;
      startAt: Date;
      endAt: Date;
      createdAt: Date;
    }>;
    lessons?: Array<{
      id: string;
      courseId: string;
      title: string;
      description: string | null;
      orderNo: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }) {
    return {
      ...this.toCourseResponse(course),
      classrooms: (course.classrooms ?? []).map((classroom) => ({
        id: classroom.id,
        courseId: classroom.courseId,
        name: classroom.name,
        inviteCode: classroom.inviteCode,
        startAt: toIsoString(classroom.startAt),
        endAt: toIsoString(classroom.endAt),
        createdAt: toIsoString(classroom.createdAt),
      })),
      lessons: (course.lessons ?? []).map((lesson) => ({
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        description: lesson.description ?? '',
        orderNo: lesson.orderNo,
        createdAt: toIsoString(lesson.createdAt),
        updatedAt: toIsoString(lesson.updatedAt),
      })),
    };
  }
}
