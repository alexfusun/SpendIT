/** Body for PATCH /items/:id (all fields optional, validated in ItemsService). */
export type UpdateItemDto = {
  type?: string;
  subType?: string | null;
  paymentFrequency?: string;
  amount?: number;
  billingDate?: string | null;
  paid?: boolean | null;
  notifyCancel?: boolean;
  notifyRenew?: boolean;
  notifyPay?: boolean;
  notifyCancelDate?: string | null;
  notifyRenewDate?: string | null;
  notifyPayDate?: string | null;
};
