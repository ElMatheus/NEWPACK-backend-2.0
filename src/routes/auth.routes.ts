import z from "zod";
import { FastifyTypedInstance } from "../types/Server";
import { prisma } from "../database/prisma-client";
import { loginSchema } from "../schemas/auth.schema";
import { nanoid } from "nanoid";
import { compare } from "bcrypt";
import dayjs from "dayjs";


export async function authRouter(app: FastifyTypedInstance) {
  app.post("/login", {
    schema: {
      tags: ["auth"],
      description: "Login a user",
      body: loginSchema,
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          token: z.string().describe("Token"),
          refresh_token: z.string().describe("Refresh Token"),
          user_id: z.string().describe("User ID"),
        }).describe("User Logged In"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      }
    },
  }, async (require, reply) => {
    try {
      const { name, password } = require.body;

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { full_name: { equals: name, mode: "insensitive" } },
          ],
        },
      });

      if (!user) {
        return reply.status(400).send({
          error: "Invalid credentials",
          message: "Name or full name not found",
        });
      }

      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        return reply.status(400).send({
          error: "Invalid credentials",
          message: "Name or password invalid",
        });
      }

      const token = app.jwt.sign({
        id: user.id,
        isAdmin: user.isAdmin,
      }, {
        sub: user.id,
        expiresIn: "15m",
      });

      const expiresIn = dayjs().add(30, "day").unix();

      const refresh_token = await prisma.refresh_token.create({
        data: {
          id: nanoid(16),
          expiresIn,
          user_id: user.id,
        },
      });

      return reply.status(200).send({
        message: `User ${user.name} logged in successfully`,
        token,
        refresh_token: refresh_token.id,
        user_id: user.id,
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

  app.post("/refresh", {
    schema: {
      tags: ["auth"],
      description: "Refresh a token",
      body: z.object({
        refresh_token: z.string().describe("Refresh Token"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
          token: z.string().describe("Token"),
          refresh_token: z.string().describe("Refresh Token"),
          user_id: z.string().describe("User ID"),
        }).describe("Token Refreshed"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { refresh_token } = require.body;

    try {
      const token = await prisma.refresh_token.findUnique({
        where: {
          id: refresh_token,
        },
      });

      if (!token) {
        return reply.status(400).send({
          error: "Invalid refresh token",
          message: "Invalid or expired token",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: token.user_id,
        },
      });

      if (!user) {
        return reply.status(400).send({
          error: "Invalid refresh token",
          message: "User not found",
        });
      }

      const isExpired = dayjs().unix() > token.expiresIn;

      if (isExpired) {
        await prisma.refresh_token.delete({
          where: {
            id: refresh_token,
          },
        });
        return reply.status(400).send({
          error: "Expired refresh token",
          message: "The refresh token has expired",
        });
      }

      const newToken = app.jwt.sign({
        id: token.user_id,
        isAdmin: user.isAdmin,
      }, {
        sub: token.user_id,
        expiresIn: "15m",
      });

      await prisma.refresh_token.delete({
        where: {
          id: refresh_token,
        },
      });

      const newRefreshToken = await prisma.refresh_token.create({
        data: {
          id: nanoid(16),
          expiresIn: dayjs().add(30, "day").unix(),
          user_id: token.user_id,
        },
      });

      return reply.status(200).send({
        message: "Token refreshed successfully",
        token: newToken,
        refresh_token: newRefreshToken.id,
        user_id: token.user_id,
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  });

  app.delete("/refresh", {
    schema: {
      tags: ["auth"],
      description: "Delete a refresh token",
      body: z.object({
        refresh_token: z.string().describe("Refresh Token"),
      }),
      response: {
        200: z.object({
          message: z.string().describe("Message"),
        }).describe("Token Deleted"),
        400: z.object({
          error: z.string().describe("Error"),
          message: z.string().describe("Message"),
        }).describe("Bad Request"),
      },
    },
  }, async (require, reply) => {
    const { refresh_token } = require.body;

    try {
      await prisma.refresh_token.delete({
        where: {
          id: refresh_token,
        },
      });

      return reply.status(200).send({
        message: "Token deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
    }
  })
}