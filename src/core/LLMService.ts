import OpenAI from 'openai';
import { envConfig } from '../config/env';
import { logError, logSection } from '../utils/logger';

export class LLMService {
  private openai: OpenAI;
  private readonly modelName: string;
  private messages: Array<OpenAI.Chat.ChatCompletionMessageParam>;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.messages = [
      {
        role: 'system',
        content: `You are an intelligent assistant responsible for processing and generating documents. Please always return results in the following JSON format:
{
  "content": "generated content",
  "filename": "file name to save"
}
Content should be formatted Markdown text, and the filename should include appropriate extension (e.g. .md).`,
      },
    ];
    this.openai = new OpenAI({
      apiKey: envConfig.openai.apiKey,
      baseURL: envConfig.openai.baseUrl,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Validate model availability
      await this.openai.models.retrieve(this.modelName);
      logSection('LLM Service', `Initialized with model: ${this.modelName}`);
    } catch (error) {
      logError(error as Error, 'LLM Service initialization');
      throw error;
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      // Add user message
      this.messages.push({
        role: 'user',
        content: prompt,
      });

      // Get LLM response
      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: this.messages,
        // temperature: 0.7,
        response_format: { type: 'json_object' },
        // tools: this.
      });

      // Add assistant response to message history
      const assistantMessage = response.choices[0].message;
      this.messages.push(assistantMessage);

      return assistantMessage.content || '';
    } catch (error) {
      logError(error as Error, 'LLM response generation');
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // Clear message history
    this.messages = [];
    logSection('LLM Service', 'Cleanup completed');
  }

  // Get current conversation history
  getConversationHistory(): Array<OpenAI.Chat.ChatCompletionMessageParam> {
    return [...this.messages];
  }

  // Clear conversation history
  clearConversationHistory(): void {
    this.messages = [];
    logSection('LLM Service', 'Conversation history cleared');
  }
}
