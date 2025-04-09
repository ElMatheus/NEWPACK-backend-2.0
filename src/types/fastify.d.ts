import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; isAdmin?: boolean }; // durante o .sign
    user: { id: string; isAdmin?: boolean }; // após o .verify
  }
}
