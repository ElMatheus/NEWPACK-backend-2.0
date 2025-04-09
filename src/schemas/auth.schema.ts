import { z } from "zod";

export const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});
