import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { productSchema, updateProductSchema, allProductsSchema } from "../schemas/products.schema";
import { prisma } from "../database/prisma-client";
import { categoryProduct } from "@prisma/client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function productsRouter(app: FastifyTypedInstance) {
  app.get("/", {
    schema: {
      tags: ["products"],
      description: "Get all products",
      querystring: z.object({
        categories: z.string().optional().describe("Comma-separated list of categories"),
        search: z.union([z.string(), z.array(z.string())]).optional().describe("Search term(s) for product names - can use multiple parameters"),
        limit: z.string().optional().describe("Number of items per page"),
        page: z.string().optional().describe("Page number"),
      }).describe("Query Parameters"),
      response: {
        200: allProductsSchema,
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      }
    },
  }, async (require, reply) => {
    const { categories, search, limit, page } = require.query as {
      categories?: string;
      search?: string | string[];
      limit?: string;
      page?: string;
    };

    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;

    const whereConditions: any = {};

    if (categories) {
      const inputCategories = categories.split(',');
      const validCategories: categoryProduct[] = [];
      const invalidCategories: string[] = [];

      // Check each category against the enum
      inputCategories.forEach(cat => {
        if (Object.values(categoryProduct).includes(cat as categoryProduct)) {
          validCategories.push(cat as categoryProduct);
        } else {
          invalidCategories.push(cat);
        }
      });

      if (invalidCategories.length > 0) {
        return reply.status(400).send({
          error: "Invalid categories",
          message: `The following categories are invalid: ${invalidCategories.join(', ')}. Valid categories are: ${Object.values(categoryProduct).join(', ')}`,
        });
      }

      if (validCategories.length > 0) {
        whereConditions.category = {
          in: validCategories
        };
      }
    }

    if (search) {
      // Convert to array if it's a single string
      const searchTerms = Array.isArray(search) ? search : [search];

      // Create OR conditions for each search term
      whereConditions.OR = searchTerms.map(term => ({
        name: {
          contains: term,
          mode: 'insensitive'
        }
      }));
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereConditions,
        orderBy: {
          Order_details: {
            _count: 'desc', // First the order in promotions
          },
        },
        select: {
          id: true,
          name: true,
          toughness: true,
          dimension: true,
          type: true,
          category: true,
          description: true,
          unit_quantity: true,
          unit_value: false,
          Product_image: true,
          Order_details: {
            take: 1,
            select: {
              id: true,
            },
            where: {
              order: {
                client_id: process.env.NEWPACK_ID,
              }
            },
          },
        },
        skip,
        take: limitNumber,
      }),
      prisma.product.count({ where: whereConditions })
    ]);

    return reply.status(200).send({
      products,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    });
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