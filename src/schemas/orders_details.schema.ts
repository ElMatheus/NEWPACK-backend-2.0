import { z } from "zod";
import { productSchema } from "./products.schema";

export const orderDetailsSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  product_id: z.number(),
  quantity: z.number(),
  full_price: z.number(),
});

export const orderDetailsWithProductsSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  product_id: z.number(),
  quantity: z.number(),
  full_price: z.number(),
  product: productSchema,
});

export const createOrderDetailsSchema = z.object({
  order_id: z.string().min(1, "Order ID cannot be empty"),
  product_id: z.number().min(1, "Product ID cannot be empty"),
  quantity: z.number().min(1, "Quantity cannot be empty")
});

export const ordersDetailsResponseSchema = z.array(orderDetailsSchema);