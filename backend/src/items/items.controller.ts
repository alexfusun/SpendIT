import { Body, Controller, Get, Post } from "@nestjs/common";
import type { CreateItemDto } from "./dto/create-item.dto";
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
}
