import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { FirebaseService } from "../firebase/firebase.service";
import type { AuthUser } from "./current-user.decorator";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const decoded = await this.firebase.verifyIdToken(auth.slice(7));
      const user: AuthUser = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        displayName: (decoded.name as string | undefined) ?? null,
        photoUrl: (decoded.picture as string | undefined) ?? null,
      };
      (req as Request & { user: AuthUser }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
