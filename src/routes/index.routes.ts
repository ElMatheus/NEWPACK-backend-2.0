/**
 * Desenvolvido por Matheus Gomes - [https://github.com/ElMatheus | matheusgomesgoncalves.564@gmail.com]
 * Projeto: NEWPACK-API
 * Data de criação: 2024-2025
 */

import { usersRouter } from "./users.routes";
import { productsRouter } from "./products.routes";
import { productsImagesRouter } from "./products_images.routes";
import { ordersRouter } from "./orders.routes";
import { ordersDetailsRouter } from "./orders_details.routes";
import { authRouter } from "./auth.routes";
import { addressRouter } from "./address.routes";
import { emailRouter } from "./email.routes";
import { whatsappRouter } from "./whatsapp.routes";
import { FastifyInstance } from "fastify";

export async function routes(app: FastifyInstance) {
  app.get("/", () => {
    return "Servidor rodando perfeitamente!";
  });

  // all routes
  app.register(usersRouter, { prefix: "/users" });
  app.register(addressRouter, { prefix: "/address" });
  app.register(productsRouter, { prefix: "/products" });
  app.register(productsImagesRouter, { prefix: "/products_images" });
  app.register(ordersRouter, { prefix: "/orders" });
  app.register(ordersDetailsRouter, { prefix: "/orders_details" });
  app.register(authRouter, { prefix: "/auth" });
  app.register(emailRouter, { prefix: "/email" });
  app.register(whatsappRouter, { prefix: "/whatsapp" });
};