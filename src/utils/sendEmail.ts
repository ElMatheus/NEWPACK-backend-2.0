import NodeMailer from 'nodemailer';
import { SendEmailType, SendConfirmationEmailType } from '../types/Email';

export default class EmailService {
  private static createTransporter() {
    return NodeMailer.createTransport({
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

   <div style="margin: 20px 0; padding: 15px; background-color: #e9f7ef; border-left: 5px solid #28a745; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #155724;">
        ${email.hasNotification ? 'Este pedido foi enviado por e-mail e também compartilhado no grupo do WhatsApp.' : 'Este pedido foi enviado somente por e-mail.'}
      </p>
    </div>

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
      const transporter = EmailService.createTransporter();
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  static async sendOrderConfirmationEmail(email: SendConfirmationEmailType) {
    try {
      const mailOptions = {
        to: email.client_email,
        subject: `Confirmação do Pedido #${email.order_id}`, html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação do Pedido</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
          <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <!-- Header with Logo -->
            <div style="background-color: rgb(31, 73, 125); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Confirmação do Pedido</h1>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; margin-bottom: 25px;">Olá <strong>${email.client_name}</strong>,</p>
              
              <div style="background-color: #f9f9f9; border-left: 4px solid rgb(31, 73, 125); padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px;">Seu pedido <span style="font-weight: bold; color: rgb(31, 73, 125); font-size: 18px;">#${email.order_id}</span> foi recebido com sucesso!</p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
              Agradecemos pela sua confiança em nossos produtos. Nossa equipe já está cuidando do seu pedido e, em breve, o produto que você comprou chegará até você.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 10px;">Se tiver alguma dúvida, não hesite em entrar em contato:</p>
              <p style="font-size: 16px; margin-bottom: 30px;">
                <a href="mailto:solucoesnewpack@gmail.com" style="color: rgb(31, 73, 125); text-decoration: none; font-weight: 500;">solucoesnewpack@gmail.com</a> | <a href="tel:+5519996991843" style="color: rgb(31, 73, 125); text-decoration: none; font-weight: 500;">(19) 99699-1843</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f0f0f0; padding: 25px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin-top: 0; margin-bottom: 10px; font-weight: 600; font-size: 16px;">Equipe Comercial - Soluções New Pack - Ltda</p>
              <p style="margin-top: 0; margin-bottom: 20px; font-size: 14px;">Rua Paulo Trombeta – 76, Jd. Bom Retiro – Valinhos, SP</p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 14px; color: rgb(31, 73, 125); font-weight: bold; margin-bottom: 5px;">Levando Soluções para seus negócios</p>
                <p style="font-size: 12px; color: #6c757d; margin-top: 15px;">
                  <span style="color: #28a745; font-size: 14px;">♻</span> Antes de imprimir pense no meio ambiente
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      };
      const transporter = EmailService.createTransporter();
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }
}