import nodemailer from "nodemailer";

// Create a transporter based on environment
const getTransporter = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction && process.env.SMTP_HOST && process.env.SMTP_PORT) {
    // Production configuration with real SMTP server
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || ""
      }
    });
  } else {
    // Development configuration (logs to console)
    return {
      sendMail: async (mailOptions: any) => {
        console.log("Email would be sent with options:", mailOptions);
        return { messageId: "mock-id-" + Date.now() };
      }
    };
  }
};

const transporter = getTransporter();

// Send an email notification when a trade is executed
export async function sendTradeExecutionEmail(
  to: string, 
  pair: string, 
  tradeType: string, 
  price: string, 
  amount: string, 
  profit: string
) {
  const subject = `Trade Executed: ${tradeType.toUpperCase()} ${pair}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">Trade Execution Notification</h2>
      <p>Your trading strategy has executed a trade:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Pair:</strong> ${pair}</p>
        <p><strong>Action:</strong> ${tradeType.toUpperCase()}</p>
        <p><strong>Price:</strong> ${price}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Profit/Loss:</strong> <span style="color: ${parseFloat(profit) >= 0 ? '#4caf50' : '#f44336'};">${profit}%</span></p>
      </div>
      
      <p>Login to your CryptoTrader dashboard to see more details.</p>
      
      <div style="margin-top: 30px; font-size: 12px; color: #757575;">
        <p>This is an automated message, please do not reply to this email.</p>
        <p>If you would like to stop receiving these notifications, you can update your settings in the dashboard.</p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "cryptotrader@example.com",
      to,
      subject,
      html
    });
    
    return true;
  } catch (error) {
    console.error("Failed to send trade execution email:", error);
    return false;
  }
}

// Send a daily report email
export async function sendDailyReportEmail(
  to: string,
  strategies: Array<{
    name: string;
    pair: string;
    dailyPL: string;
    weeklyPL: string;
    trades: number;
  }>
) {
  const subject = "CryptoTrader Daily Performance Report";
  
  // Calculate overall performance
  const totalDailyPL = strategies.reduce((sum, s) => sum + parseFloat(s.dailyPL), 0).toFixed(2);
  const totalWeeklyPL = strategies.reduce((sum, s) => sum + parseFloat(s.weeklyPL), 0).toFixed(2);
  const totalTrades = strategies.reduce((sum, s) => sum + s.trades, 0);
  
  // Generate strategy rows
  const strategyRows = strategies.map(s => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.pair}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${parseFloat(s.dailyPL) >= 0 ? '#4caf50' : '#f44336'};">${s.dailyPL}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${parseFloat(s.weeklyPL) >= 0 ? '#4caf50' : '#f44336'};">${s.weeklyPL}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.trades}</td>
    </tr>
  `).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">CryptoTrader Daily Report</h2>
      <p>Here's a summary of your trading strategies' performance:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Overall Performance</h3>
        <p><strong>Daily P/L:</strong> <span style="color: ${parseFloat(totalDailyPL) >= 0 ? '#4caf50' : '#f44336'};">${totalDailyPL}%</span></p>
        <p><strong>Weekly P/L:</strong> <span style="color: ${parseFloat(totalWeeklyPL) >= 0 ? '#4caf50' : '#f44336'};">${totalWeeklyPL}%</span></p>
        <p><strong>Total Trades:</strong> ${totalTrades}</p>
      </div>
      
      <h3>Strategy Performance</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #3f51b5; color: white;">
            <th style="padding: 10px; text-align: left;">Strategy</th>
            <th style="padding: 10px; text-align: left;">Pair</th>
            <th style="padding: 10px; text-align: left;">Daily P/L</th>
            <th style="padding: 10px; text-align: left;">Weekly P/L</th>
            <th style="padding: 10px; text-align: left;">Trades</th>
          </tr>
        </thead>
        <tbody>
          ${strategyRows}
        </tbody>
      </table>
      
      <p style="margin-top: 20px;">Login to your CryptoTrader dashboard to see more details and adjust your strategies.</p>
      
      <div style="margin-top: 30px; font-size: 12px; color: #757575;">
        <p>This is an automated message, please do not reply to this email.</p>
        <p>If you would like to stop receiving these reports, you can update your settings in the dashboard.</p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "cryptotrader@example.com",
      to,
      subject,
      html
    });
    
    return true;
  } catch (error) {
    console.error("Failed to send daily report email:", error);
    return false;
  }
}

// Send a price alert email
export async function sendPriceAlertEmail(
  to: string,
  symbol: string,
  price: string,
  condition: string,
  targetPrice: string
) {
  const subject = `Price Alert: ${symbol} ${condition} ${targetPrice}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">Price Alert Triggered</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>${symbol}</strong> has reached your target price.</p>
        <p><strong>Current Price:</strong> ${price}</p>
        <p><strong>Alert Condition:</strong> ${condition} ${targetPrice}</p>
      </div>
      
      <p>Login to your CryptoTrader dashboard to take action or set new alerts.</p>
      
      <div style="margin-top: 30px; font-size: 12px; color: #757575;">
        <p>This is an automated message, please do not reply to this email.</p>
        <p>If you would like to stop receiving these alerts, you can update your settings in the dashboard.</p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "cryptotrader@example.com",
      to,
      subject,
      html
    });
    
    return true;
  } catch (error) {
    console.error("Failed to send price alert email:", error);
    return false;
  }
}
