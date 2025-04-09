import jwt from 'jsonwebtoken';
const { verify } = jwt;
import { FastifyRequest, FastifyReply } from "fastify";

export const ensureAuthenticated = async (request: FastifyRequest, reply: FastifyReply) => {
  const { authorization } = request.headers;

  if (!authorization) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Token not provided",
    });
  }

  const token = authorization.replace("Bearer", "").trim();

  try {
    if (!process.env.SECRET_TOKEN) {
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "Secret token not found",
      });
    }
    const decoded = verify(token, process.env.SECRET_TOKEN!) as { id: string, isAdmin?: boolean };
    request.user = {
      id: decoded.id,
      isAdmin: decoded.isAdmin,
    };
  } catch (error) {
    return reply.status(401).send(
      {
        error: "Unauthorized",
        message: "Invalid token",
      },
    );
  }
}