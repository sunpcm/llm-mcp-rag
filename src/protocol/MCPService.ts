import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logSection, logError, logDebug } from '../utils/logger';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { sleep } from '../utils/helpers';

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class MCPService {
  private readonly serviceName: string;
  private readonly command: string;
  private readonly args: string[];
  private tools: Tool[] = [];
  private readonly mcp: Client;
  private transport: StdioClientTransport | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(serviceName: string, command: string, args: string[] = []) {
    this.serviceName = serviceName;
    this.command = command;
    this.args = args;
    this.mcp = new Client({
      name: serviceName,
      version: '0.0.1',
      tools: [
        {
          name: 'writeFile',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['path', 'content'],
          },
        },
      ],
    });
  }

  async initialize(): Promise<void> {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.initializeInternal();
        return;
      } catch (error) {
        retries++;
        if (retries >= this.maxRetries) {
          logError(
            error as Error,
            `MCP Service initialization failed after ${this.maxRetries} attempts`
          );
          throw error;
        }
        logDebug('Initialization retry', `Attempt ${retries} of ${this.maxRetries}`);
        await sleep(this.retryDelay * retries);
      }
    }
  }

  private async initializeInternal(): Promise<void> {
    try {
      // Create MCP client transport layer
      this.transport = new StdioClientTransport({
        command: this.command,
        args: this.args,
      });

      // Connect to MCP service
      await this.mcp.connect(this.transport);

      // Get available tools list
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      // Add built-in tools
      if (this.serviceName === 'mcp-server-file') {
        this.tools.push({
          name: 'writeFile',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['path', 'content'],
          },
        });
      }

      logSection('MCP Service', `Initialized ${this.serviceName} with ${this.tools.length} tools`);
      logSection('MCP Tools', JSON.stringify(this.tools.map((n) => n.name)));
      logDebug('Available tools', this.tools.map((t) => t.name).join(', '));
    } catch (error) {
      logError(error as Error, 'MCP Service initialization');
      throw error;
    }
  }

  async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        return await this.executeToolInternal(toolName, parameters);
      } catch (error) {
        retries++;
        if (retries >= this.maxRetries) {
          logError(error as Error, `Tool execution failed after ${this.maxRetries} attempts`);
          throw error;
        }
        logDebug('Tool execution retry', `Attempt ${retries} of ${this.maxRetries}`);
        await sleep(this.retryDelay * retries);
      }
    }
  }

  private async executeToolInternal(
    toolName: string,
    parameters: Record<string, any>
  ): Promise<any> {
    const tool = this.tools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    logSection('Tool Execution', `Executing ${toolName}`);
    logDebug('Tool parameters', JSON.stringify(parameters, null, 2));

    if (toolName === 'writeFile') {
      // Special handling for file writing
      const fs = await import('fs/promises');
      const { path: filePath, content } = parameters;
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    }

    const result = await this.mcp.callTool({
      name: toolName,
      arguments: parameters,
    });

    logDebug('Tool result', JSON.stringify(result, null, 2));
    return result;
  }

  getAvailableTools(): Tool[] {
    return [...this.tools];
  }

  async cleanup(): Promise<void> {
    try {
      if (this.transport) {
        this.transport.close();
      }
      if (this.mcp) {
        await this.mcp.close();
      }
      logSection('MCP Service', `${this.serviceName} cleaned up`);
    } catch (error) {
      logError(error as Error, 'MCP Service cleanup');
      throw error;
    }
  }
}
