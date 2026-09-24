import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || 'server-dashboard-secure-jwt-secret-key-2026',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@Server2026!',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  ALERT_EMAIL_RECIPIENT: process.env.ALERT_EMAIL_RECIPIENT || 'itkindom.dhomes@gmail.com',
  ALERT_CPU_THRESHOLD: parseInt(process.env.ALERT_CPU_THRESHOLD || '90', 10),
  ALERT_MEM_THRESHOLD: parseInt(process.env.ALERT_MEM_THRESHOLD || '90', 10),
  ALERT_DISK_THRESHOLD: parseInt(process.env.ALERT_DISK_THRESHOLD || '85', 10),
  METRICS_INTERVAL_MS: parseInt(process.env.METRICS_INTERVAL_MS || '1500', 10),
};
