import { logSection } from '../utils/logger';

export interface VectorDocument {
    embedding: number[];
    content: string;
}

export class VectorDatabase {
    private documents: VectorDocument[];

    constructor() {
        this.documents = [];
    }

    async addDocument(embedding: number[], content: string): Promise<void> {
        this.documents.push({ embedding, content });
        logSection('Vector Database', `Added document. Total documents: ${this.documents.length}`);
    }

    async searchSimilar(queryEmbedding: number[], topK: number = 3): Promise<string[]> {
        const scored = this.documents.map(doc => ({
            content: doc.content,
            score: this.calculateCosineSimilarity(queryEmbedding, doc.embedding),
        }));

        const results = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.content);

        logSection('Vector Search', `Found ${results.length} similar documents`);
        return results;
    }

    private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
        const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
        const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (normA * normB);
    }

    getStats(): { documentCount: number } {
        return {
            documentCount: this.documents.length,
        };
    }

    async clear(): Promise<void> {
        this.documents = [];
        logSection('Vector Database', 'Database cleared');
    }
}