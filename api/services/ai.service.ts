import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// 延迟初始化，如果环境变量不存在也不抛错，在实际调用时再检查
let openai: OpenAI | null = null;

const getOpenAIClient = () => {
  // 每次调用都重新获取环境变量，确保能拿到最新的值
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  
  if (!openai || openai.apiKey !== apiKey || openai.baseURL !== baseURL) {
    openai = new OpenAI({
      apiKey: apiKey || 'dummy_key_for_init',
      baseURL,
    });
  }
  return openai;
};

export const aiService = {
  async generateSummary(workData: any, userRole: 'programmer' | 'normal', customPrompt?: string): Promise<string> {
    try {
      console.log('Using API KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not Set');
      console.log('Using BASE URL:', process.env.OPENAI_BASE_URL);
      console.log('Using MODEL:', process.env.OPENAI_MODEL_NAME);
      
      // 在后端运行的环境中，如果发现没有配置Key，或者配置了占位符，返回模拟数据
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'dummy_key_for_init' || apiKey === 'your_dashscope_api_key_here' || apiKey === '') {
        console.warn('OPENAI_API_KEY is not set or invalid, returning mock data. Current Key:', apiKey);
        // 如果没有配置有效的API Key，返回模拟数据
        return userRole === 'programmer' 
          ? `[本地模拟总结] 今天主要负责了${workData.projects.join('、')}等项目的开发，提交记录如下：\n${workData.commits}\n\n（注：请在后端环境正确加载真实的 API Key 以获取 AI 总结）`
          : `[本地模拟总结] 今日完成了以下工作项：\n${workData.workItems.map((item: any) => `- ${item.content} (耗时: ${item.duration}h)`).join('\n')}\n\n（注：请在后端环境正确加载真实的 API Key 以获取 AI 总结）`;
      }

      const client = getOpenAIClient();
      let prompt = '';
      const preference = typeof customPrompt === 'string' ? customPrompt.trim() : '';
      
      if (userRole === 'programmer') {
        prompt = `
作为一位专业的资深开发工程师，请根据以下提供的代码提交记录(commits)和涉及的项目信息，生成一份向技术Leader或项目经理汇报的今日工作总结。

要求：
1. 语气客观、专业、精炼，体现工程师的严谨性。
2. 以项目为维度进行分类总结。
3. 必须从底层的 commit 记录中提炼出业务价值或技术难点，切忌只写"修改了代码"或"修复了bug"。例如：如果 commit 是 "fix: user login npe"，应总结为 "修复了用户登录模块的空指针异常，提升了系统稳定性"。
4. 突出开发进度、重构优化、性能提升或问题修复等核心技术产出。
5. 将所有内容合并为一份完整的单日工作汇总。
6. 总字数严格控制在150字左右，排版清晰，可使用精简的列表。

工作数据：
涉及项目：${workData.projects.join(', ')}
详细提交记录：
${workData.commits}
`;
      } else {
        prompt = `
作为一位高效的职场专业人士，请根据以下提供的工作项记录和耗时，生成一份向直属领导汇报的今日工作总结。

要求：
1. 语气客观、干练、结果导向。
2. 按照核心任务或项目进行归类总结，体现工作条理性。
3. 必须结合"工作项内容"和"耗时"，提炼出今天的主要精力投入点和核心产出。如果某些任务耗时较长，请着重强调其产出或推进的阶段性节点。
4. 过滤掉过于琐碎的日常杂事，聚焦在对业务有实际价值的工作上。
5. 将所有内容合并为一份完整的单日工作汇总。
6. 总字数严格控制在150字左右，排版清晰，可使用精简的列表。

工作数据：
工作项及耗时：
${workData.workItems.map((item: any) => `- ${item.content} (耗时: ${item.duration}h)`).join('\n')}
`;
      }

      // 允许通过环境变量配置模型名称，默认为 gpt-3.5-turbo
      const model = process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';

      const messages = [
        {
          role: 'system' as const,
          content: '你是一个专业、高效的职场工作总结助手，擅长将零散的工作记录整理成向领导汇报的精炼总结。'
        },
        ...(preference
          ? [{
              role: 'system' as const,
              content: `请严格遵循以下用户定制要求（如与其他要求冲突，以用户定制要求为准）：\n${preference}`
            }]
          : []),
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const createCompletion = async () => {
        return client.chat.completions.create({
          model,
          messages,
          temperature: 0.5,
        });
      };

      let response: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await createCompletion();
          break;
        } catch (e: any) {
          const status = e?.status;
          const retryable = status === 429 || status === 503 || status === 502 || status === 504;
          if (!retryable || attempt === 2) throw e;
          const waitMs = 500 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }

      return response.choices[0]?.message?.content || '未能生成总结，请稍后再试。';
    } catch (error: any) {
      console.error('AI Summary Generation Error:', error);
      // 如果调用真实接口失败，为了不阻断流程，也可以返回一个友好的提示或者带有错误信息的模拟文本
      throw new Error(`AI生成失败: ${error.message || '未知错误'}`);
    }
  }
};
