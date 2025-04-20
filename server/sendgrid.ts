import { MailService } from '@sendgrid/mail';
import { EmailService } from './email';

// Singleton de servicio SendGrid
export class SendGridService implements EmailService {
  private mailService: MailService;
  private initialized: boolean = false;

  constructor() {
    this.mailService = new MailService();
    
    // Intentamos inicializar con la clave API si está disponible
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  initialize(apiKey: string): boolean {
    try {
      this.mailService.setApiKey(apiKey);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing SendGrid service:', error);
      return false;
    }
  }

  async sendStrategyNotification(to: string, subject: string, content: string): Promise<boolean> {
    if (!this.initialized) {
      console.error('SendGrid service not initialized. API key missing.');
      return false;
    }

    try {
      await this.mailService.send({
        to,
        from: 'no-reply@binance-dashboard.com',
        subject,
        html: content,
      });
      
      console.log('Strategy notification email sent to:', to);
      return true;
    } catch (error) {
      console.error('Failed to send strategy notification email:', error);
      return false;
    }
  }
  
  async sendTradeNotification(to: string, tradeDetails: any): Promise<boolean> {
    if (!this.initialized) {
      console.error('SendGrid service not initialized. API key missing.');
      return false;
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
      await this.mailService.send({
        to,
        from: 'no-reply@binance-dashboard.com',
        subject,
        html: content,
      });
      
      console.log('Trade notification email sent to:', to);
      return true;
    } catch (error) {
      console.error('Failed to send trade notification email:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.initialized) {
      console.error('SendGrid service not initialized. API key missing.');
      return false;
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
      await this.mailService.send({
        to,
        from: 'no-reply@binance-dashboard.com',
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

// Creamos una instancia única del servicio
export const sendGridService = new SendGridService();