import { MCPService } from './protocol/MCPService';
import { RAGAgent } from './core/RAGAgent';
import { DocumentRetriever } from './retrieval/DocumentRetriever';
import { logSection, logError, logDebug } from './utils/logger';
import appConfig from './config/AppConfig';
import { ensureDirectoryExists } from './utils/helpers';
import fs from 'fs';
import path from 'path';

// Initialize MCP services
const fetchMCP = new MCPService('mcp-server-fetch', 'uvx', ['mcp-server-fetch']);

const fileMCP = new MCPService('mcp-server-file', 'npx', [
  '-y',
  '@modelcontextprotocol/server-filesystem',
  appConfig.fsConfig.outputDir,
]);

async function main() {
  try {
    logSection('Starting', 'Initializing application...');

    // Ensure required directories exist
    ensureDirectoryExists(appConfig.fsConfig.outputDir);
    ensureDirectoryExists(appConfig.fsConfig.knowledgeDir);
    logDebug(
      'Directories',
      `Output: ${appConfig.fsConfig.outputDir}\nKnowledge: ${appConfig.fsConfig.knowledgeDir}`
    );

    // Initialize document retriever
    const retriever = new DocumentRetriever(appConfig.modelConfig.embeddingModel);
    logSection('Retriever', `Initialized with model: ${appConfig.modelConfig.embeddingModel}`);

    // Process knowledge base documents
    const context = await processKnowledgeBase(retriever);
    logSection('Context', `Retrieved ${context.split('\n').length} relevant documents`);
    console.log(context);

    // Initialize RAG agent
    const agent = new RAGAgent(
      appConfig.modelConfig.llmModel,
      [fetchMCP, fileMCP],
      appConfig.llmPrompt,
      context
    );

    // Execute task
    logSection('Task', 'Starting task execution...');
    await agent.init();
    await agent.invoke(appConfig.taskConfig.description);
    await agent.close();

    logSection('Execution', 'Task completed successfully');
  } catch (error) {
    logError(error as Error, 'Main execution');
    console.error('\nDetailed error information:');
    if (error instanceof Error) {
      console.error(`Name: ${error.name}`);
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

async function processKnowledgeBase(retriever: DocumentRetriever): Promise<string> {
  try {
    const files = fs.readdirSync(appConfig.fsConfig.knowledgeDir);
    logSection('Knowledge Base', `Found ${files.length} documents in knowledge base`);

    // Process all knowledge base documents
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(appConfig.fsConfig.knowledgeDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        await retriever.addDocument(content);
        logDebug('Document Processing', `Processed: ${file}`);
      })
    );

    // Retrieve relevant documents
    const relevantDocs = await retriever.searchSimilarDocuments(
      appConfig.taskConfig.description,
      3
    );

    return relevantDocs.join('\n');
  } catch (error) {
    logError(error as Error, 'Knowledge base processing');
    throw error;
  }
}

// Run application
main();
