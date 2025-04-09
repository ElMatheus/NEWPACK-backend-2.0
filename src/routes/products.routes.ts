import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { productsResponseSchema, productSchema, updateProductSchema } from "../schemas/products.schema";
import { prisma } from "../database/prisma-client";
import { typeProduct, categoryProduct } from "@prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function productsRouter(app: FastifyTypedInstance) {
  app.get("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["products"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get all products",
      querystring: z.object({
        category: z.string().optional().describe("Category"),
        type: z.string().optional().describe("Type"),
      }).describe("Query Parameters"),
      response: {
        200: productsResponseSchema
      }
    },
  }, async (require, reply) => {
    const { category, type } = require.query as { category?: string; type?: string };

    const products = await prisma.product.findMany({
      where: {
        ...(category && { category: category as categoryProduct }),
        ...(type && { type: type as typeProduct }),
      },
      include: {
        Product_image: true,
      },
    });

    return reply.status(200).send(products);
  }
  );

  app.get("/:id", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["products"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get a product by ID",
      params: z.object({
        id: z.string().describe("Product ID"),
      }),
      response: {
        200: productSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    }
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const product = await prisma.product.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          Product_image: true,
        },
      });

      if (!product) {
        return reply.status(404).send({
          error: "Product not found",
          message: "Product with this ID does not exist",
        });
      }

      return reply.status(200).send(product);
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
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["products"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Create a new product",
      body: productSchema,
      response: {
        201: z.object({
          message: z.string().describe("Message"),
          data: productSchema,
        }).describe("Product Created"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { id, name, toughness, dimension, type, category, description, unit_quantity, unit_value } = require.body;

    let idReq = id ? id : undefined;

    try {
      if (!idReq) {
        const randomId = Math.floor(Math.random() * 100000).toString().padStart(1, '0');
        idReq = Number(randomId);
      }

      if (type == "caixa" && unit_quantity) {
        return reply.status(400).send({
          error: "Invalid type",
          message: "Type 'caixa' cannot have unit quantity",
        });
      }

      const productExists = await prisma.product.findFirst({
        where: {
          id: idReq,
        },
      });

      if (productExists) {
        return reply.status(400).send({
          error: "Product already exists",
          message: "Product with this ID already exists",
        });
      }

      const product = await prisma.product.create({
        data: {
          id: idReq,
          name,
          toughness,
          dimension,
          type,
          category,
          description,
          unit_quantity,
          unit_value
        },
      });

      return reply.status(201).send({
        message: `Product ${product.id} created`,
        data: product
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
      tags: ["products"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Delete a product",
      params: z.object({
        id: z.string().describe("Product ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("Product Deleted"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const product = await prisma.product.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!product) {
        return reply.status(404).send({
          error: "Product not found",
          message: "Product with this ID does not exist",
        });
      }

      await prisma.product.delete({
        where: {
          id: Number(id),
        },
      });

      return reply.status(200).send({
        message: `Product ${product.id} deleted`,
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
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["products"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Update a product",
      body: updateProductSchema,
      params: z.object({
        id: z.string().describe("Product ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          data: productSchema,
        }).describe("Product Updated"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { name, toughness, dimension, type, category, description, unit_quantity, unit_value } = require.body;

    try {
      const product = await prisma.product.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!product) {
        return reply.status(404).send({
          error: "Product not found",
          message: "Product with this ID does not exist",
        });
      }

      if (type == "caixa" && unit_quantity || product.type == "caixa" && unit_quantity || type == "caixa" && product.unit_quantity) {
        return reply.status(400).send({
          error: "Invalid type",
          message: "Type 'caixa' cannot have unit quantity",
        });
      }

      const productData = await prisma.product.update({
        where: {
          id: Number(id),
        },
        data: {
          name,
          toughness,
          dimension,
          type,
          category,
          description,
          unit_quantity,
          unit_value
        },
      });

      return reply.status(200).send({
        message: `Product ${product.id} updated`,
        data: productData
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