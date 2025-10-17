# NEWPACK Backend

Projeto afim de automatizar os pedidos da NEWPACK para melhorar o serviço ao cliente e a eficiência operacional.

## Principais rotas

- **Autenticação**: Responsável pelo login de usuários e emissão de tokens JWT para controle de acesso.
- **Usuário**: Gerencia o cadastro de usuários, visualização de dados e controle administrativo.
- **Endereço**: Permite que usuários cadastrem, atualizem e removam seus endereços de entrega.
- **Produto**: Controla o cadastro, listagem, atualização e remoção de produtos no sistema.
- **Produto_imagem**: Gerencia o upload e exclusão de imagens associadas a produtos.
- **Pedido**: Permite a criação de pedidos pelos usuários e o gerenciamento desses pedidos pelos administradores.
- **Detalhe_pedido**: Contém as informações específicas de cada item dentro de um pedido.
- **Email**: Responsável por envio de e-mails, como confirmação de pedido ou mensagens de contato.
- **Whatsapp**: Responsável por verificar a conexão e gerenciar o envio de mensagens via WhatsApp para a confirmação de pedidos.

## Tecnologias Utilizadas

- TypeScript
- NodeJS
- Fastify
- Zod
- PostgreSQL
- Prisma ORM
- Nodemailer
- Evolution API
- Docker
- Nginx
- Swagger

## Executar o Projeto

### 1. Variáveis de Ambiente

1. Copie o arquivo `.env.example` e renomeie para `.env`.
2. Preencha as variáveis com os valores corretos de acordo com seu ambiente

### 2. Docker

Para subir a aplicação com o Docker, utilize o seguinte comando:

```bash
docker-compose up -d
```

### 3. Acesse a aplicação
 O projeto estará disponível em `http://localhost:4000`

### 4. Acesse a documentação Swagger
 `http://localhost:4000/docs`


## Contato

Caso tenha alguma dúvida sobre o sistema ou interesse em entrar em contato, estou à disposição pelo e-mail:

matheusgomesgoncalves.564@gmail.com
