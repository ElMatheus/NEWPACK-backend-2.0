import { FastifyRequest, FastifyReply } from "fastify";

export const ensureAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user?.isAdmin) {
    return reply.status(403).send({ message: "Forbidden: admin access only" });
  }
}