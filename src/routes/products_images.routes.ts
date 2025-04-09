import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { productsImagesResponseSchema, productImageSchema, createProductImageSchema, updateProductImageSchema } from "../schemas/products_images.schema";
import { verifyValidImage } from "../helpers/verify_valid_image";
import { prisma } from "../database/prisma-client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function productsImagesRouter(app: FastifyTypedInstance) {
  app.get("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["products_images"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get all product images or unique image URLs if ?unique is passed",
      querystring: z.object({
        unique: z.string().optional().describe("Unique image URLs"),
      }),
      response: {
        200: productsImagesResponseSchema
      }
    },
  }, async (require, reply) => {
    const { unique } = require.query as { unique?: string };

    if (unique) {
      const products_images = await prisma.product_image.findMany({
        select: {
          id: true,
          productId: true,
          image_url: true,
        },
        distinct: ["image_url"],
      });
      return reply.status(200).send(products_images);
    }

    const products_images = await prisma.product_image.findMany({
      select: {
        id: true,
        productId: true,
        image_url: true,
      }
    });

    return reply.status(200).send(products_images);
  }
  );

  app.get("/:id", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["products_images"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Get a product image by ID",
      params: z.object({
        id: z.string().describe("Product_image ID"),
      }),
      response: {
        200: productImageSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    }
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const product_image = await prisma.product_image.findUnique({
        where: {
          id: Number(id),
        },
        select: {
          id: true,
          productId: true,
          image_url: true,
        }
      });

      if (!product_image) {
        return reply.status(404).send({
          error: "Product image not found",
          message: "Product image with this ID does not exist",
        });
      }

      return reply.status(200).send(product_image);
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
      tags: ["products_images"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Create a new product image",
      body: createProductImageSchema,
      response: {
        201: z.object({
          message: z.string().describe("Message"),
          data: productImageSchema,
        }).describe("Product Image Created"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { productId, image_url } = require.body;

    try {
      const productExists = await prisma.product.findFirst({
        where: {
          id: productId,
        },
      });

      if (!productExists) {
        return reply.status(400).send({
          error: "Product not found",
          message: "Product with this ID does not exist",
        });
      }

      const isValidImage = await verifyValidImage(image_url);

      if (!isValidImage) {
        return reply.status(400).send({
          error: "Invalid image URL",
          message: "The provided URL is not a valid image",
        });
      }

      const productImage = await prisma.product_image.create({
        data: {
          productId,
          image_url,
        },
      });

      return reply.status(201).send({
        message: `Product Image ${productImage.id} created`,
        data: productImage
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
      tags: ["products_images"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Delete a product image",
      params: z.object({
        id: z.string().describe("Product image ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("Product Image Deleted"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const product_image = await prisma.product_image.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!product_image) {
        return reply.status(404).send({
          error: "Product Image not found",
          message: "Product Image with this ID does not exist",
        });
      }

      await prisma.product_image.delete({
        where: {
          id: Number(id),
        },
      });

      return reply.status(200).send({
        message: `Product Image ${product_image.id} deleted`,
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
      tags: ["products_images"],
      security: [
        {
          bearerAuth: [],
        },
      ],
      description: "Update a product image",
      body: updateProductImageSchema,
      params: z.object({
        id: z.string().describe("Product Image ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          data: productImageSchema,
        }).describe("Product Image Updated"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { productId, image_url } = require.body;

    try {
      const product_image = await prisma.product_image.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!product_image) {
        return reply.status(404).send({
          error: "Product image not found",
          message: "Product image with this ID does not exist",
        });
      }

      if (productId) {
        const product = await prisma.product.findUnique({
          where: {
            id: Number(productId),
          },
        });

        if (!product) {
          return reply.status(404).send({
            error: "Product not found",
            message: "Product with this ID does not exist",
          });
        }
      }

      if (image_url) {
        const isValidImage = await verifyValidImage(image_url);

        if (!isValidImage) {
          return reply.status(400).send({
            error: "Invalid image URL",
            message: "The provided URL is not a valid image",
          });
        }
      }

      const productImageData = await prisma.product_image.update({
        where: {
          id: Number(id),
        },
        data: {
          productId: productId,
          image_url: image_url,
        },
      });

      return reply.status(200).send({
        message: `Product Image ${productImageData.id} updated`,
        data: productImageData
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