import { BadRequestException, Injectable } from "@nestjs/common";
import { SiItemType, SiPaymentFrequency } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateItemDto } from "./dto/create-item.dto";

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
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }
  return d;
}

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.siItem.findMany({
      orderBy: [{ type: "asc" }, { id: "asc" }],
    });
  }

  async create(dto: CreateItemDto) {
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

    const notifyCancelDate = parseOptionalDate(dto.notifyCancelDate);
    const notifyRenewDate = parseOptionalDate(dto.notifyRenewDate);
    const notifyPayDate = parseOptionalDate(dto.notifyPayDate);

    return this.prisma.siItem.create({
      data: {
        type,
        subType:
          dto.subType === undefined || dto.subType === ""
            ? null
            : dto.subType,
        paymentFrequency: dto.paymentFrequency as SiPaymentFrequency,
        amount,
        notifyCancel: Boolean(dto.notifyCancel),
        notifyRenew: Boolean(dto.notifyRenew),
        notifyPay: Boolean(dto.notifyPay),
        notifyCancelDate: notifyCancelDate ?? null,
        notifyRenewDate: notifyRenewDate ?? null,
        notifyPayDate: notifyPayDate ?? null,
      },
    });
  }
}
