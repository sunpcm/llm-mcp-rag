import path from 'path';

// Application configuration interface
export interface AppConfiguration {
  // Model configuration
  modelConfig: {
    embeddingModel: string; // Document embedding model
    llmModel: string; // Language model
  };

  // Service configuration
  serviceConfig: {
    baseUrl: string; // Service base URL
  };

  // File system configuration
  fsConfig: {
    outputDir: string; // Output directory
    knowledgeDir: string; // Knowledge base directory
  };

  // Task configuration
  taskConfig: {
    description: string; // Task description
  };
  llmPrompt: string;
}

// Default configuration
const appConfig: AppConfiguration = {
  modelConfig: {
    embeddingModel: 'text-embedding-3-small',
    llmModel: 'gpt-4o-mini',
  },
  serviceConfig: {
    baseUrl: 'https://en.wikipedia.org/wiki/Iron_Man',
  },
  fsConfig: {
    outputDir: path.join(process.cwd(), 'output'),
    knowledgeDir: path.join(process.cwd(), 'knowledge'),
  },
  taskConfig: {
    description: `
    告诉我Wukong的信息,先从我给你的context中找到相关信息,然后选取https://movie.douban.com/chart里一个电影，根据其标题和简介，总结后创作一个关于她的故事
把电影名字，故事和她的基本信息保存到${path.join(process.cwd(), 'output')}/wukong.md,输出一个漂亮md文件
`,
  },
  llmPrompt: `You are a professional writing assistant. Please complete the writing task based on the provided context.
      Generate content in structured Markdown format, including appropriate headings, paragraphs, and formatting.`,
};

// Configuration validation function
export function validateConfiguration(config: AppConfiguration): void {
  const validateField = (obj: any, path: string[] = []): void => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];
      if (typeof value === 'object' && value !== null) {
        validateField(value, currentPath);
      } else if (value === undefined || value === null || value === '') {
        throw new Error(`Missing required configuration: ${currentPath.join('.')}`);
      }
    }
  };

  validateField(config);
}

// Validate default configuration
validateConfiguration(appConfig);

export default appConfig;
