import { Controller, Post, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";
import { UsersService } from "./users.service";

@Controller("auth")
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post("me")
  syncMe(@CurrentUser() user: AuthUser) {
    return this.users.upsert(user);
  }
}
