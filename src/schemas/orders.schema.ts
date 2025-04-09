import { z } from "zod";
import { userSchema } from "./users.schema";

export const orderSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  order_date: z.date(),
  status: z.string(),
  description: z.string().optional().nullable(),
  installment: z.number(),
  order_number: z.number(),
  Order_details: z.array(
    z.object({
      id: z.string(),
      product_id: z.number(),
      quantity: z.number(),
      full_price: z.number(),
    })
  ),
  client: userSchema,
});

export const orderSchemaWithoutDetails = z.object({
  id: z.string(),
  client_id: z.string(),
  order_date: z.date(),
  status: z.string(),
  description: z.string().optional().nullable(),
  installment: z.number(),
  order_number: z.number()
});

export const createOrderSchema = z.object({
  client_id: z.string().min(1, "Client ID cannot be empty"),
  status: z.string().min(1, "Status cannot be empty"),
  description: z.string().optional().nullable(),
  installment: z.number().min(1, "Installment cannot be empty"),
});

export const updateOrderSchema = z.object({
  client_id: z.string().min(1, "Client ID cannot be empty").optional(),
  order_date: z.string().datetime({ message: "Invalid order_date format" }).optional(),
  status: z.string().min(1, "Status cannot be empty").optional(),
  description: z.string().optional().nullable(),
  installment: z.number().min(1, "Installment cannot be empty").optional(),
});

export const ordersResponseSchema = z.array(orderSchema);