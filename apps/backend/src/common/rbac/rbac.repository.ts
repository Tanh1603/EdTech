import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toUserRbacAuthority, userRbacInclude } from './rbac.mapper';
import { UserRbacAuthority } from './rbac.types';

@Injectable()
export class RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserAuthority(userId: string): Promise<UserRbacAuthority | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userRbacInclude,
    });

    return user ? toUserRbacAuthority(user) : null;
  }
}
