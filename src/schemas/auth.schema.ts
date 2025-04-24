import { z } from "zod";

export const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});


export const refreshTokenSchema = z.object({
  id: z.string(),
  expiresIn: z.number(),
  user_id: z.string(),
});

export const refreshTokensResponseSchema = z.array(refreshTokenSchema);