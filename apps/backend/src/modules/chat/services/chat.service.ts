import { Injectable } from '@nestjs/common';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';
import { CreateChatMessageDto } from '../dto/create-chat-message.dto';
import { CreateChatSessionDto } from '../dto/create-chat-session.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getSessions(page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.chatSession.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.chatSession.count(),
    ]);

    return { items, page, limit, total };
  }

  async createSession(userId: string | undefined, payload: CreateChatSessionDto) {
    if (!userId) {
      throw new AppHttpException(
        'UNAUTHORIZED',
        'Missing current user id',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.prisma.chatSession.create({
      data: { userId, language: payload.language ?? 'vi' },
    });
  }

  async getMessages(sessionId: string, page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where: { sessionId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.chatMessage.count({ where: { sessionId } }),
    ]);

    return { items, page, limit, total };
  }

  async sendMessage(sessionId: string, payload: CreateChatMessageDto) {
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: payload.content,
        inputImageUrl: payload.imageUrl,
      },
    });
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: 'Mock AI response',
        intent: 'answer',
      },
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });

    return {
      message: assistantMessage,
      intent: assistantMessage.intent,
      confidence: 0.7,
      citations: [],
      followUpQuestion: null,
      debug: { userMessageId: userMessage.id },
    };
  }

  async resetMemory(sessionId: string): Promise<void> {
    await this.prisma.chatMessage.deleteMany({ where: { sessionId } });
  }
}

