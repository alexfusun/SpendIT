import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import type { SiItem } from "@prisma/client";

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "SpendIT <onboarding@resend.dev>";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildHtml(opts: {
  title: string;
  preheader: string;
  body: string;
  amount: number;
  frequency: string;
  type: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #E5E5EA;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#3B82F6;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-weight:700;font-size:18px;line-height:36px;">$</span>
                </td>
                <td style="padding-left:10px;font-size:15px;font-weight:600;color:#1D1D1F;vertical-align:middle;">SpendIT</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:0 32px 16px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#1D1D1F;line-height:1.3;">${opts.title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0;font-size:15px;color:#3A3A3C;line-height:1.6;">${opts.body}</p>
          </td>
        </tr>

        <!-- Item details -->
        <tr>
          <td style="padding:0 32px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:12px;padding:16px;">
              <tr>
                <td style="color:#6E6E73;font-size:13px;padding:4px 0;">Type</td>
                <td style="color:#1D1D1F;font-size:13px;font-weight:600;text-align:right;padding:4px 0;">${capitalize(opts.type)}</td>
              </tr>
              <tr>
                <td style="color:#6E6E73;font-size:13px;padding:4px 0;">Amount</td>
                <td style="color:#1D1D1F;font-size:13px;font-weight:600;text-align:right;padding:4px 0;">${USD.format(opts.amount)}</td>
              </tr>
              <tr>
                <td style="color:#6E6E73;font-size:13px;padding:4px 0;">Frequency</td>
                <td style="color:#1D1D1F;font-size:13px;font-weight:600;text-align:right;padding:4px 0;">${capitalize(opts.frequency)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #F2F2F7;">
            <p style="margin:0;font-size:12px;color:#AEAEB2;text-align:center;">
              You received this because you enabled reminders in SpendIT.<br>
              Log in to update or remove your reminders.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendCancelNotification(
    email: string,
    displayName: string | null,
    item: SiItem,
  ): Promise<void> {
    const name = item.subType ?? capitalize(item.type);
    const greeting = displayName ? `Hi ${displayName},` : "Hi,";
    const { error } = await this.resend.emails.send({
      from: FROM,
      to: email,
      subject: `Cancellation reminder — ${name}`,
      html: buildHtml({
        title: "Cancellation Reminder",
        preheader: `Your ${name} is scheduled for cancellation review.`,
        body: `${greeting} this is your reminder that your <strong>${name}</strong> is due for cancellation. Review it now to confirm or keep it active.`,
        amount: item.amount,
        frequency: item.paymentFrequency,
        type: item.type,
      }),
    });
    if (error) {
      this.logger.error(
        `Failed to send cancel notification for item ${item.id}: ${error.message}`,
      );
      throw error;
    }
    this.logger.log(
      `Cancel notification sent for item ${item.id} → ${email}`,
    );
  }

  async sendRenewNotification(
    email: string,
    displayName: string | null,
    item: SiItem,
  ): Promise<void> {
    const name = item.subType ?? capitalize(item.type);
    const greeting = displayName ? `Hi ${displayName},` : "Hi,";
    const { error } = await this.resend.emails.send({
      from: FROM,
      to: email,
      subject: `Renewal reminder — ${name}`,
      html: buildHtml({
        title: "Renewal Reminder",
        preheader: `Your ${name} is coming up for renewal.`,
        body: `${greeting} your <strong>${name}</strong> is up for renewal. Make sure your payment method is ready or decide whether to continue the subscription.`,
        amount: item.amount,
        frequency: item.paymentFrequency,
        type: item.type,
      }),
    });
    if (error) {
      this.logger.error(
        `Failed to send renew notification for item ${item.id}: ${error.message}`,
      );
      throw error;
    }
    this.logger.log(
      `Renewal notification sent for item ${item.id} → ${email}`,
    );
  }

  async sendPayNotification(
    email: string,
    displayName: string | null,
    item: SiItem,
  ): Promise<void> {
    const name = item.subType ?? capitalize(item.type);
    const greeting = displayName ? `Hi ${displayName},` : "Hi,";
    const { error } = await this.resend.emails.send({
      from: FROM,
      to: email,
      subject: `Payment reminder — ${name}`,
      html: buildHtml({
        title: "Payment Reminder",
        preheader: `${USD.format(item.amount)} due for ${name}.`,
        body: `${greeting} your <strong>${name}</strong> payment of <strong>${USD.format(item.amount)}</strong> is due. Please make sure your payment goes through on time.`,
        amount: item.amount,
        frequency: item.paymentFrequency,
        type: item.type,
      }),
    });
    if (error) {
      this.logger.error(
        `Failed to send pay notification for item ${item.id}: ${error.message}`,
      );
      throw error;
    }
    this.logger.log(
      `Payment notification sent for item ${item.id} → ${email}`,
    );
  }
}
