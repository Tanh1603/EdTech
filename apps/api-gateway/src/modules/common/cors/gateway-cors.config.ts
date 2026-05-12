import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const defaultGatewayCorsOrigins = [
  'null',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:8080',
  'http://localhost:4200',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:5173',
] as const;

export const gatewayCorsMethods = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];

export const gatewayCorsAllowedHeaders = [
  'Authorization',
  'Content-Type',
  'Accept',
  'Cache-Control',
  'X-Request-Id',
  'X-Correlation-Id',
];

export function getGatewayCorsOrigins(): string[] {
  const configured = process.env.GATEWAY_CORS_ORIGINS;
  if (!configured) {
    return [...defaultGatewayCorsOrigins];
  }

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createGatewayCorsOptions(): CorsOptions {
  const allowedOrigins = getGatewayCorsOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: gatewayCorsMethods,
    allowedHeaders: gatewayCorsAllowedHeaders,
  };
}
