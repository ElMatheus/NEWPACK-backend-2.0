import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { validatorCompiler, serializerCompiler, type ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod'
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { routes } from './routes/index.routes';
import fastifyJwt from '@fastify/jwt';

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, { origin: '*' })

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'NEWPACK API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(routes)

if (!process.env.SECRET_TOKEN) {
  throw new Error('SECRET_TOKEN environment variable is not defined');
}

app.register(fastifyJwt, {
  secret: process.env.SECRET_TOKEN
})

const port = Number(process.env.PORT) || 5000

app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`Server is running on http://localhost:${port}`);
});
