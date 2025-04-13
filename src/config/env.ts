import 'dotenv/config';

export interface EnvironmentConfig {
  openai: {
    apiKey: string;
    baseUrl: string;
  };
  embedding: {
    baseUrl: string;
    apiKey: string;
  };
}

function validateEnvVariables(): EnvironmentConfig {
  const requiredVars = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'OPENAI_BASE_URL': process.env.OPENAI_BASE_URL,
    'EMBEDDING_BASE_URL': process.env.EMBEDDING_BASE_URL,
    'EMBEDDING_KEY': process.env.EMBEDDING_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      baseUrl: process.env.OPENAI_BASE_URL!,
    },
    embedding: {
      baseUrl: process.env.EMBEDDING_BASE_URL!,
      apiKey: process.env.EMBEDDING_KEY!,
    },
  };
}

export const envConfig = validateEnvVariables(); 