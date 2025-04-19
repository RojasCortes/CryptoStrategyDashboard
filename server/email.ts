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
}

// Create a singleton instance with default or environment variable config
export const emailService = new NodemailerService({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Boolean(process.env.EMAIL_SECURE) || false,
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});
