import { z } from "zod";

export const whatsappStatusSchema = z.object({
  status: z.string().optional().nullable(),
  message: z.string(),
});

export const whatsappConnectSchema = z.object({
  qr: z.string().url().nullable(),
  message: z.string(),
});