import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { whatsappStatusSchema, whatsappConnectSchema } from "../schemas/whatsapp.schema";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";
import { prisma } from "../database/prisma-client";
import axios from "axios";

export async function whatsappRouter(app: FastifyTypedInstance) {
  app.post("/send-message", {
    schema: {
      tags: ["whatsapp"],
      description: "Send a message via WhatsApp",
      body: z.object({
        orderId: z.string().min(1, "Order cannot be empty"),
      }),
      response: {
        200: z.object({
          status: z.string(),
          message: z.string(),
        }),
        400: z.object({
          error: z.string().optional(),
          message: z.string(),
        }),
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

      // const order = await prisma.order.findFirst({
      //   where: { id: orderId },
      //   include: {
      //     Order_details: {
      //       include: { product: true }
      //     },
      //     client: {
      //       include: { Address: { where: { active: true } } }
      //     }
      //   }
      // });

      // if (!order) {
      //   return reply.status(400).send({
      //     error: "Order not found",
      //     message: "Order with this id not found",
      //   });
      // }


//       const message = `🔔 *NOVO PEDIDO* 🔔

// 📦 *Pedido Nº:* ${order.id}
// 👥 *Cliente:* ${order.client.name}
// ${order.description ? `📝 *Descrição:* ${order.description}` : ''}

// *PRODUTOS:*
// ${order.Order_details.map(detail =>
//         `➡️ ID: ${detail.product.id} | ${detail.product.name} | Dimensão: ${detail.product.dimension || 'N/A'} | ShoreA: ${detail.product.toughness || 'N/A'} | Qtd: ${detail.quantity}`
//       ).join('\n')}

// 💬 *Mais informações disponíveis no email*`

      const evolutionResponse = await axios.post(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
        {
          number: WHATSAPP_CHAT_ID,
          text: "message",
        },
        {
          headers: {
            'apikey': process.env.AUTHENTICATION_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (evolutionResponse.status === 200 || evolutionResponse.status === 201) {
        return reply.status(200).send({
          status: "success",
          message: "Message sent successfully",
        });
      } else {
        return reply.status(400).send({
          error: "Evolution API returned unexpected status",
          message: `Evolution API returned status: ${evolutionResponse.status}`,
        });
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
