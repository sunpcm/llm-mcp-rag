# LLM-MCP-RAG-JS

# LLM-MCP-RAG-JS

> **提示**: 如果需要 Python 版本的实现，请访问 [LLM-MCP-RAG-Python](https://github.com/sunpcm/llm-mcp-rag-python)。

## 项目架构

项目采用模块化设计，主要包含以下核心组件：

### 目录结构
```
src/
├── core/          # 核心业务逻辑
├── protocol/      # MCP 协议实现
├── retrieval/     # 文档检索相关实现
├── utils/         # 工具函数
└── config/        # 配置文件
```

### 核心组件

1. **MCP Service** (`src/protocol/MCPService.ts`)
   - 负责与 MCP 服务器的通信
   - 管理工具注册和调用
   - 实现了重试机制和错误处理

2. **Document Retrieval** (`src/retrieval/`)
   - 实现文档检索功能
   - 支持文档的加载和向量化
   - 提供相似度搜索

3. **RAG Agent** (`src/core/`)
   - 协调 MCP 服务和文档检索
   - 处理用户查询
   - 生成上下文增强的响应

## 技术栈

- **运行时环境**: Node.js
- **开发语言**: TypeScript
- **包管理器**: pnpm
- **主要依赖**:
  - `@modelcontextprotocol/sdk`: MCP 协议实现
  - `openai`: OpenAI API 客户端
  - `zod`: 类型验证
  - `dotenv`: 环境变量管理
  - `chalk`: 终端输出美化

## 配置和运行

### 环境要求

- Node.js >= 18
- pnpm >= 10.6.3

### 安装依赖

```bash
pnpm install
```

### 环境变量配置

创建 `.env` 文件并配置以下环境变量：

```env
EMBEDDING_BASE_URL=https://oneapi.biubiuniu.com
EMBEDDING_KEY=your_embedding_api_key
OPENAI_BASE_URL=https://oneapi.biubiuniu.com
OPENAI_API_KEY=your_llm_api_key
# 其他必要的环境变量
```

### 开发运行

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 生产运行
pnpm start
```

## 待改进方向

1. **错误处理优化**
   - 实现更细粒度的错误类型
   - 添加错误重试策略配置
   - 改进错误日志记录

2. **性能优化**
   - 实现文档缓存机制
   - 优化向量检索性能
   - 添加批处理支持

3. **可观测性**
   - 添加详细的日志记录
   - 实现性能指标收集
   - 添加监控接口

4. **测试覆盖**
   - 添加单元测试
   - 添加集成测试
   - 实现端到端测试

5. **文档完善**
   - 添加 API 文档
   - 完善使用示例
   - 添加贡献指南

## 使用示例

```typescript
import { MCPService } from './protocol/MCPService';
import { DocumentRetriever } from './retrieval/DocumentRetriever';
import { RAGAgent } from './core/RAGAgent';

// 初始化服务
const mcpService = new MCPService('my-service', 'mcp-server');
await mcpService.initialize();

// 初始化文档检索
const retriever = new DocumentRetriever();
await retriever.loadDocuments('./knowledge');

// 创建 RAG Agent
const agent = new RAGAgent(mcpService, retriever);

// 处理查询
const response = await agent.process('你的问题');
```

> 本项目部分代码参考了 [KelvinQiu802/llm-mcp-rag](https://github.com/KelvinQiu802/llm-mcp-rag)，在此表示感谢。# LLM-MCP-RAG
