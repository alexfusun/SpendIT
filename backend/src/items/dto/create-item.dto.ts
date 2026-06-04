/** Body for POST /items (validated in ItemsService). */
export type CreateItemDto = {
  type: string;
  subType?: string | null;
  paymentFrequency: string;
  amount: number;
  billingDate: string;
  notifyCancel: boolean;
  notifyRenew: boolean;
  notifyPay: boolean;
  notifyCancelDate?: string | null;
  notifyRenewDate?: string | null;
  notifyPayDate?: string | null;
};
