import { ClerkClient, User } from '@clerk/backend';
import { Inject, Injectable } from '@nestjs/common';
import { PageDto } from '../../../common/dto/page.dto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { UserQueryDto } from '../dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
  ) { }

  async getUsers(query: UserQueryDto): Promise<PageDto<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const offset = (page - 1) * limit;

    const result = await this.clerkClient.users.getUserList({
      limit,
      offset,
    });

    return {
      items: result.data,
      meta: {
        page,
        limit,
        total: result.totalCount,
        totalPages: Math.ceil(result.totalCount / limit),
      }
    }
  }
}

