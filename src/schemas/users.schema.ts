import { z } from "zod";
import { addressResponseSchema } from "./address.schema";
import { productsResponseSchema, productsWithQuantityResponseSchema } from "./products.schema";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  full_name: z.string(),
  Address: addressResponseSchema,
  products: productsResponseSchema.optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  full_name: z.string().min(1, "Full name cannot be empty"),
  password: z.string().min(3, "Password must be at least 3 characters long"),
  isAdmin: z.boolean().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  full_name: z.string().min(1, "Full name cannot be empty").optional(),
  password: z.string().min(3, "Password must be at least 3 characters long").optional(),
});

export const usersResponseSchema = z.array(userSchema);