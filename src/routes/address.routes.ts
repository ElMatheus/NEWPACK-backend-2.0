import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { addressResponseSchema, addressSchema, createAddressSchema, updateAddressSchema } from "../schemas/address.schema";
import { prisma } from "../database/prisma-client";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

export async function addressRouter(app: FastifyTypedInstance) {
  app.get("/", {
    preHandler: [ensureAuthenticated, ensureAdmin],
    schema: {
      tags: ["address"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Get all address",
      response: {
        200: addressResponseSchema
      }
    },
  }, async (require, reply) => {
    const address = await prisma.address.findMany({
      select: {
        id: true,
        user_id: true,
        cep: true,
        street: true,
        number: true,
        complement: true,
        city: true,
        neighborhood: true,
        state: true,
        freight: true,
        active: true,
      }
    });

    return reply.status(200).send(address);
  }
  );

  app.get("/:id", {
    preHandler: ensureAuthenticated,
    schema: {
      tags: ["address"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Get a address by ID",
      params: z.object({
        id: z.string().describe("Address ID"),
      }),
      response: {
        200: addressSchema,
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    }
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const address = await prisma.address.findUnique({
        where: {
          id: Number(id),
        },
        select: {
          id: true,
          user_id: true,
          cep: true,
          street: true,
          number: true,
          complement: true,
          city: true,
          neighborhood: true,
          state: true,
          freight: true,
          active: true,
        }
      });

      if (!address) {
        return reply.status(404).send({
          error: "Address not found",
          message: "Address with this ID does not exist",
        });
      }

      return reply.status(200).send(address);
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
      tags: ["address"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Create a new address",
      body: createAddressSchema,
      response: {
        201: z.object({
          message: z.string().describe("Message"),
          data: addressSchema,
        }).describe("Address Created"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { user_id, cep, street, number, complement, city, neighborhood, state } = require.body;

    try {
      const userExists = await prisma.user.findUnique({
        where: {
          id: user_id,
        },
      });

      if (!userExists) {
        return reply.status(400).send({
          error: "User not found",
          message: "User with this ID does not exist",
        });
      }

      // Deactivate any existing active address for the user
      await prisma.address.updateMany({
        where: {
          user_id,
          active: true,
        },
        data: {
          active: false,
        },
      });

      const calculateFreight = city.toLowerCase() == "valinhos" ? 'CIF' : 'FOB';

      const formattedCep = cep.replace(/\D/g, "");

      const address = await prisma.address.create({
        data: {
          user_id,
          cep: formattedCep,
          street,
          number,
          complement,
          city,
          neighborhood,
          state,
          freight: calculateFreight,
        },
      });

      return reply.status(201).send({
        message: `Address ${address.cep} created`,
        data: address
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
      tags: ["address"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Delete a address",
      params: z.object({
        id: z.string().describe("Address ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("Address Deleted"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;

    try {
      const address = await prisma.address.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!address) {
        return reply.status(404).send({
          error: "Address not found",
          message: "Address with this ID does not exist",
        });
      }

      await prisma.address.delete({
        where: {
          id: Number(id),
        },
      });

      return reply.status(200).send({
        message: `Address ${address.cep} deleted`,
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
      tags: ["address"],
      security: [
        { bearerAuth: [] },
      ],
      description: "Update a address",
      body: updateAddressSchema,
      params: z.object({
        id: z.string().describe("Address ID"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          data: addressSchema,
        }).describe("Address Updated"),
        404: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Not Found"),
      },
    },
  }, async (require, reply) => {
    const { id } = require.params;
    const { cep, street, number, complement, city, neighborhood, state, active } = require.body;

    try {
      const address = await prisma.address.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!address) {
        return reply.status(404).send({
          error: "Address not found",
          message: "Address with this ID does not exist",
        });
      }

      if (active === true) {
        await prisma.address.updateMany({
          where: {
            user_id: address.user_id,
            id: { not: Number(id) },
            active: true,
          },
          data: {
            active: false,
          },
        });
      } else if (active === false) {
        const currentActiveAddress = await prisma.address.findFirst({
          where: {
            user_id: address.user_id,
            active: true,
            id: Number(id),
          },
        });

        if (currentActiveAddress) {
          const otherActiveAddresses = await prisma.address.count({
            where: {
              user_id: address.user_id,
              active: true,
              id: { not: Number(id) },
            },
          });

          if (otherActiveAddresses === 0) {
            return reply.status(400).send({
              error: "Invalid Operation",
              message: "Cannot deactivate the only active address. User must have exactly one active address.",
            });
          }
        }
      }

      const formattedCep = cep ? cep.replace(/\D/g, "") : undefined;

      const calculateFreight = (city?.toLowerCase() ?? "") === "valinhos" ? 'CIF' : 'FOB';

      const addressData = await prisma.address.update({
        where: {
          id: Number(id),
        },
        data: {
          cep: formattedCep,
          street,
          number,
          complement,
          city,
          neighborhood,
          state,
          freight: calculateFreight,
          active,
        },
      });

      return reply.status(200).send({
        message: `Address ${addressData.cep} updated`,
        data: addressData
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });
}