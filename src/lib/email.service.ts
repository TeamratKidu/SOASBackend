import Mailjet from 'node-mailjet';

// Initialize conditionally to prevent startup crash if env vars are missing
const apiKey = process.env.MAILJET_API_KEY;
const apiSecret = process.env.MAILJET_SECRET_KEY;

const mailjet =
  apiKey && apiSecret ? Mailjet.apiConnect(apiKey, apiSecret) : null;

if (!mailjet && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ Mailjet API keys not found. Email sending will be mocked.');
}

interface SendEmailParams {
  to: string;
  subject: string;
  template: 'signin-otp' | 'verify-email' | 'reset-password' | 'welcome';
  data: Record<string, any>;
}

const emailTemplates = {
  'signin-otp': (otp: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f7f6; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 28px; font-weight: 800; color: #171612; }
        h1 { color: #171612; font-size: 24px; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #d4af35 0%, #b08d1a 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
        .otp { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; color: white; letter-spacing: 8px; }
        .footer { text-align: center; color: #999; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <div class="logo-text">AxumAuction</div>
        </div>
        <h1>Sign In to Your Account</h1>
        <p>You requested to sign in to your SOAS account. Use the verification code below:</p>
        <div class="otp-box">
          <div class="otp">${otp}</div>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <div class="footer">
          <p>© 2026 AxumAuction - Secure Online Auction System</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'verify-email': (otp: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f7f6; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 28px; font-weight: 800; color: #171612; }
        h1 { color: #171612; font-size: 24px; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #d4af35 0%, #b08d1a 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
        .otp { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; color: white; letter-spacing: 8px; }
        .footer { text-align: center; color: #999; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <div class="logo-text">AxumAuction</div>
        </div>
        <h1>Welcome to AxumAuction! 🎉</h1>
        <p>Thank you for joining our platform. Please verify your email address with the code below:</p>
        <div class="otp-box">
          <div class="otp">${otp}</div>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <div class="footer">
          <p>© 2026 AxumAuction - Secure Online Auction System</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'reset-password': (otp: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f7f6; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 28px; font-weight: 800; color: #171612; }
        h1 { color: #171612; font-size: 24px; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #d4af35 0%, #b08d1a 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
        .otp { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; color: white; letter-spacing: 8px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 8px; }
        .footer { text-align: center; color: #999; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <div class="logo-text">AxumAuction</div>
        </div>
        <h1>Reset Your Password</h1>
        <p>You requested to reset your password. Use the verification code below:</p>
        <div class="otp-box">
          <div class="otp">${otp}</div>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
        </div>
        <div class="footer">
          <p>© 2026 AxumAuction - Secure Online Auction System</p>
        </div>
      </div>
    </body>
    </html>
  `,

  welcome: (name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f7f6; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 28px; font-weight: 800; color: #171612; }
        h1 { color: #171612; font-size: 28px; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #d4af35 0%, #b08d1a 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 24px 0; }
        .features { background: #f8f7f6; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .feature { margin-bottom: 16px; }
        .feature-icon { color: #d4af35; margin-right: 8px; }
        .footer { text-align: center; color: #999; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <div class="logo-text">AxumAuction</div>
        </div>
        <h1>Welcome to AxumAuction, ${name}! 🎉</h1>
        <p>Your account has been successfully verified. You're now part of Ethiopia's premier online auction platform.</p>
        
        <div class="features">
          <div class="feature">✨ <strong>Real-time Bidding</strong> - Bid on premium assets with live updates</div>
          <div class="feature">🔒 <strong>Secure Transactions</strong> - Protected by advanced security measures</div>
          <div class="feature">⚡ <strong>Anti-Sniping</strong> - Fair bidding with automatic extensions</div>
          <div class="feature">💳 <strong>Local Payments</strong> - Pay with Telebirr or Chapa</div>
        </div>
        
        <center>
          <a href="${process.env.FRONTEND_URL}/auctions" class="cta-button">Start Browsing Auctions</a>
        </center>
        
        <p>Need help? Our support team is here for you 24/7.</p>
        
        <div class="footer">
          <p>© 2026 AxumAuction - Secure Online Auction System</p>
          <p>Built with ❤️ for the Ethiopian digital ecosystem</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

export async function sendEmail({
  to,
  subject,
  template,
  data,
}: SendEmailParams) {
  try {
    const htmlContent = emailTemplates[template](data.otp || data.name || '');

    if (!mailjet) {
      // Graceful fallback for dev
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 [DEV - Mock] Email to ${to}, Subject: ${subject}`, data);
        return true;
      }
      throw new Error('Mailjet client not initialized. Missing API keys.');
    }

    const result = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'noreply@soas.et',
            Name: 'AxumAuction',
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          HTMLPart: htmlContent,
        },
      ],
    });

    console.log('✅ Email sent successfully to:', to);
    return true;
  } catch (error: any) {
    console.error('❌ Mailjet error:', error.statusCode, error.message);

    // Fallback to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV] Email to ${to}:`, { subject, template, data });
      return true;
    }

    throw error;
  }
}
