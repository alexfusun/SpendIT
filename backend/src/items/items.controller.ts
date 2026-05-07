import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type { CreateItemDto } from "./dto/create-item.dto";
import type { UpdateItemDto } from "./dto/update-item.dto";
import { ItemsService } from "./items.service";

@Controller("items")
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list() {
    return this.items.findAll();
  }

  @Post()
  create(@Body() body: CreateItemDto) {
    return this.items.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateItemDto) {
    return this.items.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.items.remove(id);
  }
}