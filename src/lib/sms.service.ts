interface SendSMSParams {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SendSMSParams) {
  const gatewayUrl =
    process.env.SMS_GATEWAY_URL || 'http://192.168.1.2:8080/send-sms';

  try {
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: to,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SMS Gateway error: ${errorText}`);
    }

    console.log(`✅ SMS sent successfully to: ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ SMS Gateway error:', error.message);

    // Fallback to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV] SMS to ${to}: ${message}`);
      return true;
    }

    throw error;
  }
}
