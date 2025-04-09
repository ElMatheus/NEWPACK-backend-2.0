import { z } from "zod";

export const emailSchema = z.object({
  name: z.string(),
  telephone: z.string(),
});

export const newEmailSchema = z.object({
  numero_pedido: z.number(),
  apelido_cliente: z.string(),
  id_cliente: z.string(),
  nome_cliente: z.string(),
  id_pedido: z.string(),
  data_pedido: z.string(),
  status_pedido: z.string(),
  descricao_pedido: z.string().optional().nullable(),
  preco_total_pedido: z.string(),
  parcelas_pedido: z.number(),
  valor_parcelas_pedido: z.string(),
  infosAddress: z.object({
    cep: z.string(),
    street: z.string(),
    number: z.number(),
    city: z.string(),
    state: z.string(),
    neighborhood: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
    freight: z.string(),
  }),
  products: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      toughness: z.string().optional().nullable(),
      dimension: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      type: z.string(),
      category: z.string(),
      quantity: z.number(),
      unit_quantity: z.number().optional().nullable(),
      unit_value: z.number(),
      full_price: z.string(),
    })
  ),
  infosClient: z.object({
    name: z.string(),
    telephone: z.string(),
  }),
});