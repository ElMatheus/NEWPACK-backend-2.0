import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { orderSchema, ordersResponseSchema, createOrderSchema, updateOrderSchema, orderSchemaWithoutDetails } from "../schemas/orders.schema";
import { prisma } from "../database/prisma-client";
import { nanoid } from "nanoid";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function ordersRouter(app: FastifyTypedInstance) {
  app.get("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["orders"],
      security: [
        { bearerAuth: [] }
      ],
      description: "Get all orders",
      querystring: z.object({
        user_id: z.string().optional().describe("User ID"),
      }),
      response: {
        200: ordersResponseSchema,
        401: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Unauthorized"),
      }
    },
  }, async (require, reply) => {
    const { user_id } = require.query as { user_id?: string };

    if (user_id) {
      const userExists = await prisma.user.findUnique({
        where: {
          id: user_id,
        },
      });

      if (!userExists) {
        return reply.status(401).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      const orders = await prisma.order.findMany({
        where: { client_id: user_id },
        orderBy: { order_date: 'desc' },
        include: {
          Order_details: {
            include: { product: true }
          },
          client: {
            include: { Address: { where: { active: true } } }
          }
        },
      });

      return reply.status(200).send(orders);
    }

    const orders = await prisma.order.findMany({
      orderBy: { order_date: 'desc' },
      include: {
        Order_details: {
          include: { product: true }
        },
        client: {
          include: { Address: { where: { active: true } } }
        }
      },
    });

    return reply.status(200).send(orders);
  }
  );

  app.get("/:id", {
    preHandler: [ensureAuthenticated],
    schema: {
      tags: ["orders"],
      security: [
        { bearerAuth: [] }
      ],
      description: "Get a order by ID",
      params: z.object({
        id: z.string().describe("Order ID"),
      }),
      response: {
        200: orderSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    }
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const order = await prisma.order.findUnique({
        where: {
          id,
        },
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
        return reply.status(404).send({
          error: "Order not found",
          message: "Order with this ID does not exist",
        });
      }

      return reply.status(200).send(order);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  }
  );

  app.post("/", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["orders"],
      security: [
        { bearerAuth: [] }
      ],
      description: "Create a new order",
      body: createOrderSchema,
      response: {
        201: z.object({
          message: z.string().describe("Message"),
          data: orderSchemaWithoutDetails,
        }).describe("Order Created"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { client_id, status, description, installment } = require.body;

    try {
      const userExists = await prisma.user.findUnique({
        where: {
          id: client_id,
        },
      });

      if (!userExists) {
        return reply.status(400).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      const lastOrder = await prisma.order.findFirst({
        where: { client_id },
        orderBy: { order_number: 'desc' },
      });

      const nextOrderNumber = lastOrder ? lastOrder.order_number + 1 : 1;

      const order = await prisma.order.create({
        data: {
          id: nanoid(),
          client_id,
          status,
          description,
          installment,
          order_number: nextOrderNumber,
        },
      });

      return reply.status(201).send({
        message: `Order ${order.id} created successfully`,
        data: order,
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });

  app.delete("/:id", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["orders"],
      security: [
        { bearerAuth: [] }
      ],
      description: "Delete a order",
      params: z.object({
        id: z.string().describe("Order ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("Order Deleted"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const order = await prisma.order.findUnique({
        where: {
          id,
        },
      });

      if (!order) {
        return reply.status(404).send({
          error: "Order not found",
          message: "Order with this ID does not exist",
        });
      }

      await prisma.order.delete({
        where: {
          id,
        },
      });

      return reply.status(200).send({
        message: `Order ${order.id} deleted`,
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });

  app.put("/:id", {
    preHandler: [ensureAuthenticated],
    schema: {
      tags: ["orders"],
      security: [
        { bearerAuth: [] }
      ],
      description: "Update a order",
      body: updateOrderSchema,
      params: z.object({
        id: z.string().describe("Order ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          data: orderSchemaWithoutDetails,
        }).describe("Order Updated"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { client_id, order_date, status, description, installment } = require.body;

    try {
      const order = await prisma.order.findUnique({
        where: {
          id,
        },
      });

      if (!order) {
        return reply.status(404).send({
          error: "Order not found",
          message: "Order with this ID does not exist",
        });
      }

      if (client_id) {
        const userExists = await prisma.user.findUnique({
          where: {
            id: client_id,
          },
        });

        if (!userExists) {
          return reply.status(400).send({
            error: "User not found",
            message: "User with this ID does not exist",
          });
        }
      }

      const orderData = await prisma.order.update({
        where: {
          id: id,
        },
        data: {
          client_id,
          order_date: order_date ? new Date(order_date) : undefined,
          status,
          description,
          installment,
        },
      });

      return reply.status(201).send({
        message: `Order ${orderData.id} updated successfully`,
        data: orderData,
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  }
  );
}