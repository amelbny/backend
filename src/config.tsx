// Mapper for environment variables
export const environment = process.env.NODE_ENV;
export const port = process.env.PORT;
export const baseUrl = process.env.BASE_URL;

export const db = {
  name: process.env.DB_NAME || '',
  host: process.env.DB_HOST || '',
  port: process.env.DB_PORT || ''
};

import nodemailer from 'nodemailer';
export const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.TRANSPORTER_USER,
		pass: process.env.TRANSPORTER_PASSWORD,
	},
});

export const corsUrl = process.env.CORS_URL;

export const logDirectory = process.env.LOG_DIR;

