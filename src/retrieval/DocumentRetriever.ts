import OpenAI from 'openai';
import { envConfig } from '../config/env';
import { VectorDatabase } from './VectorDatabase';
import { logSection, logError } from '../utils/logger';

export class DocumentRetriever {
  private readonly embeddingModel: string;
  private vectorDb: VectorDatabase;
  private openai: OpenAI;

  constructor(embeddingModel: string) {
    this.embeddingModel = embeddingModel;
    this.vectorDb = new VectorDatabase();
    this.openai = new OpenAI({
      apiKey: envConfig.openai.apiKey,
      baseURL: envConfig.openai.baseUrl,
    });
  }

  async addDocument(document: string): Promise<number[]> {
    try {
      const embedding = await this.generateEmbedding(document);
      await this.vectorDb.addDocument(embedding, document);
      logSection('Document Added', `Successfully embedded document`);
      return embedding;
    } catch (error) {
      logError(error as Error, 'Document embedding');
      throw error;
    }
  }

  async searchSimilarDocuments(query: string, topK: number = 3): Promise<string[]> {
    try {
      logSection('Search Query', query);
      const queryEmbedding = await this.generateEmbedding(query);
      const results = await this.vectorDb.searchSimilar(queryEmbedding, topK);
      logSection('Search Results', `Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      logError(error as Error, 'Document search');
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      logError(error as Error, 'Embedding generation');
      throw error;
    }
  }

  // Get vector database statistics
  getStats(): { documentCount: number } {
    return this.vectorDb.getStats();
  }

  // Clear vector database
  async cleanup(): Promise<void> {
    await this.vectorDb.clear();
    logSection('Retriever Cleanup', 'Vector database cleared');
  }
}
