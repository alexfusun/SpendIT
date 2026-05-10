import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkDueNotifications(): Promise<void> {
    const now = new Date();

    const dueItems = await this.prisma.siItem.findMany({
      where: {
        userId: { not: "" },
        OR: [
          { notifyCancel: true, notifyCancelDate: { not: null, lte: now } },
          { notifyRenew: true, notifyRenewDate: { not: null, lte: now } },
          { notifyPay: true, notifyPayDate: { not: null, lte: now } },
        ],
      },
    });

    if (dueItems.length === 0) return;

    this.logger.log(`Found ${dueItems.length} item(s) with due notifications`);

    for (const item of dueItems) {
      const user = await this.prisma.user.findUnique({
        where: { id: item.userId },
        select: { email: true, displayName: true },
      });

      if (!user?.email) {
        this.logger.warn(`No user/email found for item ${item.id}, skipping`);
        continue;
      }

      const clearFields: Record<string, null> = {};

      if (item.notifyCancel && item.notifyCancelDate && item.notifyCancelDate <= now) {
        try {
          await this.notifications.sendCancelNotification(
            user.email,
            user.displayName,
            item,
          );
          clearFields.notifyCancelDate = null;
        } catch {
          this.logger.error(`Cancel email failed for item ${item.id}`);
        }
      }

      if (item.notifyRenew && item.notifyRenewDate && item.notifyRenewDate <= now) {
        try {
          await this.notifications.sendRenewNotification(
            user.email,
            user.displayName,
            item,
          );
          clearFields.notifyRenewDate = null;
        } catch {
          this.logger.error(`Renewal email failed for item ${item.id}`);
        }
      }

      if (item.notifyPay && item.notifyPayDate && item.notifyPayDate <= now) {
        try {
          await this.notifications.sendPayNotification(
            user.email,
            user.displayName,
            item,
          );
          clearFields.notifyPayDate = null;
        } catch {
          this.logger.error(`Payment email failed for item ${item.id}`);
        }
      }

      if (Object.keys(clearFields).length > 0) {
        await this.prisma.siItem.update({
          where: { id: item.id },
          data: clearFields,
        });
      }
    }
  }
}
