import { z } from "zod";

export const whatsappStatusSchema = z.object({
  status: z.enum(["ok", "error"]),
  instance: z.string(),
  connected: z.string(),
  details: z.array(z.string()).optional(),
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