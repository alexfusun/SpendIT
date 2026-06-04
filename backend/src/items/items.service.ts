import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { SiItemType, SiPaymentFrequency } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateItemDto } from "./dto/create-item.dto";
import type { UpdateItemDto } from "./dto/update-item.dto";

const SI_ITEM_TYPES = new Set<string>(Object.values(SiItemType));
const PAYMENT_FREQUENCIES = new Set<string>(
  Object.values(SiPaymentFrequency),
);

const CREATABLE_TYPES = new Set<SiItemType>([
  SiItemType.bill,
  SiItemType.subscription,
]);

function parseOptionalDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }
  return d;
}

function parseRequiredDate(value: string, field: string): Date {
  if (!value) throw new BadRequestException(`${field} is required`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid date for ${field}: ${value}`);
  }
  return d;
}

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.siItem.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { id: "asc" }],
    });
  }

  async create(userId: string, dto: CreateItemDto) {
    if (!SI_ITEM_TYPES.has(dto.type)) {
      throw new BadRequestException(`Invalid type: ${dto.type}`);
    }
    const type = dto.type as SiItemType;
    if (!CREATABLE_TYPES.has(type)) {
      throw new BadRequestException(
        "Only bill and subscription can be created from this endpoint",
      );
    }
    if (!PAYMENT_FREQUENCIES.has(dto.paymentFrequency)) {
      throw new BadRequestException(
        `Invalid paymentFrequency: ${dto.paymentFrequency}`,
      );
    }
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException("amount must be a non-negative number");
    }

    const billingDate = parseRequiredDate(dto.billingDate, "billingDate");

    return this.prisma.siItem.create({
      data: {
        userId,
        type,
        subType:
          dto.subType === undefined || dto.subType === "" ? null : dto.subType,
        paymentFrequency: dto.paymentFrequency as SiPaymentFrequency,
        amount,
        billingDate,
        paid: type === SiItemType.bill ? false : null,
        notifyCancel: Boolean(dto.notifyCancel),
        notifyRenew: Boolean(dto.notifyRenew),
        notifyPay: Boolean(dto.notifyPay),
        notifyCancelDate: parseOptionalDate(dto.notifyCancelDate) ?? null,
        notifyRenewDate: parseOptionalDate(dto.notifyRenewDate) ?? null,
        notifyPayDate: parseOptionalDate(dto.notifyPayDate) ?? null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateItemDto) {
    const existing = await this.prisma.siItem.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException(`Item ${id} not found`);

    const data: Record<string, unknown> = {};

    if (dto.type !== undefined) {
      if (!CREATABLE_TYPES.has(dto.type as SiItemType)) {
        throw new BadRequestException(
          "Only bill and subscription types are allowed",
        );
      }
      data.type = dto.type;
    }
    if (dto.paymentFrequency !== undefined) {
      if (!PAYMENT_FREQUENCIES.has(dto.paymentFrequency)) {
        throw new BadRequestException(
          `Invalid paymentFrequency: ${dto.paymentFrequency}`,
        );
      }
      data.paymentFrequency = dto.paymentFrequency;
    }
    if (dto.amount !== undefined) {
      const amount = Number(dto.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException("amount must be a non-negative number");
      }
      data.amount = amount;
    }
    if ("subType" in dto) data.subType = dto.subType === "" ? null : dto.subType;
    if ("billingDate" in dto && dto.billingDate)
      data.billingDate = parseRequiredDate(dto.billingDate, "billingDate");
    if ("paid" in dto) data.paid = dto.paid ?? null;
    if (dto.notifyCancel !== undefined) data.notifyCancel = Boolean(dto.notifyCancel);
    if (dto.notifyRenew !== undefined) data.notifyRenew = Boolean(dto.notifyRenew);
    if (dto.notifyPay !== undefined) data.notifyPay = Boolean(dto.notifyPay);
    if ("notifyCancelDate" in dto)
      data.notifyCancelDate = parseOptionalDate(dto.notifyCancelDate) ?? null;
    if ("notifyRenewDate" in dto)
      data.notifyRenewDate = parseOptionalDate(dto.notifyRenewDate) ?? null;
    if ("notifyPayDate" in dto)
      data.notifyPayDate = parseOptionalDate(dto.notifyPayDate) ?? null;

    return this.prisma.siItem.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.siItem.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException(`Item ${id} not found`);
    return this.prisma.siItem.delete({ where: { id } });
  }
}
