import { registerAs } from '@nestjs/config';
import { cleanEnv, str } from 'envalid';

export interface ServiceConfig {
  publicRoutes: string[];
  serviceId: string;
  serviceSecret: string;
  environments: string[];
  fileReadRoutes: {
    pattern: string;
    allowedActions: string[];
  };
}

const getServiceConfig = (): ServiceConfig => {
  // Validate environment variables
  const env = cleanEnv(process.env, {
    APP_SERVICE_ID: str({ desc: 'Service Identifier' }),
    APP_SERVICE_SECRET: str({ desc: 'Service Secret' }),
  });

  const config: ServiceConfig = {
    // Routes that do not require authentication
    publicRoutes: ['/health', 'v1/auth/login'],
    // Service authentication settings
    serviceId: env.APP_SERVICE_ID,
    serviceSecret: env.APP_SERVICE_SECRET,

    // Environments where service authentication is required
    environments: ['development', 'local', 'staging', 'production'],

    // File routes that allow read access (pattern matching)
    fileReadRoutes: {
      pattern: 'file.',
      allowedActions: ['.read'],
    },
  };

  return config;
};

export default registerAs('service', getServiceConfig);
