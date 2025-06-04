import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { emailSchema, newEmailSchema } from "../schemas/emails.schema";
import { prisma } from "../database/prisma-client";
import { formattedDate } from "../helpers/formattedDate";
import { formatCurrency } from "../helpers/format_currency";
import { formatCEP } from "../helpers/format_cep";
import EmailService from "../utils/sendEmail";
import { SendEmailType, SendConfirmationEmailType } from '../types/Email';
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";

export async function emailRouter(app: FastifyTypedInstance) {
  app.post("/:idOrder", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["email"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Create a new email",
      body: emailSchema,
      params: z.object({
        idOrder: z.string().describe("Order ID"),
      }).describe("Path Parameters"),
      response: {
        201: z.object({
          message: z.string().describe("Message"),
          data: newEmailSchema,
        }).describe("Email Sent"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (request, reply) => {
    const { idOrder } = request.params;
    const { name, telephone, hasNotification } = request.body;
    try {
      const order = await prisma.order.findFirst({
        where: { id: idOrder },
        include: {
          Order_details: {
            include: { product: true }
          },
          client: {
            include: { Address: { where: { active: true } } }
          }
        }
      });

      if (!order) {
        return reply.status(400).send({
          error: "Order not found",
          message: "Order with this id not found",
        });
      }

      const address = order.client.Address[0];
      if (!address) {
        return reply.status(400).send({
          error: "Address not found",
          message: "Client does not have an active address",
        });
      }

      const total = order.Order_details.reduce((sum, item) => sum + item.full_price, 0);

      const emailData: SendEmailType = {
        id_pedido: order.id,
        numero_pedido: order.order_number,
        data_pedido: formattedDate(order.order_date),
        status_pedido: order.status,
        descricao_pedido: order.description ?? null,
        parcelas_pedido: order.installment,
        valor_parcelas_pedido: formatCurrency(total / order.installment),
        preco_total_pedido: formatCurrency(total),
        id_cliente: order.client_id,
        apelido_cliente: order.client.name,
        nome_cliente: order.client.full_name,
        infosClient: { name, telephone },
        infosAddress: {
          cep: formatCEP(Number(address.cep)),
          street: address.street,
          number: address.number,
          city: address.city,
          state: address.state,
          freight: address.freight,
          complement: address.complement ?? null,
          neighborhood: address.neighborhood ?? null
        },
        products: order.Order_details.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          toughness: item.product.toughness,
          dimension: item.product.dimension,
          type: item.product.type,
          category: item.product.category,
          description: item.product.description,
          unit_quantity: item.product.unit_quantity,
          unit_value: item.product.unit_value,
          full_price: formatCurrency(item.full_price),
        })),
        hasNotification: hasNotification
      };

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.RECEIVE_EMAIL_USER) {
        return reply.status(500).send({
          error: "Email configuration error",
          message: "Email configuration is missing",
        });
      }

      await EmailService.sendEmail(emailData);

      return reply.status(201).send({
        message: "Email sent successfully",
        data: emailData
      });

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });

  app.post("/order-confirmation/:idOrder", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["email"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Send order confirmation email",
      params: z.object({
        idOrder: z.string().describe("Order ID"),
      }).describe("Path Parameters"),
      response: {
        201: z.object({
          message: z.string().describe("Message")
        }).describe("Email Sent"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (request, reply) => {
    const { idOrder } = request.params;

    try {
      const order = await prisma.order.findFirst({
        where: { id: idOrder },
        include: {
          client: true,
        }
      });
      if (!order) {
        return reply.status(400).send({
          error: "Order not found",
          message: "Order with this id not found",
        });
      }

      if (order.status !== "Concluído") {
        return reply.status(400).send({
          error: "Order not confirmed",
          message: "Order is not confirmed",
        });
      }

      if (!order.client.email) {
        return reply.status(400).send({
          error: "Client email not found",
          message: "Client does not have an email",
        });
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return reply.status(500).send({
          error: "Email configuration error",
          message: "Email configuration is missing",
        });
      }

      const emailData: SendConfirmationEmailType = {
        order_id: order.id,
        client_name: order.client.name,
        client_email: order.client.email,
      };

      await EmailService.sendOrderConfirmationEmail(emailData);

      return reply.status(201).send({
        message: "Confirmation email sent successfully",
      });

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  })
}
