import NodeMailer from 'nodemailer';
import { SendEmailType } from '../types/Email';

export default class EmailService {
  transporter: any;
  constructor() {
    this.transporter = NodeMailer.createTransport({
      secure: true,
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
  }

  static async sendEmail(email: SendEmailType) {
    try {
      const mailOptions = {
        to: process.env.RECEIVE_EMAIL_USER,
        subject: `Pedido nº${email.numero_pedido} de ${email.apelido_cliente}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: rgb(31, 73, 125) ; text-align: center; margin-bottom: 20px;">Detalhes do Pedido</h1>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Cliente Id:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.id_cliente}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Cliente:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.nome_cliente}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Id do Pedido:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.id_pedido}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Data do Pedido:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.data_pedido}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Status do Pedido:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.status_pedido}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Descrição:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.descricao_pedido}</td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Total:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>${email.preco_total_pedido}</strong></td></tr>
          <tr><td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Parcelas:</strong></td><td style="padding: 12px; border-bottom: 1px solid #ddd;">${email.parcelas_pedido} x ${email.valor_parcelas_pedido}</td></tr>
        </table>

        <h2 style="color: rgb(31, 73, 125); margin-bottom: 10px;">Endereço</h2>
        <p style="margin-bottom: 5px;"><strong>CEP:</strong> ${email.infosAddress.cep}</p>
        <p style="margin-bottom: 5px;"><strong>Rua:</strong> ${email.infosAddress.street}, <strong>Número:</strong> ${email.infosAddress.number}</p>
        <p style="margin-bottom: 5px;"><strong>Cidade:</strong> ${email.infosAddress.city} - ${email.infosAddress.state}</p>
        <p style="margin-bottom: 5px;"><strong>Bairro:</strong> ${email.infosAddress.neighborhood}</p>
        <p style="margin-bottom: 5px;"><strong>Complemento:</strong> ${email.infosAddress.complement}</p>
        <p style="margin-bottom: 20px;"><strong>Frete:</strong> ${email.infosAddress.freight}</p>

       <h2 style="color: rgb(31, 73, 125); margin-bottom: 10px;">Produtos</h2>
  ${email.products.map((product) => `
    <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; margin-top: 10px;">
      <p><strong>Id:</strong> ${product.id}</p>
      <p><strong>Produto:</strong> ${product.name}</p>
      <p><strong>Peso:</strong> ${product.toughness}</p>
      <p><strong>Dimensão:</strong> ${product.dimension}</p>
      <p><strong>Descrição:</strong> ${product.description}</p>
      <p><strong>Tipo:</strong> ${product.type}</p>
      <p><strong>Categoria:</strong> ${product.category}</p>
      <p><strong>Quantidade:</strong> ${product.quantity}</p>
      <p><strong>Unidades:</strong> ${product.unit_quantity}</p>
      <p><strong>Preço Unitário:</strong> R$ ${product.unit_value}</p>
      <p><strong>Preço Total:</strong> <strong>${product.full_price}</strong></p>
    </div>
  `).join('')}

        <h2 style="color: rgb(31, 73, 125); margin-bottom: 10px;">Contato</h2>
        <p><strong>Nome:</strong> ${email.infosClient.name}</p>
        <p style="margin-bottom: 20px;"><strong>Telefone:</strong> ${email.infosClient.telephone}</p>
      <p class="x_MsoNormal"><b><span>&nbsp;</span></b></p>
        <footer style="margin-top: 20px; text-align: center; color: #555;">
          <p><strong>Comercial - Soluções New Pack - Ltda</strong></p>
          <p><a href="mailto:solucoesnewpack@gmail.com" style="color: #007bff;">solucoesnewpack@gmail.com</a></p>
          <p>Rua Paulo Trombeta – 76, Jd. Bom Retiro – Valinhos, SP</p>
           <b><span style="font-family: &quot;Agency FB&quot;, sans-serif; color: rgb(31, 73, 125) !important;">Levando Soluções para seus negócios</span></b><span></span>
           <p style="background-image:initial; background-position:initial; background-repeat:initial" class="x_MsoNormal">
               
            <b><span style="font-size: 20pt; font-family: Webdings; color: green !important;" lang="EN-US">P</span></b>&nbsp;<span style="font-size: 8pt; color: rgb(0, 102, 0) !important;">Antes de imprimir pense no&nbsp;meio ambiente</span><span></span>
          </p>
        </footer>
      </div>
        `,
      };

      const transporter = NodeMailer.createTransport({
        secure: true,
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      });

      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }
}