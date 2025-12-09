import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailService {
  sendStrategyNotification(to: string, subject: string, content: string): Promise<boolean>;
  sendTradeNotification(to: string, tradeDetails: any): Promise<boolean>;
  sendTestEmail(to: string): Promise<boolean>;
}

export class NodemailerService implements EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }
  
  async sendStrategyNotification(to: string, subject: string, content: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: '"Binance Trading Dashboard" <no-reply@binance-dashboard.com>',
        to,
        subject,
        html: content,
      });
      
      console.log('Strategy notification email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send strategy notification email:', error);
      return false;
    }
  }
  
  async sendTradeNotification(to: string, tradeDetails: any): Promise<boolean> {
    const { strategy, pair, type, price, amount, status, profitLoss } = tradeDetails;
    
    const subject = `Trade ${status}: ${type} ${pair}`;
    
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #1976D2;">Trade ${status}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Strategy</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${strategy}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Pair</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${pair}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Type</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${type === 'BUY' ? '#4CAF50' : '#F44336'};">${type}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Price</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${price}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Amount</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${amount}</td>
          </tr>
          ${profitLoss ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Profit/Loss</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${profitLoss > 0 ? '#4CAF50' : '#F44336'};">
              ${profitLoss > 0 ? '+' : ''}${profitLoss}
            </td>
          </tr>
          ` : ''}
        </table>
        <p style="margin-top: 20px; color: #666;">
          This is an automated notification from your Binance Trading Dashboard.
        </p>
      </div>
    `;
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Binance Trading Dashboard" <no-reply@binance-dashboard.com>',
        to,
        subject,
        html: content,
      });
      
      console.log('Trade notification email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send trade notification email:', error);
      return false;
    }
  }
  
  async sendTestEmail(to: string): Promise<boolean> {
    const subject = 'Prueba de Notificación - Binance Trading Dashboard';
    
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #1976D2;">Correo de Prueba</h2>
        <p>Este es un correo de prueba de tu Binance Trading Dashboard.</p>
        <p>Si has recibido este correo, significa que las notificaciones por email están configuradas correctamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha y Hora</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Destinatario</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${to}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666;">
          Este es un mensaje automático de tu Binance Trading Dashboard. No responder a este correo.
        </p>
      </div>
    `;
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Binance Trading Dashboard" <no-reply@binance-dashboard.com>',
        to,
        subject,
        html: content,
      });
      
      console.log('Test email sent to:', to);
      return true;
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }
}

// Clase extendida para crear cuentas de prueba de Ethereal
export class EtherealEmailService implements EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: any = null;
  
  constructor() {
    this.createTestAccount();
  }
  
  private async createTestAccount() {
    try {
      // Crear una cuenta de prueba de Ethereal
      this.testAccount = await nodemailer.createTestAccount();
      
      // Crear el transportador con la cuenta de prueba
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
      
      console.log('Cuenta de email de prueba creada:', this.testAccount.user);
    } catch (error) {
      console.error('Error creando cuenta de prueba:', error);
    }
  }
  
  async sendStrategyNotification(to: string, subject: string, content: string): Promise<boolean> {
    if (!this.transporter) {
      await this.createTestAccount();
      if (!this.transporter) return false;
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Binance Trading Dashboard" <test@binance-dashboard.com>',
        to,
        subject,
        html: content,
      });
      
      console.log('Strategy notification email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error('Failed to send strategy notification email:', error);
      return false;
    }
  }
  
  async sendTradeNotification(to: string, tradeDetails: any): Promise<boolean> {
    if (!this.transporter) {
      await this.createTestAccount();
      if (!this.transporter) return false;
    }
    
    const { strategy, pair, type, price, amount, status, profitLoss } = tradeDetails;
    
    const subject = `Trade ${status}: ${type} ${pair}`;
    
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #1976D2;">Trade ${status}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Strategy</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${strategy}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Pair</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${pair}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Type</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${type === 'BUY' ? '#4CAF50' : '#F44336'};">${type}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Price</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${price}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Amount</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${amount}</td>
          </tr>
          ${profitLoss ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Profit/Loss</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${profitLoss > 0 ? '#4CAF50' : '#F44336'};">
              ${profitLoss > 0 ? '+' : ''}${profitLoss}
            </td>
          </tr>
          ` : ''}
        </table>
        <p style="margin-top: 20px; color: #666;">
          This is an automated notification from your Binance Trading Dashboard.
        </p>
      </div>
    `;
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Binance Trading Dashboard" <test@binance-dashboard.com>',
        to,
        subject,
        html: content,
      });
      
      console.log('Trade notification email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error('Failed to send trade notification email:', error);
      return false;
    }
  }
  
  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.transporter) {
      await this.createTestAccount();
      if (!this.transporter) return false;
    }
    
    const subject = 'Prueba de Notificación - Binance Trading Dashboard';
    
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #1976D2;">Correo de Prueba</h2>
        <p>Este es un correo de prueba de tu Binance Trading Dashboard.</p>
        <p>Si has recibido este correo, significa que las notificaciones por email están configuradas correctamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha y Hora</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Destinatario</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${to}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666;">
          Este es un mensaje automático de tu Binance Trading Dashboard. No responder a este correo.
        </p>
      </div>
    `;
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Binance Trading Dashboard" <test@binance-dashboard.com>',
        to,
        subject,
        html: content,
      });
      
      console.log('Test email sent to:', to);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }
}

// Configurar el servicio de email según las variables de entorno
function createEmailService(): EmailService {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Si están configuradas las variables SMTP, usar NodemailerService
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    console.log('📧 Configurando email con SMTP:', smtpHost);
    return new NodemailerService({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false, // true para puerto 465, false para otros puertos
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Si no hay configuración SMTP, usar EtherealEmailService para pruebas
  console.log('📧 Usando servicio de email de prueba (Ethereal)');
  return new EtherealEmailService();
}

// Exportamos la instancia del servicio de email
export const emailService = createEmailService();
