import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/current-user.decorator";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(user: AuthUser) {
    return this.prisma.user.upsert({
      where: { id: user.uid },
      create: {
        id: user.uid,
        email: user.email ?? "",
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
      update: {
        email: user.email ?? "",
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
    });
  }
}
