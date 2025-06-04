import z from "zod";
import qrcode from "qrcode";
import { FastifyTypedInstance } from "../types/Server";
import { whatsappStatusSchema, whatsappConnectSchema } from "../schemas/whatsapp.schema";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";
import { Client } from "whatsapp-web.js";
import { prisma } from "../database/prisma-client";

let latestQrCode: string | null = null;
let reasonDisconnect: string | null = null;

const client = new Client({
  takeoverOnConflict: true,
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', async (qr) => {
  latestQrCode = await qrcode.toDataURL(qr);
})

client.on('ready', () => {
  latestQrCode = null;
  reasonDisconnect = null;
})

client.on('disconnected', (reason) => {
  reasonDisconnect = reason;
  latestQrCode = null;
});

client.initialize();

export async function whatsappRouter(app: FastifyTypedInstance) {
  app.get("/connect", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["whatsapp"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Connect to WhatsApp",
      response: {
        200: whatsappConnectSchema,
        400: whatsappConnectSchema
      },
    },
  }, async (request, reply) => {
    try {
      const state = await client.getState();

      if (state == "CONNECTED") {
        return reply.status(200).send({
          message: "WhatsApp already connected",
          qr: null,
        });
      }

      if (!latestQrCode) {
        return reply.status(400).send({
          message: "QR code not generated yet",
          qr: null,
        });
      }
      return reply.status(200).send({
        message: "QR code generated successfully",
        qr: latestQrCode,
      });
    } catch (error) {
      console.error("Error getting state: ", error);
      return reply.status(400).send({
        message: "Error getting state",
        qr: null,
      });
    }
  });

  app.get("/status", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["whatsapp"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Get WhatsApp connection status",
      response: {
        200: whatsappStatusSchema,
        400: whatsappStatusSchema
      },
    },
  }, async (request, reply) => {
    try {
      const state = await client.getState();
      if (state === "CONNECTED") {
        return reply.status(200).send({
          status: "connected",
          message: `WhatsApp is connected on ${client.info.wid.user}`,
        });
      }

      if (state == null && reasonDisconnect) {
        return reply.status(200).send({
          status: "disconnected",
          message: `WhatsApp is disconnected. Reason: ${reasonDisconnect}`,
        });
      }

      return reply.status(200).send({
        status: state,
        message: "WhatsApp is not connected",
      });
    } catch (error) {
      console.error("Error getting WhatsApp status:", error);
      return reply.status(400).send({
        status: null,
        message: "Error getting WhatsApp status",
      });
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
        orderId: z.string().min(1, "Message cannot be empty"),
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

    try {
      const state = await client.getState();
      if (state !== "CONNECTED") {
        return reply.status(503).send({
          error: "WhatsApp is not connected",
          message: "Please connect WhatsApp first",
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

      if (!process.env.WHATSAPP_CHAT_ID) {
        return reply.status(400).send({
          error: "WhatsApp chat ID not configured",
          message: "Please set the WHATSAPP_CHAT_ID environment variable",
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
      await client.sendMessage(process.env.WHATSAPP_CHAT_ID, message);
      return reply.status(200).send({
        status: "success",
        message: "Message sent successfully",
      });
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