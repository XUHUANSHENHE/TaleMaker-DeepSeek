<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <header class="header">
      <h1>DeepSeek 无限制小说生成框架</h1>
    </header>

    <!-- 主体内容 -->
    <main class="main-content">
      <!-- 参数设置模块 -->
      <section class="module parameter-settings">
        <h2>参数设置</h2>
        <div class="module-content">
          <!-- API密钥设置 -->
          <div class="config-section api-config">
            <h3>🔑 API配置</h3>
            <div class="input-group">
              <label for="apiKey">DeepSeek API Key:</label>
              <div class="input-with-button">
                <input 
                  id="apiKey"
                  v-model="apiKey" 
                  :type="showApiKey ? 'text' : 'password'" 
                  placeholder="请输入您的key"
                  class="input-field"
                />
                <button @click="toggleApiKeyVisibility" class="btn-secondary">
                  {{ showApiKey ? '隐藏' : '显示' }}
                </button>
                <!-- 新增：获取密钥按钮 -->
                <button @click="goToGetAPIKey" class="btn-secondary get-key-btn">
                  获取密钥
                </button>
              </div>
            </div>
          </div>

          <!-- 基础设定 -->
          <div class="config-section basic-config">
            <h3>⚙️ 基础设定</h3>

            <div class="input-group">
              <label for="perspective">人称视角:</label>
              <select v-model="perspective" id="perspective" class="select-field">
                <option value="第一人称">第一人称</option>
                <option value="第二人称">第二人称</option>
                <option value="第三人称">第三人称</option>
                <option value="上帝视角">上帝视角</option>
              </select>
            </div>

            <div class="input-group">
              <label for="worldView">世界观设定:</label>
              <textarea 
                id="worldView"
                v-model="worldView" 
                placeholder="架空/现实/修仙 可详细设定"
                class="textarea-field"
                rows="3"
              ></textarea>
            </div>
            
            <div class="input-group">
              <label for="additionalInfo">其他信息:</label>
              <textarea 
                id="additionalInfo"
                v-model="additionalInfo" 
                placeholder="语言风格/特殊用词等其他要求"
                class="textarea-field"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- 章节配置 -->
          <div class="config-section chapter-config">
            <h3>📖 章节配置</h3>
            <div class="input-row">
              <div class="input-group">
                <label for="chapterNumber">第几章:</label>
                <input 
                  id="chapterNumber"
                  v-model.number="chapterNumber" 
                  type="number" 
                  min="1"
                  class="input-field"
                />
              </div>
              
              <div class="input-group">
                <label for="chapterName">章节命名:</label>
                <input 
                  id="chapterName"
                  v-model="chapterName" 
                  class="input-field"
                />
              </div>
            </div>

            <!-- 角色管理 -->
            <div class="input-group">
              <label>角色配置:</label>
              <div v-for="(character, index) in characters" :key="index" class="character-juese">
                <input 
                  v-model="character.name"
                  placeholder="角色姓名"
                  class="input-field small"
                />
    
                <textarea 
                  v-model="character.setting"
                  placeholder="角色设定"
                  class="textarea-field small"
                  rows="2"
                ></textarea>
  
                <button @click="removeCharacter(index)" class="btn-danger">删除</button>
              </div>
              <button @click="addCharacter" class="btn-secondary">添加角色</button>
            </div>

            <!-- 情节要求 -->
            <div class="input-group">
              <label for="plotRequirement">情节要求:</label>
              <textarea 
                id="plotRequirement"
                v-model="plotRequirement" 
                placeholder="例如：主角在森林中遇到神秘老人，获得重要线索..."
                class="textarea-field"
                rows="3"
              ></textarea>
            </div>

            <!-- 参数管理按钮 -->
            <div class="input-group">
              <div class="parameter-actions">
                <button @click="saveCurrentParameters" class="btn-secondary">
                  保存当前参数
                </button>
                <button @click="resetParameters" class="btn-danger">
                  重置参数
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 生成预览模块 -->
      <section class="module preview">
        <div class="module-header">
          <h2>生成预览</h2>
          <div class="header-actions">
            <button 
              @click="generateNovel" 
              :disabled="!canGenerate || isGenerating"
              class="btn-primary generate-btn"
            >
              {{ isGenerating ? '生成中...' : '生成小说章节' }}
            </button>
            <button 
              v-if="!isGenerating && currentContent"
              @click="toggleEditMode"
              class="btn-secondary"
            >
              {{ isEditing ? '退出编辑' : '编辑内容' }}
            </button>
          </div>
        </div>
        <div class="module-content">
          <!-- 导入状态指示器 -->
          <div v-if="isImporting" class="importing-indicator">
            <div class="spinner"></div>
            <p>正在导入数据，请稍候...</p>
          </div>
          
          <!-- 生成状态指示器 -->
          <div v-if="isGenerating" class="generating-indicator">
            <div class="spinner"></div>
            <p>正在生成内容，请稍候...</p>
            <p class="stats">已生成 {{ currentStats.chineseCount }} 个中文字符</p>
          </div>
          
          <!-- 实时内容显示区域 -->
          <div class="preview-content" :class="{ 'generating': isGenerating, 'editing': isEditing }">
            <div class="content-display">
              <div class="content-header">
                <h3>{{ currentChapterTitle }}</h3>
                <div v-if="isEditing" class="edit-actions">
                  <button @click="saveEditedContent" class="btn-success small">保存修改</button>
                  <button @click="cancelEdit" class="btn-secondary small">取消</button>
                </div>
              </div>
              
              <!-- 编辑模式 -->
              <textarea 
                v-if="isEditing"
                v-model="editingContent"
                class="content-textarea"
                placeholder="请在此编辑小说内容..."
                rows="20"
              ></textarea>
              
              <!-- 阅读模式 -->
              <div v-else class="content-text" ref="contentText">
                <template v-if="isGenerating && displayedContent">
                  <span class="streaming-text">{{ displayedContent }}</span>
                  <span class="streaming-cursor">|</span>
                </template>
                <template v-else-if="currentContent">
                  {{ currentContent.content }}
                </template>
                <template v-else>
                  <div class="placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>生成的小说内容预览区域</p>
                    <p>设置好参数后点击生成按钮开始创作</p>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- 统计信息 -->
            <div v-if="displayedContent || currentContent" class="content-stats">
              <p>总字符数: {{ currentStats.characterCount }} | 中文字符: {{ currentStats.chineseCount }}</p>
            </div>
            
            <!-- 操作按钮 -->
            <div v-if="!isGenerating && currentContent && !isEditing" class="preview-actions">
              <button @click="saveCurrentContent" class="btn-success">保存到历史</button>
              <button @click="clearCurrentContent" class="btn-secondary">清空预览</button>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 已生成内容查看模块 -->
      <section class="module history">
        <div class="module-header">
          <h2>已生成内容</h2>
          <div class="header-actions">
            <button 
              v-if="history.length > 0"
              @click="downloadAllChapters"
              class="btn-primary"
            >
              下载全本
            </button>
            <!-- 新增：导入全本按钮 -->
            <button 
              @click="importAllChapters"
              class="btn-secondary"
            >
              导入全本
            </button>
          </div>
        </div>
        <div class="module-content">
          <div v-if="history.length === 0" class="placeholder">
            <div class="placeholder-icon">📚</div>
            <p>暂无历史记录</p>
            <p>生成的章节将显示在这里</p>
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="(item, index) in sortedHistory" 
              :key="index" 
              class="history-item"
              :class="{ 
                active: selectedHistoryIndex === index,
                edited: item.isEdited,
                imported: item.imported 
              }"
              @click="selectHistoryItem(index)"
            >
              <div class="history-item-header">
                <h4>{{ item.chapterTitle }}</h4>
                <div class="item-badges">
                  <span v-if="item.isEdited" class="edited-badge">已编辑</span>
                  <span v-if="item.imported" class="imported-badge">已导入</span>
                </div>
              </div>
              <p class="preview-text">{{ getContentPreview(item.content) }}</p>
              <p class="meta-info">
                字符: {{ item.characterCount }} | 中文: {{ item.chineseCount }} | 
                {{ formatDate(item.timestamp) }}
              </p>
              <div class="history-actions">
                <button @click.stop="viewContent(item)" class="btn-secondary small">
                  查看
                </button>
                <button @click.stop="editHistoryItem(item, index)" class="btn-secondary small">
                  编辑
                </button>
                <button @click.stop="downloadContent(item)" class="btn-secondary small">
                  下载
                </button>
                <button @click.stop="deleteHistoryItem(index)" class="btn-danger small">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { generateContent, processStream, buildSystemConfig, buildUserConfig, countChineseCharacters } from './novelGenerator';

