import { z } from "zod";

export const whatsappStatusSchema = z.object({
  status: z.string().optional().nullable(),
  message: z.string(),
});

export const whatsappConnectSchema = z.object({
  qr: z.string().url().nullable(),
  message: z.string(),
});

export const whatsappSendMessageSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export const whatsappErrorSchema = z.object({
  error: z.string().optional(),
  message: z.string(),
  details: z.any().optional(),
});