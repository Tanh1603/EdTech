import { Injectable } from '@nestjs/common';
import { PageDto } from '@edtech/contracts';
import { UserRole } from '@edtech/contracts';
import { AccessPolicyService } from '../../../common/access/access-policy.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import {
  ChatMessagesQueryDto,
  ChatSessionsQueryDto,
  CreateChatSessionDto,
  SendMessageDto,
  UpdateChatSessionDto,
} from '@edtech/contracts';

@Injectable()
export class ChatSharedService {
  constructor(
    private readonly accessPolicy: AccessPolicyService,
    private readonly prisma: PrismaService,
  ) {}

  async createSession(
    payload: CreateChatSessionDto,
    userId: string,
    roles: UserRole[] = [],
  ) {
    if (payload.classId) {
      await this.accessPolicy.assertClassroomAccess(payload.classId, userId, roles);
    }

    return this.prisma.chatSession.create({
      data: {
        userId,
        classId: payload.classId,
        title: payload.title,
      },
    });
  }

  async getSessions(
    query: ChatSessionsQueryDto,
    userId: string,
  ): Promise<PageDto<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ChatSessionWhereInput = {
      userId,
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.chatSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    return this.toPage(
      sessions.map(({ messages, ...session }) => ({
        ...session,
        lastMessage: messages[0]?.content ?? null,
      })),
      page,
      limit,
      total,
    );
  }

  getSessionDetail(sessionId: string, userId: string) {
    return this.prisma.chatSession.findFirstOrThrow({
      where: { id: sessionId, userId },
    });
  }

  async updateSession(
    sessionId: string,
    payload: UpdateChatSessionDto,
    userId: string,
  ) {
    await this.getSessionDetail(sessionId, userId);
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: payload.title },
    });
  }

  async deleteSession(sessionId: string, userId: string) {
    await this.getSessionDetail(sessionId, userId);
    await this.prisma.$transaction([
      this.prisma.chatMessage.deleteMany({ where: { sessionId } }),
      this.prisma.chatSession.delete({ where: { id: sessionId } }),
    ]);
    return { id: sessionId, deleted: true };
  }

  async getMessages(
    sessionId: string,
    query: ChatMessagesQueryDto,
    userId: string,
  ): Promise<PageDto<unknown>> {
    await this.getSessionDetail(sessionId, userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ChatMessageWhereInput = { sessionId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return this.toPage(items, page, limit, total);
  }

  async createMessage(
    sessionId: string,
    payload: SendMessageDto,
    userId: string,
  ) {
    await this.getSessionDetail(sessionId, userId);
    return this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: payload.role,
        content: payload.content,
        intent: payload.intent,
      },
    });
  }

  getMessageDetail(messageId: string, userId: string) {
    return this.prisma.chatMessage.findFirstOrThrow({
      where: { id: messageId, session: { userId } },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.chatMessage.findFirstOrThrow({
      where: { id: messageId, session: { userId } },
      select: { id: true },
    });
    await this.prisma.chatMessage.delete({ where: { id: message.id } });
    return { id: messageId, deleted: true };
  }

  async getMyAnalytics(userId: string) {
    const [totalSessions, totalMessages] = await this.prisma.$transaction([
      this.prisma.chatSession.count({ where: { userId } }),
      this.prisma.chatMessage.count({ where: { session: { userId } } }),
    ]);
    return { totalSessions, totalMessages, favoriteTopics: [] };
  }

  async getClassroomAnalytics(
    classId: string,
    userId: string,
    roles: UserRole[] = [],
  ) {
    await this.accessPolicy.assertClassroomAccess(classId, userId, roles);

    const sessions = await this.prisma.chatSession.findMany({
      where: { classId },
      select: { userId: true, _count: { select: { messages: true } } },
    });
    return {
      activeStudents: new Set(sessions.map((session) => session.userId)).size,
      questionsAsked: sessions.reduce(
        (sum, session) => sum + session._count.messages,
        0,
      ),
    };
  }

  private toPage<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
  ): PageDto<T> {
    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
