import { FastifyRequest, FastifyReply } from "fastify";

export async function ensureAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    request.user = {
      id: request.user.id,
      isAdmin: request.user.isAdmin,
    };
  } catch (err) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Invalid or missing token",
    });
  }
}
