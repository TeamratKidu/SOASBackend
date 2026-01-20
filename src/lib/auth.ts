import { betterAuth } from 'better-auth';
import { emailOTP, phoneNumber } from 'better-auth/plugins';
import * as bcrypt from 'bcrypt';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sendEmail } from './email.service';
import { sendSMS } from './sms.service';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as schema from '../database/schema';

// Request loading .env file from up one level (root of backend) or CWD
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log('Auth Init - DB Config:', {
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  db: process.env.DATABASE_NAME,
  hasPassword: !!process.env.DATABASE_PASSWORD,
});

// Create Connection Pool
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD || '', // Default to empty string to satisfy type, but will fail auth if wrong
  database: process.env.DATABASE_NAME,
});

export const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      // Map table names if they differ from default
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',

  secret:
    process.env.BETTER_AUTH_SECRET ||
    'your-super-secret-key-min-32-chars-change-in-production',

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: async (plainPassword) => {
        return await bcrypt.hash(plainPassword, 12);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },

  // Social OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/facebook`,
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Plugins
  plugins: [
    // Email OTP Plugin
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'sign-in') {
          await sendEmail({
            to: email,
            subject: 'SOAS - Sign In Verification Code',
            template: 'signin-otp',
            data: { otp },
          });
        } else if (type === 'email-verification') {
          await sendEmail({
            to: email,
            subject: 'SOAS - Verify Your Email',
            template: 'verify-email',
            data: { otp },
          });
        } else if (type === 'forget-password') {
          await sendEmail({
            to: email,
            subject: 'SOAS - Reset Your Password',
            template: 'reset-password',
            data: { otp },
          });
        }
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
    }),

    // Phone Number Plugin
    phoneNumber({
      async sendOTP({ phoneNumber, code }) {
        await sendSMS({
          to: phoneNumber,
          message: `Your AxumAuction verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
        });
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
    }),
  ],

  // Custom user fields
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'buyer',
        required: true,
        input: false, // Not editable by user
      },
      phone: {
        type: 'string',
        required: false,
        unique: true,
      },
      phoneVerified: {
        type: 'boolean',
        defaultValue: false,
        required: false,
      },
      trustScore: {
        type: 'number',
        defaultValue: 0,
        required: false,
      },
      unpaidAuctionsCount: {
        type: 'number',
        defaultValue: 0,
        required: false,
      },
      isActive: {
        type: 'boolean',
        defaultValue: true,
        required: false,
      },
      failedLogins: {
        type: 'number',
        defaultValue: 0,
        required: false,
      },
      lockedUntil: {
        type: 'date',
        required: false,
      },
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
  },

  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:5173'], // Trust localhost:5173

  // Advanced options
  advanced: {
    // @ts-ignore
    generateId: () => {
      return crypto.randomUUID();
    },
    cookieSameSite: 'lax', // Use 'lax' for better compatibility with redirects
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