export default {
  name: 'NovelGenerator',
  data() {
    return {
      // API配置
      apiKey: '',
      showApiKey: false,
      
      // 基础设定
      worldView: '',
      perspective: '第三人称',
      additionalInfo: '',
      
      // 章节配置
      chapterNumber: 1,
      chapterName: '',
      characters: [
        { name: '', setting: '' }
      ],
      plotRequirement: '',
      
      // 生成状态
      isGenerating: false,
      currentContent: null,
      displayedContent: '', // 实时显示的内容
      currentStats: {
        characterCount: 0,
        chineseCount: 0
      },
      
      // 编辑状态
      isEditing: false,
      editingContent: '',
      editingIndex: -1, // 正在编辑的历史项索引
      originalContent: '', // 编辑前的原始内容
      
      // 历史记录
      history: [],
      selectedHistoryIndex: -1,
      
      // 新增：参数版本控制
      parametersVersion: '1.0',
      
      // 新增：导入文件相关
      isImporting: false
    };
  },
  computed: {
    canGenerate() {
      return this.apiKey && this.worldView && this.perspective && this.chapterNumber > 0;
    },
    currentChapterTitle() {
      if (this.currentContent) {
        return this.currentContent.chapterTitle;
      }
      return `第${this.chapterNumber}章${this.chapterName ? `: ${this.chapterName}` : ''}`;
    },
    sortedHistory() {
      // 按章节号排序
      return [...this.history].sort((a, b) => {
        const getChapterNum = (title) => {
          const match = title.match(/第(\d+)章/);
          return match ? parseInt(match[1]) : 0;
        };
        return getChapterNum(a.chapterTitle) - getChapterNum(b.chapterTitle);
      });
    }
  },
  watch: {
    // 监听主要参数变化并自动保存
    worldView(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    perspective(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    additionalInfo(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    chapterNumber(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    chapterName(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    plotRequirement(newVal) {
      if (newVal !== undefined) {
        this.debouncedSaveParameters();
      }
    },
    characters: {
      handler(newVal) {
        if (newVal !== undefined) {
          this.debouncedSaveParameters();
        }
      },
      deep: true
    }
  },
  mounted() {
    this.loadHistory();
    this.loadAllParameters();
  },
  created() {
    // 创建防抖的保存函数
    this.debouncedSaveParameters = this.debounce(() => {
      this.saveAllParameters();
    }, 1000);
  },
  methods: {
    // 防抖函数
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // API密钥显示切换
    toggleApiKeyVisibility() {
      this.showApiKey = !this.showApiKey;
    },
    
    // 跳转到获取API密钥页面
    goToGetAPIKey() {
      window.open('https://platform.deepseek.com/usage', '_blank');
    },
    
    // 角色管理
    addCharacter() {
      this.characters.push({ name: '', setting: '' });
    },
    
    removeCharacter(index) {
      if (this.characters.length > 1) {
        this.characters.splice(index, 1);
      }
    },
    
    // 保存所有参数到本地存储
    saveAllParameters() {
      const parameters = {
        version: this.parametersVersion,
        apiKey: this.apiKey,
        worldView: this.worldView,
        perspective: this.perspective,
        additionalInfo: this.additionalInfo,
        chapterNumber: this.chapterNumber,
        chapterName: this.chapterName,
        characters: JSON.parse(JSON.stringify(this.characters)),
        plotRequirement: this.plotRequirement,
        savedAt: new Date().toISOString()
      };
      
      try {
        localStorage.setItem('novelParameters', JSON.stringify(parameters));
        console.log('参数已保存到本地存储');
      } catch (error) {
        console.error('保存参数失败:', error);
      }
    },
    
    // 手动保存当前参数
    saveCurrentParameters() {
      this.saveAllParameters();
      alert('参数已保存！');
    },
    
    // 重置参数
    resetParameters() {
      if (confirm('确定要重置所有参数吗？这将清除当前的配置。')) {
        this.worldView = '';
        this.perspective = '第三人称';
        this.additionalInfo = '';
        this.chapterNumber = 1;
        this.chapterName = '';
        this.characters = [{ name: '', setting: '' }];
        this.plotRequirement = '';
        
        // 清除本地存储的参数
        localStorage.removeItem('novelParameters');
        alert('参数已重置！');
      }
    },
    
    // 加载保存的参数
    loadAllParameters() {
      try {
        const saved = localStorage.getItem('novelParameters');
        if (saved) {
          const parameters = JSON.parse(saved);
          
          // 检查版本兼容性
          if (parameters.version === this.parametersVersion) {
            this.apiKey = parameters.apiKey || '';
            this.worldView = parameters.worldView || '';
            this.perspective = parameters.perspective || '第三人称';
            this.additionalInfo = parameters.additionalInfo || '';
            this.chapterNumber = parameters.chapterNumber || 1;
            this.chapterName = parameters.chapterName || '';
            this.characters = parameters.characters && parameters.characters.length > 0 
              ? parameters.characters 
              : [{ name: '', setting: '' }];
            this.plotRequirement = parameters.plotRequirement || '';
            
            console.log('参数已从本地存储加载');
            return true;
          } else {
            console.warn('参数版本不兼容，使用默认参数');
          }
        }
      } catch (error) {
        console.error('加载参数失败:', error);
      }
      return false;
    },
    
    // 生成小说
    async generateNovel() {
      if (!this.canGenerate) return;
      
      // 在生成前保存参数
      this.saveAllParameters();
      
      this.isGenerating = true;
      this.currentContent = null;
      this.displayedContent = '';
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
      this.isEditing = false;
      
      try {
        // 构建配置
        const systemConfig = buildSystemConfig(
          this.worldView,
          this.perspective,
          this.additionalInfo
        );
        
        const userConfig = buildUserConfig(
          this.chapterNumber,
          this.chapterName,
          this.plotRequirement,
          this.characters.filter(char => char.name || char.setting),
          this.getHistoryContext()
        );
        
        console.log('开始生成小说...', { systemConfig, userConfig });
        
        // 生成内容
        const stream = await generateContent({
          apiKey: this.apiKey,
          systemConfig,
          userConfig
        });
        
        // 处理流式响应
        const result = await processStream(stream, (update) => {
          // 实时更新统计信息
          this.currentStats = {
            characterCount: update.characterCount,
            chineseCount: update.chineseCount
          };
          
          // 实时更新显示内容
          this.displayedContent = update.content;
          
          // 自动滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        });
        
        if (result.success) {
          // 保存最终内容
          this.currentContent = {
            chapterTitle: `第${this.chapterNumber}章${this.chapterName ? `: ${this.chapterName}` : ''}`,
            content: result.finalContent,
            characterCount: result.characterCount,
            chineseCount: result.chineseCount,
            timestamp: new Date().toISOString(),
            isEdited: false,
            config: {
              worldView: this.worldView,
              perspective: this.perspective,
              characters: this.characters,
              plotRequirement: this.plotRequirement
            }
          };
          
          // 确保显示最终内容
          this.displayedContent = result.finalContent;
          console.log('生成完成', this.currentContent);
        } else {
          throw new Error(result.error || '生成失败');
        }
        
      } catch (error) {
        console.error('生成失败:', error);
        alert(`生成失败: ${error.message}`);
      } finally {
        this.isGenerating = false;
      }
    },
    
    // 滚动到底部
    scrollToBottom() {
      const contentElement = this.$refs.contentText;
      if (contentElement) {
        contentElement.scrollTop = contentElement.scrollHeight;
      }
    },
    
    // 获取历史上下文
    getHistoryContext() {
      if (this.history.length === 0) return '';
      
      return this.history
        .slice(-3)
        .map(item => `${item.chapterTitle}\n${item.content}`)
        .join('\n\n');
    },
    
    // 保存当前内容
    saveCurrentContent() {
      if (!this.currentContent) return;
      
      // 更新统计信息
      this.currentContent.characterCount = this.currentContent.content.length;
      this.currentContent.chineseCount = countChineseCharacters(this.currentContent.content);
      
      this.history.push({ ...this.currentContent });
      this.saveHistory();
      alert('保存成功！');
    },
    
    // 清空当前预览内容
    clearCurrentContent() {
      this.currentContent = null;
      this.displayedContent = '';
      this.isEditing = false;
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
    },
    
    // 查看历史内容
    viewContent(content) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.currentStats = {
        characterCount: content.characterCount,
        chineseCount: content.chineseCount
      };
      this.isEditing = false;
    },
    
    // 选择历史项
    selectHistoryItem(index) {
      this.selectedHistoryIndex = index;
      this.viewContent(this.sortedHistory[index]);
    },
    
    // 编辑历史项
    editHistoryItem(content, index) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.editingContent = content.content;
      this.originalContent = content.content;
      this.editingIndex = index;
      this.isEditing = true;
      this.selectedHistoryIndex = index;
    },
    
    // 切换编辑模式
    toggleEditMode() {
      if (this.isEditing) {
        this.cancelEdit();
      } else {
        this.startEdit();
      }
    },
    
    // 开始编辑
    startEdit() {
      if (!this.currentContent) return;
      this.editingContent = this.currentContent.content;
      this.originalContent = this.currentContent.content;
      this.isEditing = true;
      this.editingIndex = -1;
    },
    
    // 保存编辑内容
    saveEditedContent() {
      if (!this.editingContent.trim()) {
        alert('内容不能为空');
        return;
      }
      
      const characterCount = this.editingContent.length;
      const chineseCount = countChineseCharacters(this.editingContent);
      
      if (this.editingIndex >= 0) {
        // 更新历史项
        this.history[this.editingIndex] = {
          ...this.history[this.editingIndex],
          content: this.editingContent,
          characterCount: characterCount,
          chineseCount: chineseCount,
          isEdited: true,
          lastEdited: new Date().toISOString()
        };
        this.saveHistory();
        alert('修改已保存到历史记录！');
      } else {
        // 更新当前预览内容
        this.currentContent.content = this.editingContent;
        this.currentContent.characterCount = characterCount;
        this.currentContent.chineseCount = chineseCount;
        this.currentContent.isEdited = true;
        this.displayedContent = this.editingContent;
        alert('内容修改已保存！');
      }
      
      this.isEditing = false;
      this.currentStats = {
        characterCount: characterCount,
        chineseCount: chineseCount
      };
    },
    
    // 取消编辑
    cancelEdit() {
      this.isEditing = false;
      this.editingContent = '';
      this.originalContent = '';
      this.editingIndex = -1;
    },
    
    // 删除历史项
    deleteHistoryItem(index) {
      if (confirm('确定要删除这个章节吗？')) {
        this.history.splice(index, 1);
        this.saveHistory();
        if (this.selectedHistoryIndex === index) {
          this.selectedHistoryIndex = -1;
          this.clearCurrentContent();
        }
      }
    },
    
    // 下载单个章节
    downloadContent(content) {
      const blob = new Blob([content.content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${content.chapterTitle}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 下载所有章节
    downloadAllChapters() {
      if (this.history.length === 0) {
        alert('没有可下载的章节');
        return;
      }
      
      // 询问导出格式
      const format = confirm('是否导出为JSON格式（包含参数和历史记录）？\n点击"确定"导出JSON，点击"取消"导出TXT')
        ? 'json'
        : 'txt';
      
      if (format === 'json') {
        this.downloadAsJson();
      } else {
        this.downloadAsTxt();
      }
    },
    
    // 导出为JSON格式
    downloadAsJson() {
      const exportData = {
        format: 'novel-full-export',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        generator: 'TaleMaker DS便捷小说生成器',
        
        // 包含当前参数
        parameters: {
          apiKey: '', // 出于安全考虑，不导出API密钥
          worldView: this.worldView,
          perspective: this.perspective,
          additionalInfo: this.additionalInfo,
          chapterNumber: this.chapterNumber,
          chapterName: this.chapterName,
          characters: JSON.parse(JSON.stringify(this.characters)),
          plotRequirement: this.plotRequirement
        },
        
        // 包含所有历史记录
        history: this.sortedHistory.map(item => ({
          chapterTitle: item.chapterTitle,
          content: item.content,
          characterCount: item.characterCount,
          chineseCount: item.chineseCount,
          timestamp: item.timestamp,
          isEdited: item.isEdited || false,
          imported: item.imported || false,
          config: item.config || {}
        })),
        
        // 统计信息
        statistics: {
          totalChapters: this.history.length,
          totalCharacters: this.history.reduce((sum, item) => sum + item.characterCount, 0),
          totalChineseCharacters: this.history.reduce((sum, item) => sum + item.chineseCount, 0)
        }
      };
      
      // 创建JSON字符串
      const jsonStr = JSON.stringify(exportData, null, 2);
      
      // 创建下载
      const blob = new Blob([jsonStr], { 
        type: 'application/json;charset=utf-8' 
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${this.history.length}章_${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      alert('已导出JSON格式全本，可后续导入恢复数据');
    },
    
    // 原有的TXT格式导出
    downloadAsTxt() {
      const sortedChapters = this.sortedHistory;
      
      let fullContent = `《小说全本》\n\n`;
      fullContent += `生成时间: ${new Date().toLocaleString()}\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n`;
      fullContent += `生成工具: TaleMaker DS便捷小说生成器\n\n`;
      fullContent += '='.repeat(50) + '\n\n';
      
      sortedChapters.forEach((chapter, index) => {
        fullContent += `${chapter.chapterTitle}\n\n`;
        fullContent += chapter.content + '\n\n';
        fullContent += '='.repeat(50) + '\n\n';
        
        // 添加统计信息
        fullContent += `[本章统计: 字符数 ${chapter.characterCount} | 中文字符 ${chapter.chineseCount}`;
        if (chapter.isEdited) {
          fullContent += ' | 已编辑';
        }
        if (chapter.imported) {
          fullContent += ' | 已导入';
        }
        fullContent += ']\n\n';
      });
      
      // 添加总体统计
      const totalChars = sortedChapters.reduce((sum, chapter) => sum + chapter.characterCount, 0);
      const totalChinese = sortedChapters.reduce((sum, chapter) => sum + chapter.chineseCount, 0);
      
      fullContent += `\n总体统计:\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n`;
      fullContent += `总字符数: ${totalChars}\n`;
      fullContent += `总中文字符: ${totalChinese}\n`;
      
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${sortedChapters.length}章.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    
    // 导入全本功能
    importAllChapters() {
      // 创建文件输入元素
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.txt';
      input.style.display = 'none';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        this.isImporting = true;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            this.processImportedFile(content, file.name);
          } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
          } finally {
            this.isImporting = false;
            // 清理输入元素
            document.body.removeChild(input);
          }
        };
        
        reader.onerror = () => {
          alert('读取文件失败');
          this.isImporting = false;
          document.body.removeChild(input);
        };
        
        reader.readAsText(file);
      };
      
      document.body.appendChild(input);
      input.click();
    },
    
    // 处理导入的文件
    processImportedFile(content, filename) {
      try {
        // 尝试解析为JSON
        const data = JSON.parse(content);
        
        // 检查数据格式
        if (data.format === 'novel-full-export') {
          // 导入全本格式
          this.importFullNovelData(data);
        } else if (data.parameters) {
          // 可能是旧版格式，尝试导入参数
          this.importLegacyFormat(data);
        } else {
          // 可能是纯文本，作为单个章节导入
          this.importAsSingleChapter(content, filename);
        }
      } catch (jsonError) {
        // JSON解析失败，作为纯文本导入
        console.log('非JSON格式，尝试作为文本导入');
        this.importAsSingleChapter(content, filename);
      }
    },
    
    // 导入全本数据（新版格式）
    importFullNovelData(data) {
      // 验证必要字段
      if (!data.parameters || !data.history) {
        throw new Error('文件格式不正确，缺少必要字段');
      }
      
      // 恢复参数
      if (confirm('是否恢复保存的配置参数？')) {
        this.worldView = data.parameters.worldView || '';
        this.perspective = data.parameters.perspective || '第三人称';
        this.additionalInfo = data.parameters.additionalInfo || '';
        this.chapterNumber = data.parameters.chapterNumber || 1;
        this.chapterName = data.parameters.chapterName || '';
        this.characters = data.parameters.characters && data.parameters.characters.length > 0 
          ? data.parameters.characters 
          : [{ name: '', setting: '' }];
        this.plotRequirement = data.parameters.plotRequirement || '';
        
        // 保存参数到本地存储
        this.saveAllParameters();
      }
      
      // 恢复历史记录
      if (confirm(`是否导入 ${data.history.length} 个章节到历史记录？`)) {
        this.history = data.history.map(item => ({
          ...item,
          // 确保必要字段存在
          isEdited: item.isEdited || false,
          imported: true,
          timestamp: item.timestamp || new Date().toISOString()
        }));
        
        // 保存历史记录
        this.saveHistory();
        
        alert(`成功导入 ${this.history.length} 个章节！`);
        
        // 如果有历史记录，默认选中第一个
        if (this.history.length > 0) {
          this.selectHistoryItem(0);
        }
      }
    },
    
    // 导入旧版格式
    importLegacyFormat(data) {
      if (data.parameters) {
        // 导入参数
        this.worldView = data.parameters.worldView || '';
        this.perspective = data.parameters.perspective || '第三人称';
        this.additionalInfo = data.parameters.additionalInfo || '';
        this.chapterNumber = data.parameters.chapterNumber || 1;
        this.chapterName = data.parameters.chapterName || '';
        this.characters = data.parameters.characters && data.parameters.characters.length > 0 
          ? data.parameters.characters 
          : [{ name: '', setting: '' }];
        this.plotRequirement = data.parameters.plotRequirement || '';
        
        this.saveAllParameters();
        alert('配置参数已恢复！');
      }
    },
    
    // 导入为单个章节
    importAsSingleChapter(content, filename) {
      // 从文件名提取章节信息
      const chapterMatch = filename.match(/(第\d+章)?(.*)\.(json|txt)/i);
      const chapterTitle = chapterMatch 
        ? (chapterMatch[1] || '') + (chapterMatch[2] || '导入章节')
        : '导入章节';
      
      // 创建新的历史记录项
      const newHistoryItem = {
        chapterTitle: chapterTitle,
        content: content,
        characterCount: content.length,
        chineseCount: countChineseCharacters(content),
        timestamp: new Date().toISOString(),
        isEdited: false,
        imported: true,
        config: {
          worldView: this.worldView,
          perspective: this.perspective,
          characters: this.characters,
          plotRequirement: this.plotRequirement
        }
      };
      
      // 添加到历史记录
      this.history.push(newHistoryItem);
      this.saveHistory();
      
      // 自动选中新导入的章节
      this.selectHistoryItem(this.history.length - 1);
      
      alert(`已导入章节: ${chapterTitle}`);
    },
    
    // 内容预览
    getContentPreview(content, length = 100) {
      return content.length > length ? content.substring(0, length) + '...' : content;
    },
    
    // 日期格式化
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    
    // 本地存储
    saveHistory() {
      localStorage.setItem('novelHistory', JSON.stringify(this.history));
    },
    
    loadHistory() {
      const saved = localStorage.getItem('novelHistory');
      if (saved) {
        const history = JSON.parse(saved);
        // 兼容旧数据：添加必要字段
        this.history = history.map(item => ({
          ...item,
          isEdited: item.isEdited || false,
          imported: item.imported || false
        }));
      }
    }
  }
};
</script>

<style scoped>
/* 新增样式 */
.get-key-btn {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.get-key-btn:hover {
  background: linear-gradient(135deg, #8e44ad, #7d3c98);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(155, 89, 182, 0.3);
}

.parameter-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 导入状态指示器 */
.importing-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.importing-indicator .spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

/* 历史记录中的导入标记 */
.history-item.imported {
  border-left-color: #9b59b6;
}

.imported-badge {
  background: #9b59b6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.item-badges {
  display: flex;
  gap: 5px;
}

/* 流式显示的特殊样式 */
.streaming-text {
  line-height: 1.8;
  font-family: 'Georgia', serif;
}

.streaming-cursor {
  animation: blink 1s infinite;
  color: #3498db;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 生成状态下的预览区域 */
.preview-content.generating .content-text {
  background: #f8f9fa;
  border: 2px dashed #e9ecef;
}

/* 编辑模式样式 */
.preview-content.editing {
  border: 2px solid #3498db;
  background: #f8fafc;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.content-textarea {
  width: 90%;
  min-height: 400px;
  margin: 10px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: 'Georgia', serif;
  font-size: 15px;
  line-height: 1.8;
  resize: vertical;
  background: white;
}

.content-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* 确保内容区域可滚动 */
.content-text {
  max-height: 400px;
  overflow-y: auto;
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #eaeaea;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.8;
  font-family: 'Georgia', serif;
}

/* 历史项编辑标识 */
.history-item.edited {
  border-left-color: #f39c12;
  background: #fef9f3;
}

.edited-badge {
  background: #f39c12;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-item-header h4 {
  margin: 0;
  flex: 1;
}

/* 头部操作按钮布局 */
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 12px;
}

.module-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

/* 其他原有样式保持不变 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f5f5f5;
}

.header {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c3e50, #4a6572);
  color: white;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.module {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #eaeaea;
}

.module h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 12px;
  font-size: 1.4rem;
}

.module-content {
  min-height: 200px;
}

/* 配置区域样式 */
.config-section {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 4px solid #3498db;
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-config {
  border-left-color: #e74c3c;
  background: #fef5f5;
}

.basic-config {
  border-left-color: #f39c12;
  background: #fef9f3;
}

.chapter-config {
  border-left-color: #27ae60;
  background: #f3fcf7;
}

.input-group {
  margin-bottom: 18px;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.input-field, .textarea-field, .select-field {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  background: white;
}

.input-field:focus, .textarea-field:focus, .select-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
  line-height: 1.5;
}

.input-field.small, .textarea-field.small {
  font-size: 13px;
  margin: 5px;
}

.input-field.small{
  width: 50%;
}

.input-with-button {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-with-button .input-field {
  flex: 1;
}

/* 角色项样式 */
.character-juese {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e1e8ed;
  display: grid;
  align-items: start;
}

/* 按钮样式 */
.btn-primary, .btn-secondary, .btn-success, .btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  margin: 0px;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
}

.btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-secondary.small, .btn-danger.small {
  padding: 6px 12px;
  font-size: 12px;
}

.generate-btn {
  min-width: 140px;
}

/* 生成指示器样式 */
.generating-indicator {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats {
  color: #7f8c8d;
  font-size: 14px;
}

.preview-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-display {
  flex: 1;
  margin-bottom: 20px;
}

.content-display h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.content-stats {
  border-top: 1px solid #eee;
  padding-top: 12px;
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
}

.preview-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 历史记录样式 */
.history-list {
  max-height: 600px;
  overflow-y: auto;
}

.history-item {
  background: #f8f9fa;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e1e8ed;
}

.history-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.history-item.active {
  border-left-color: #e74c3c;
  background: #e3f2fd;
  border-color: #3498db;
}

.history-item h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 15px;
}

.preview-text {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.meta-info {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 12px;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #7f8c8d;
  text-align: center;
  padding: 40px 20px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .parameter-settings {
    grid-column: 1 / 3;
  }
}

@media (min-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr 2fr 1fr;
  }
  
  .parameter-settings {
    grid-column: auto;
  }
}

@media (max-width: 767px) {
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .character-juese {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .input-with-button {
    flex-direction: column;
  }
  
  .module-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .history-actions {
    flex-wrap: wrap;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .edit-actions {
    align-self: flex-end;
  }
  
  .parameter-actions {
    flex-direction: column;
  }
}
</style>