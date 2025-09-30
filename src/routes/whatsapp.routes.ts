import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { whatsappStatusSchema, whatsappSendMessageSchema, whatsappErrorSchema } from "../schemas/whatsapp.schema";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { prisma } from "../database/prisma-client";
import axios from "axios";

export async function whatsappRouter(app: FastifyTypedInstance) {
  app.get("/status", {
    schema: {
      tags: ["whatsapp"],
      description: "Check Evolution API instance status",
      response: {
        200: whatsappStatusSchema,
        404: whatsappErrorSchema,
        400: whatsappErrorSchema,
      },
    }
  }, async (request, reply) => {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
    const AUTHENTICATION_API_KEY = process.env.AUTHENTICATION_API_KEY;

    if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE || !AUTHENTICATION_API_KEY) {
      return reply.status(400).send({
        error: "Evolution API not configured",
        message: "Please set the EVOLUTION_API_URL, EVOLUTION_INSTANCE, and AUTHENTICATION_API_KEY environment variables",
      });
    }

    try {
      const { data } = await axios.get(
        `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
        {
          headers: { apikey: AUTHENTICATION_API_KEY }
        }
      );

      return reply.status(200).send({
        status: "ok",
        instance: data.instance.instanceName,
        connected: data.instance.state,
      });
    } catch (error: any) {
      if (error.response) {
        console.error("Error response from Evolution API:", error.response.data);
        return reply.status(404).send({
          error: "Instance not found",
          message: error.response.data.error,
          details: error.response.data.response ? error.response.data.response.message : undefined,
        });
      }
    }
  });

  app.post("/send-message", {
    preHandler: [ensureAuthenticated],
    schema: {
      tags: ["whatsapp"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Send a message via WhatsApp",
      body: z.object({
        orderId: z.string().min(1, "Order cannot be empty"),
      }),
      response: {
        200: whatsappSendMessageSchema,
        503: whatsappErrorSchema,
      },
    }
  }, async (request, reply) => {
    const { orderId } = request.body;
    const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
    const WHATSAPP_CHAT_ID = process.env.WHATSAPP_CHAT_ID;

    try {
      if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE) {
        return reply.status(400).send({
          error: "Evolution API not configured",
          message: "Please set the EVOLUTION_API_URL and EVOLUTION_INSTANCE environment variables",
        });
      }

      if (!WHATSAPP_CHAT_ID) {
        return reply.status(400).send({
          error: "WhatsApp chat ID not configured",
          message: "Please set the WHATSAPP_CHAT_ID environment variable",
        });
      }

      const order = await prisma.order.findFirst({
        where: { id: orderId },
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

      const message = `🔔 *NOVO PEDIDO* 🔔

      📦 *Pedido Nº:* ${order.id}
      👥 *Cliente:* ${order.client.name}
      ${order.description ? `📝 *Descrição:* ${order.description}` : ''}

      *PRODUTOS:*
      ${order.Order_details.map(detail =>
        `➡️ ID: ${detail.product.id} | ${detail.product.name} | Dimensão: ${detail.product.dimension || 'N/A'} | ShoreA: ${detail.product.toughness || 'N/A'} | Qtd: ${detail.quantity}`
      ).join('\n')}

      💬 *Mais informações disponíveis no email*`
      try {
        await axios.post(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
          {
            number: WHATSAPP_CHAT_ID,
            text: message,
          },
          {
            headers: {
              'apikey': process.env.AUTHENTICATION_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        return reply.status(200).send({
          status: "success",
          message: "Message sent successfully",
        });
      } catch (error: any) {
        if (error.response) {
          console.error("Error response from Evolution API:", error.response.data);
          return reply.status(503).send({
            error: "Failed to send message",
            message: error.response.data.error,
            details: error.response.data.response.message,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      return reply.status(400).send({
        error: "Failed to send message",
        message: "Failed to send message",
      });
    }
  }
  )
};
