import { registerAs } from '@nestjs/config';
import { cleanEnv, str } from 'envalid';

export enum LoggerFormat {
  Json = 'json',
  Pretty = 'pretty',
}

export interface LoggerConfig {
  level: string;
  format: LoggerFormat;
  prettyOptions: {
    colorize: boolean;
    levelFirst: boolean;
    translateTime: string;
    ignore: string;
    messageFormat: string;
  };
  jsonOptions: {
    colorize: boolean;
    levelFirst: boolean;
    translateTime: boolean;
  };
  formatters: {
    level: (label: string) => { level: string };
    bindings: (bindings: any) => { pid: number; hostname: string };
  };
}

const getLoggerConfig = (): LoggerConfig => {
  // Validate environment variables
  const env = cleanEnv(process.env, {
    LOG_LEVEL: str({
      choices: ['error', 'warn', 'info', 'debug', 'verbose'],
      default: 'info',
      desc: 'Logging level',
    }),
    LOG_FORMAT: str({
      choices: ['json', 'pretty'],
      default: 'pretty',
      desc: 'Logging format',
    }),
  });

  const config: LoggerConfig = {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT as LoggerFormat,

    // Pretty format configuration
    prettyOptions: {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname,req,res',
      messageFormat: '{method} {url} {msg} - {res.statusCode}',
    },

    // JSON format configuration
    jsonOptions: {
      colorize: false,
      levelFirst: false,
      translateTime: false,
    },

    // Log formatters
    formatters: {
      level: (label: string) => ({
        level: `${label.toUpperCase()}`,
      }),
      bindings: (bindings: any) => ({
        pid: bindings.pid,
        hostname: bindings.hostname,
      }),
    },
  };

  return config;
};

export default registerAs('logger', getLoggerConfig);
