<template>
  <div class="novel-generator">
    <h1>小说章节生成器</h1>
    
    <!-- 配置输入区域 -->
    <div class="config-section">
      <h2>章节配置</h2>
      <textarea 
        v-model="userConfigJson" 
        placeholder="请输入章节配置（JSON格式）"
        rows="10"
        cols="50"
      ></textarea>
    </div>

    <!-- 历史记录区域 -->
    <div class="history-section">
      <h2>历史记录</h2>
      <textarea 
        v-model="history" 
        placeholder="请输入历史记录"
        rows="5"
        cols="50"
      ></textarea>
    </div>

    <!-- 控制按钮 -->
    <div class="control-section">
      <button @click="generateChapter" :disabled="isGenerating">
        {{ isGenerating ? '生成中...' : '生成章节' }}
      </button>
      <button @click="clearContent" :disabled="isGenerating">清空内容</button>
    </div>

    <!-- 生成内容显示区域 -->
    <div class="result-section">
      <h2>生成内容</h2>
      <div class="stats">
        <p>字符数量: {{ characterCount }}</p>
        <p>汉字数量: {{ chineseCount }}</p>
      </div>
      <div class="content-display">
        <pre>{{ generatedContent }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { generateContent, processStream, defaultSystemConfig } from '../utils/server.js';

export default {
  name: 'NovelGenerator',
  data() {
    return {
      isGenerating: false,
      generatedContent: '',
      characterCount: 0,
      chineseCount: 0,
      history: '',
      userConfigJson: JSON.stringify({
        "章节主题": "主角的冒险旅程",
        "关键事件": "发现神秘宝物",
        "出场人物": ["主角", "伙伴", "反派"],
        "环境设定": "古老的山洞"
      }, null, 2)
    };
  },
  methods: {
    async generateChapter() {
      try {
        this.isGenerating = true;
        this.generatedContent = '开始生成...\n';

        // 解析用户配置
        let userConfig;
        try {
          userConfig = JSON.parse(this.userConfigJson);
        } catch (error) {
          alert('配置格式错误，请检查JSON格式');
          return;
        }

        // 调用生成函数
        const stream = await generateContent({
          systemConfig: defaultSystemConfig,
          history: this.history,
          userConfig: userConfig
        });

        // 处理流式响应
        const result = await processStream(stream, (update) => {
          this.generatedContent = update.content;
          this.characterCount = update.characterCount;
          this.chineseCount = update.chineseCount;
        });

        console.log('生成完成', result);
        
      } catch (error) {
        console.error('生成失败:', error);
        this.generatedContent = `生成失败: ${error.message}`;
      } finally {
        this.isGenerating = false;
      }
    },

    clearContent() {
      this.generatedContent = '';
      this.characterCount = 0;
      this.chineseCount = 0;
    }
  }
}
</script>

<style scoped>
.novel-generator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.config-section, .history-section, .result-section {
  margin-bottom: 20px;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
}

.control-section {
  margin: 20px 0;
}

button {
  padding: 10px 20px;
  margin-right: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

.content-display {
  border: 1px solid #ddd;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.stats p {
  margin: 0;
  font-weight: bold;
  color: #666;
}
</style>