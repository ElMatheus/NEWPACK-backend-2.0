import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { orderDetailsSchema, ordersDetailsResponseSchema, createOrderDetailsSchema, orderDetailsWithProductsSchema } from "../schemas/orders_details.schema";
import { prisma } from "../database/prisma-client";
import { nanoid } from "nanoid";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function ordersDetailsRouter(app: FastifyTypedInstance) {
  app.get("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["orders_details"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Get all orders_details",
      response: {
        200: ordersDetailsResponseSchema
      }
    },
  }, async (require, reply) => {
    const orders_details = await prisma.order_details.findMany({
      select: {
        id: true,
        order_id: true,
        product_id: true,
        quantity: true,
        full_price: true
      }
    });

    return reply.status(200).send(orders_details);
  }
  );

  app.get("/:id", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["orders_details"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Get a orders_details by ID",
      params: z.object({
        id: z.string().describe("Order_details ID"),
      }),
      response: {
        200: orderDetailsWithProductsSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    }
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const order_details = await prisma.order_details.findUnique({
        where: {
          id,
        },
        include: {
          product: {
            include: {
              Product_image: true,
            }
          },
          order: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!order_details) {
        return reply.status(404).send({
          error: "Order_details not found",
          message: "Order_details with this ID does not exist",
        });
      }

      return reply.status(200).send(order_details);

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
      tags: ["orders_details"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Create a new order_details",
      body: createOrderDetailsSchema,
      response: {
        201: z.object({
          message: z.string().describe("Message"),
          data: orderDetailsSchema,
        }).describe("Order Details Created"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { order_id, product_id, quantity } = require.body;

    try {
      const order = await prisma.order.findUnique({
        where: {
          id: order_id,
        },
      });

      if (!order) {
        return reply.status(404).send({
          error: "Order not found",
          message: "Order with this ID does not exist",
        });
      }

      const product = await prisma.product.findUnique({
        where: {
          id: product_id,
        },
      });

      if (!product) {
        return reply.status(404).send({
          error: "Product not found",
          message: "Product with this ID does not exist",
        });
      };

      const existingOrderDetails = await prisma.order_details.findFirst({
        where: {
          order_id,
          product_id,
        },
      });

      if (existingOrderDetails) {
        return reply.status(400).send({
          error: "Order Details already exists",
          message: "Order Details with this order and product ID already exists",
        });
      }

      const product_price = product.unit_quantity ? product.unit_quantity * product.unit_value : product.unit_value;
      const full_price = quantity * product_price;

      const order_details = await prisma.order_details.create({
        data: {
          id: nanoid(),
          order_id,
          product_id,
          quantity,
          full_price,
        },
      });

      return reply.status(201).send({
        message: `Order Details ${order_details.id} created successfully`,
        data: order_details,
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
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["orders_details"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Delete a order details",
      params: z.object({
        id: z.string().describe("Order_details ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("Order Details Deleted"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const order_details = await prisma.order_details.findUnique({
        where: {
          id,
        },
      });

      if (!order_details) {
        return reply.status(404).send({
          error: "Order_details not found",
          message: "Order_details with this ID does not exist",
        });
      }

      await prisma.order_details.delete({
        where: {
          id,
        },
      });

      return reply.status(200).send({
        message: `Order ${order_details.id} deleted`,
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
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["orders_details"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Update a order_details",
      body: createOrderDetailsSchema,
      params: z.object({
        id: z.string().describe("Order Details ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          data: orderDetailsSchema,
        }).describe("Order Details Updated"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { order_id, product_id, quantity } = require.body;

    try {
      const order_details = await prisma.order_details.findUnique({
        where: {
          id,
        },
      });

      if (!order_details) {
        return reply.status(404).send({
          error: "Order_details not found",
          message: "Order_details with this ID does not exist",
        });
      }

      const order = await prisma.order.findUnique({
        where: {
          id: order_id,
        },
      });

      if (!order) {
        return reply.status(404).send({
          error: "Order not found",
          message: "Order with this ID does not exist",
        });
      }

      const product = await prisma.product.findUnique({
        where: {
          id: product_id,
        },
      });

      if (!product) {
        return reply.status(404).send({
          error: "Product not found",
          message: "Product with this ID does not exist",
        });
      }

      const existingOrderDetails = await prisma.order_details.findFirst({
        where: {
          order_id,
          product_id,
          NOT: {
            id
          },
        },

      });

      if (existingOrderDetails) {
        return reply.status(400).send({
          error: "Order Details already exists",
          message: "Order Details with this order and product ID already exists",
        });
      }

      const product_price = product.unit_quantity ? product.unit_quantity * product.unit_value : product.unit_value;
      const full_price = quantity * product_price;

      const updatedOrderDetails = await prisma.order_details.update({
        where: {
          id,
        },
        data: {
          order_id,
          product_id,
          quantity,
          full_price,
        },
      });

      return reply.status(200).send({
        message: `Order Details ${updatedOrderDetails.id} updated successfully`,
        data: updatedOrderDetails,
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