/**
 * Desenvolvido por Matheus Gomes - [https://github.com/ElMatheus | matheusgomesgoncalves.564@gmail.com]
 * Projeto: NEWPACK-API
 * Data de criação: 2024-2025
 */

import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { usersResponseSchema, userSchema, createUserSchema, updateUserSchema } from "../schemas/users.schema";
import { productsWithQuantityResponseSchema } from "../schemas/products.schema";
import { typeProduct, categoryProduct } from "@prisma/client";
import { prisma } from "../database/prisma-client";
import { nanoid } from "nanoid";
import { hash } from "bcrypt";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function usersRouter(app: FastifyTypedInstance) {
  app.get("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get all users",
      querystring: z.object({
        name: z.string().optional().describe("Name"),
        full_name: z.string().optional().describe("Full Name"),
      }).describe("Query Parameters"),
      response: {
        200: usersResponseSchema
      }
    },
  }, async (require, reply) => {
    const { name, full_name } = require.query as { name?: string; full_name?: string };

    const users = await prisma.user.findMany({
      where: {
        ...(name && { name: { contains: name, mode: "insensitive" } }),
        ...(full_name && { full_name: { contains: full_name, mode: "insensitive" } }),
      },
      include: {
        Address: true
      }
    });

    return reply.status(200).send(users);
  }
  );

  app.get("/:id", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get a user by ID",
      querystring: z.object({
        active: z.string().optional().describe("Active"),
      }),
      params: z.object({
        id: z.string().describe("User ID"),
      }),
      response: {
        200: userSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    }
  }, async (require, reply) => {
    const { id } = require.params;
    const { active } = require.query as { active?: string };

    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          Address: {
            orderBy: [
              { active: "desc" },
              { id: "desc" }
            ]
          },
        }
      });

      if (!user) {
        return reply.status(404).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      if (active) {
        const userActiveAddress = await prisma.user.findUnique({
          where: { id },
          include: {
            Address: {
              where: { active: true },
            },
          },
        });

        if (!userActiveAddress) {
          return reply.status(404).send({
            error: "User not found",
            message: "User with this ID does not exist",
          });
        }

        return reply.status(200).send({
          ...userActiveAddress
        });
      }

      return reply.status(200).send({
        ...user
      });

    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });

  app.get("/:id/products", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get products by user ID",
      querystring: z.object({
        category: z.string().optional().describe("Category"),
        type: z.string().optional().describe("Type"),
      }),
      params: z.object({
        id: z.string().describe("User ID"),
      }),
      response: {
        200: productsWithQuantityResponseSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      }
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { category, type } = require.query as { category?: string; type?: string };

    try {
      const user = await prisma.user.findUnique({
        where: {
          id
        }
      });

      if (!user) {
        return reply.status(404).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      const orderDetails = await prisma.order_details.findMany({
        where: {
          order: {
            client_id: id,
          },
          product: {
            ...(category && { category: category as categoryProduct }),
            ...(type && { type: type as typeProduct }),
          }
        },
        include: {
          product: {
            include: {
              Product_image: true,
            }
          },
          order: {
            select: {
              order_date: true,
              status: true,
              Order_details: {
                select: {
                  quantity: true,
                }
              }
            }
          }
        },
        orderBy: [
          {
            order: {
              order_date: "desc"
            }
          },
          {
            product: {
              id: "asc"
            }
          }
        ],
        distinct: ["product_id"]
      })

      if (orderDetails.length === 0) {
        return reply.status(404).send({
          error: "No products found",
          message: "No products found for this user",
        });
      }

      const formattedProducts = orderDetails.map((item) => ({
        id: item.product.id,
        order_details_id: item.id,
        name: item.product.name,
        toughness: item.product.toughness,
        dimension: item.product.dimension,
        type: item.product.type,
        category: item.product.category,
        description: item.product.description,
        unit_quantity: item.product.unit_quantity,
        unit_value: item.product.unit_value,
        quantity: item.quantity,
        order_date: item.order.order_date,
        order_status: item.order.status,
        image: item.product.Product_image[0]?.image_url,
      }));

      return reply.status(200).send(formattedProducts);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });

  app.post("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Create a new user",
      body: createUserSchema,
      response: {
        201: z.object({
          message: z.string().describe("Message")
        }).describe("User Created"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { name, full_name, isAdmin, email, password } = require.body;

    try {
      const userExists = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { full_name: { equals: full_name, mode: "insensitive" } },
          ],
        },
      });

      if (userExists) {
        return reply.status(400).send({
          error: "User already exists",
          message: "User with this name or full name already exists",
        });
      }

      const passwordHash = await hash(password, 8);

      const user = await prisma.user.create({
        data: {
          id: nanoid(),
          name,
          full_name,
          password: passwordHash,
          isAdmin: isAdmin ?? undefined,
          email: email ?? undefined,
        },
      });

      return reply.status(201).send({
        message: `User ${user.name} created`,
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
      tags: ["users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Delete a user",
      params: z.object({
        id: z.string().describe("User ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("User Deleted"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      await prisma.user.delete({
        where: {
          id,
        },
      });

      return reply.status(200).send({
        message: `User ${user.name} deleted`,
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
      tags: ["users"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Update a user",
      body: updateUserSchema,
      params: z.object({
        id: z.string().describe("User ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("User Updated"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { name, full_name, password, email } = require.body;

    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      const userExists = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { full_name: { equals: full_name, mode: "insensitive" } },
          ],
          NOT: {
            id,
          },
        },
      });

      if (userExists) {
        return reply.status(400).send({
          error: "User already exists",
          message: "User with this name or full name already exists",
        });
      }

      // Handle password update separately if provided
      if (password) {
        const passwordHash = await hash(password, 8);

        await prisma.user.update({
          where: {
            id,
          },
          data: {
            password: passwordHash,
          },
        });
      }

      // Update user name, full_name, and email
      await prisma.user.update({
        where: {
          id,
        },
        data: {
          name,
          full_name,
          email, // Added email to the update operation
        },
      });

      return reply.status(200).send({
        message: `User ${user.id} updated`,
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