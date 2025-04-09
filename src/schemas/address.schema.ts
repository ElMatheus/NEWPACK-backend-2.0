import { z } from "zod";

export const addressSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  cep: z.string(),
  street: z.string(),
  number: z.number(),
  complement: z.string().optional().nullable(),
  city: z.string(),
  neighborhood: z.string().optional().optional().nullable(),
  state: z.string(),
  freight: z.enum(["CIF", "FOB"]),
  active: z.boolean(),
});

export const createAddressSchema = z.object({
  user_id: z.string(),
  cep: z.string().length(8, "CEP must be 8 characters long"),
  street: z.string(),
  number: z.number(),
  complement: z.string().optional(),
  city: z.string(),
  neighborhood: z.string().optional(),
  state: z.string().length(2, "State must be 2 characters long"),
});

export const updateAddressSchema = z.object({
  cep: z.string().length(8, "CEP must be 8 characters long").optional(),
  street: z.string().optional(),
  number: z.number().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  state: z.string().length(2, "State must be 2 characters long").optional(),
  active: z.boolean().optional()
});

export const addressResponseSchema = z.array(addressSchema);