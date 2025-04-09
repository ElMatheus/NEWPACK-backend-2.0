import { z } from "zod";

export const productImageSchema = z.object({
  id: z.number(),
  productId: z.number(),
  image_url: z.string(),
});

export const createProductImageSchema = z.object({
  productId: z.number().min(1, { message: "Product ID cannot be empty" }),
  image_url: z.string().min(1, { message: "Image URL cannot be empty" }),
});

export const updateProductImageSchema = z.object({
  productId: z.number().min(1, { message: "Product ID cannot be empty" }).optional(),
  image_url: z.string().min(1, { message: "Image URL cannot be empty" }).optional(),
});

// export const updateProductSchema = z.object({
//   name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
//   toughness: z.string().min(1, { message: "Toughness cannot be empty" }).optional().nullable(),
//   dimension: z.string().min(1, { message: "Dimension cannot be empty" }).optional().nullable(),
//   type: z.enum(["caixa", "rolo", "unidade"]).optional(),
//   category: z.enum(["cliches", "facas_rotativas", "facas_planas", "facas_graficas", "outros"]).optional(),
//   description: z.string().min(1, { message: "Description cannot be empty" }).optional(),
//   unit_quantity: z.number().optional().nullable().optional(),
//   unit_value: z.number().optional()
// });

export const productsImagesResponseSchema = z.array(productImageSchema);