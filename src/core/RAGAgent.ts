import { LLMService } from './LLMService';
import { MCPService } from '../protocol/MCPService';
import { logSection, logError } from '../utils/logger';

export class RAGAgent {
    private llmService: LLMService;
    private mcpServices: MCPService[];
    private systemPrompt: string;
    private context: string;

    constructor(
        modelName: string,
        mcpServices: MCPService[],
        systemPrompt: string = '',
        context: string = ''
    ) {
        this.llmService = new LLMService(modelName);
        this.mcpServices = mcpServices;
        this.systemPrompt = systemPrompt;
        this.context = context;
    }

    async init(): Promise<void> {
        try {
            // Initialize LLM service
            await this.llmService.initialize();
            
            // Initialize all MCP services
            await Promise.all(this.mcpServices.map(service => service.initialize()));
            
            logSection('Initialization', 'All services initialized successfully');
        } catch (error) {
            logError(error as Error, 'RAGAgent initialization');
            throw error;
        }
    }

    async invoke(task: string): Promise<void> {
        try {
            // Build complete prompt
            const fullPrompt = this.buildPrompt(task);
            
            // Call LLM service to get response
            const response = await this.llmService.generateResponse(fullPrompt);
            
            // Process LLM response
            await this.processResponse(response);
            
            logSection('Task Completion', 'Task executed successfully');
        } catch (error) {
            logError(error as Error, 'RAGAgent task execution');
            throw error;
        }
    }

    private buildPrompt(task: string): string {
        const components = [
            this.systemPrompt,
            'Context:',
            this.context,
            'Task:',
            task,
            '\nPlease return the result in the following format:\n{content: "generated content", filename: "file name to save"}'
        ].filter(Boolean);

        return components.join('\n\n');
    }

    private async processResponse(response: string): Promise<void> {
        try {
            // Parse LLM response
            const parsedResponse = this.parseResponse(response);
            if (!parsedResponse) {
                throw new Error('Invalid response format from LLM');
            }

            // Get file system MCP service
            const fileMCP = this.mcpServices.find(service => 
                service.getAvailableTools().some(tool => tool.name === 'writeFile')
            );

            if (!fileMCP) {
                throw new Error('File system MCP service not found');
            }

            // Write file
            await fileMCP.executeTool('writeFile', {
                path: parsedResponse.filename,
                content: parsedResponse.content
            });

            logSection('File Creation', `Successfully created file: ${parsedResponse.filename}`);
        } catch (error) {
            logError(error as Error, 'Response processing');
            throw error;
        }
    }

    private parseResponse(response: string): { content: string; filename: string } | null {
        try {
            // Try to parse JSON directly
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                const jsonStr = match[0];
                const parsed = JSON.parse(jsonStr);
                if (parsed.content && parsed.filename) {
                    return parsed;
                }
            }

            // If direct parsing fails, try to extract information from text
            const contentMatch = response.match(/content:\s*"([^"]*)"/);
            const filenameMatch = response.match(/filename:\s*"([^"]*)"/);
            
            if (contentMatch && filenameMatch) {
                return {
                    content: contentMatch[1],
                    filename: filenameMatch[1]
                };
            }

            return null;
        } catch (error) {
            logError(error as Error, 'Response parsing');
            return null;
        }
    }

    async close(): Promise<void> {
        try {
            // Close all services
            await Promise.all([
                this.llmService.cleanup(),
                ...this.mcpServices.map(service => service.cleanup())
            ]);
            
            logSection('Cleanup', 'All services closed successfully');
        } catch (error) {
            logError(error as Error, 'RAGAgent cleanup');
            throw error;
        }
    }
}