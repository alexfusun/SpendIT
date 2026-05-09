import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";
import type { CreateItemDto } from "./dto/create-item.dto";
import type { UpdateItemDto } from "./dto/update-item.dto";
import { ItemsService } from "./items.service";

@Controller("items")
@UseGuards(FirebaseAuthGuard)
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.items.findAll(user.uid);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateItemDto) {
    return this.items.create(user.uid, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.items.update(user.uid, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.items.remove(user.uid, id);
  }
}
