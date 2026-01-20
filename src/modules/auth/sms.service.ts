import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly smsGatewayUrl: string;

  constructor(private configService: ConfigService) {
    // Use Simple SMS Gateway running on local network
    this.smsGatewayUrl =
      this.configService.get('SMS_GATEWAY_URL') ||
      'http://192.168.1.2:8080/send-sms';
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const message = `Your SOAS verification code is: ${otp}. Valid for 10 minutes.`;

      const response = await fetch(this.smsGatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send SMS:', await response.text());
        return false;
      }

      console.log(`✅ OTP sent to ${phone}: ${otp}`);
      return true;
    } catch (error) {
      console.error('SMS Gateway Error:', error);
      // Fallback to console log in development
      if (this.configService.get('NODE_ENV') === 'development') {
        console.log(`📱 OTP for ${phone}: ${otp}`);
        return true;
      }
      return false;
    }
  }

  async sendNotification(phone: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(this.smsGatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('SMS Notification Error:', error);
      return false;
    }
  }
}
