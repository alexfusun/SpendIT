import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    (ctx.switchToHttp().getRequest<Request & { user: AuthUser }>()).user,
);
