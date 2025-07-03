import { z } from "zod";
import { productsImagesResponseSchema } from "./products_images.schema";

export const productSchema = z.object({
  id: z.number().optional().nullable(),
  name: z.string().min(1, { message: "Name cannot be empty" }),
  toughness: z.string().min(1, { message: "Toughness cannot be empty" }).optional().nullable(),
  dimension: z.string().min(1, { message: "Dimension cannot be empty" }).optional().nullable(),
  type: z.enum(["caixa", "rolo", "unidade"]),
  category: z.enum(["cliches", "facas_rotativas", "facas_planas", "facas_graficas", "outros"]),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  unit_quantity: z.number().optional().nullable(),
  unit_value: z.number(),
  Product_image: productsImagesResponseSchema.optional()
});

export const productSchema2 = z.object({
  id: z.number().optional().nullable(),
  name: z.string().min(1, { message: "Name cannot be empty" }),
  toughness: z.string().min(1, { message: "Toughness cannot be empty" }).optional().nullable(),
  dimension: z.string().min(1, { message: "Dimension cannot be empty" }).optional().nullable(),
  type: z.enum(["caixa", "rolo", "unidade"]),
  category: z.enum(["cliches", "facas_rotativas", "facas_planas", "facas_graficas", "outros"]),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  unit_quantity: z.number().optional().nullable(),
  Product_image: productsImagesResponseSchema.optional(),
  Order_details: z.array(z.object({
    id: z.string().optional().nullable(),
  }).optional().nullable(),
  ).optional().nullable(),
});

export const productWithQuantitySchema = z.object({
  id: z.number().optional().nullable(),
  order_details_id: z.string().optional().nullable(),
  name: z.string().min(1, { message: "Name cannot be empty" }),
  toughness: z.string().min(1, { message: "Toughness cannot be empty" }).optional().nullable(),
  dimension: z.string().min(1, { message: "Dimension cannot be empty" }).optional().nullable(),
  type: z.enum(["caixa", "rolo", "unidade"]),
  category: z.enum(["cliches", "facas_rotativas", "facas_planas", "facas_graficas", "outros"]),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  unit_quantity: z.number().optional().nullable(),
  unit_value: z.number(),
  quantity: z.number(),
  order_date: z.date(),
  order_status: z.string(),
  image: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
  toughness: z.string().min(1, { message: "Toughness cannot be empty" }).optional().nullable(),
  dimension: z.string().min(1, { message: "Dimension cannot be empty" }).optional().nullable(),
  type: z.enum(["caixa", "rolo", "unidade"]).optional(),
  category: z.enum(["cliches", "facas_rotativas", "facas_planas", "facas_graficas", "outros"]).optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }).optional(),
  unit_quantity: z.number().optional().nullable().optional(),
  unit_value: z.number().optional()
});

export const allProductsSchema = z.object({
  products: z.array(productSchema2),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  })
});

export const productsResponseSchema = z.array(productSchema);
export const productsWithQuantityResponseSchema = z.array(productWithQuantitySchema);