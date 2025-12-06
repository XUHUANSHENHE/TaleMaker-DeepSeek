<template>
  <div class="app-container">
    <header class="header">
      <h1>TaleMaker  DeepSeek 小说生成框架</h1>
    </header>

    <main class="main-content">
      <section class="module parameter-settings">
        <h2>参数设置</h2>
        <div class="module-content">
          <div class="config-section api-config">
            <h3>🔑 API配置</h3>
            <div class="input-group">
              <label for="apiKey">DeepSeek API Key:</label>
              <div class="input-with-button">
                <input id="apiKey" v-model="apiKey" :type="showApiKey ? 'text' : 'password'" placeholder="请输入您的key"
                  class="input-field" />
                <button @click="toggleApiKeyVisibility" class="btn-secondary">
                  {{ showApiKey ? '隐藏' : '显示' }}
                </button>
                <button @click="goToGetAPIKey" class="btn-secondary get-key-btn">
                  获取密钥
                </button>
              </div>
            </div>

            <div class="input-group">
              <label for="model">模型选择:</label>
              <select v-model="model" id="model" class="select-field">
                <option value="deepseek-reasoner">DeepSeek Reasoner (支持思考过程)</option>
                <option value="deepseek-chat">DeepSeek Chat (常规版)</option>
              </select>
            </div>

            <div class="input-group">
              <div class="checkbox-group">
                <input id="enableReasoning" v-model="enableReasoning" type="checkbox" class="checkbox-input"
                  :disabled="model !== 'deepseek-reasoner'" />
                <label for="enableReasoning" class="checkbox-label">
                  启用思维链 (展示模型思考过程)
                  <br></br>
                  <span v-if="model !== 'deepseek-reasoner'" class="disabled-hint">
                    (仅DeepSeek Reasoner模型支持)
                  </span>
                </label>
              </div>
            </div>

            <div v-if="enableReasoning && model === 'deepseek-reasoner'" class="input-group">
              <label for="reasoningDisplay">思维链显示方式:</label>
              <select v-model="reasoningDisplay" id="reasoningDisplay" class="select-field">
                <option value="separate">独立显示</option>
                <option value="combined">合并显示</option>
                <option value="hide">隐藏思维</option>
              </select>
            </div>
          </div>

          <div class="config-section basic-config">
            <h3>⚙️ 基础设定</h3>

            <div class="input-group">
              <label for="perspective">人称视角:</label>
              <select v-model="perspective" id="perspective" class="select-field">
                <option value="第一人称">第一人称</option>
                <option value="第二人称">第二人称</option>
                <option value="第三人称">第三人称</option>
              </select>
            </div>

            <div class="input-group">
              <label for="worldView">世界观设定:</label>
              <textarea id="worldView" v-model="worldView" @input="autoResize($event, 60, 400)"
                placeholder="架空/现实/修仙 可详细设定" class="textarea-field auto-resize"></textarea>
            </div>

            <div class="input-group">
              <label for="additionalInfo">其他信息:</label>
              <textarea id="additionalInfo" v-model="additionalInfo" @input="autoResize($event, 60, 400)"
                placeholder="语言风格/特殊用词等其他要求" class="textarea-field auto-resize"></textarea>
            </div>
          </div>

          <div class="config-section chapter-config">
            <h3>📖 章节配置</h3>
            <div class="input-row">
              <div class="input-group">
                <label for="chapterNumber">第几章:</label>
                <input id="chapterNumber" v-model.number="chapterNumber" type="number" min="1" class="input-field" />
              </div>

              <div class="input-group">
                <label for="chapterName">章节命名:</label>
                <input id="chapterName" v-model="chapterName" class="input-field" />
              </div>
            </div>

            <div class="input-group">
              <label>角色配置:</label>
              <div v-for="(character, index) in characters" :key="index" class="character-juese">
                <input v-model="character.name" placeholder="角色姓名" class="input-field small" />

                <textarea v-model="character.setting" @input="autoResize($event, 60, 200)" placeholder="角色设定"
                  class="textarea-field small auto-resize"></textarea>

                <button @click="removeCharacter(index)" class="btn-danger">删除</button>
              </div>
              <button @click="addCharacter" class="btn-secondary">添加角色</button>
            </div>

            <div class="input-group">
              <label for="plotRequirement">情节要求:</label>
              <textarea id="plotRequirement" v-model="plotRequirement" @input="autoResize($event, 100, 500)"
                placeholder="例如：主角在森林中遇到神秘老人，获得重要线索..." class="textarea-field auto-resize"></textarea>
            </div>

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

      <section class="module preview">
        <div class="module-header">
          <h2>生成预览</h2>
          <div class="header-actions">
            <transition name="fade">
              <div v-if="isGenerating" class="floating-generating-indicator">
                <div class="generating-progress">
                  <div class="progress-spinner"></div>
                  <div class="progress-text">
                    <p class="generating-title">正在生成小说内容...</p>
                    <p class="generating-stats">
                      已生成: <span class="stat-value">{{ currentStats.chineseCount }}</span> 中文字符
                      <span v-if="enableReasoning">
                        | 思维链: <span class="stat-value">{{ reasoningStats.length }}</span> 字符
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </transition>

            <button @click="generateNovel" :disabled="!canGenerate || isGenerating" class="btn-primary generate-btn">
              {{ isGenerating ? '生成中...' : '生成小说章节' }}
            </button>
            <button v-if="!isGenerating && currentContent" @click="toggleEditMode" class="btn-secondary">
              {{ isEditing ? '退出编辑' : '编辑内容' }}
            </button>
          </div>
        </div>
        <div class="module-content">
          <div v-if="isImporting" class="importing-indicator">
            <div class="spinner"></div>
            <p>正在导入数据，请稍候...</p>
          </div>

          <div class="content-tabs" v-if="availableTabs.length > 1">
            <button v-for="tab in availableTabs" :key="tab.id" @click="activeTab = tab.id"
              :class="{ active: activeTab === tab.id, disabled: !tab.available }" class="tab-button">
              {{ tab.label }}
              <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
          </div>

          <div class="preview-content" :class="{ 'generating': isGenerating, 'editing': isEditing }">
            <div class="content-display">
              <div class="content-header">
                <h3>{{ currentChapterTitle }}</h3>
                <div v-if="isEditing" class="edit-actions">
                  <button @click="saveEditedContent" class="btn-success small">保存修改</button>
                  <button @click="cancelEdit" class="btn-secondary small">取消</button>
                </div>
              </div>

              <div v-if="activeTab === 'final' && !isEditing" class="content-view">
                <template v-if="isGenerating && displayedContent">
                  <div class="streaming-content">
                    <span class="streaming-text">{{ displayedContent }}</span>
                    <span class="streaming-cursor">|</span>
                  </div>
                </template>
                <template v-else-if="currentContent">
                  <div class="content-text" ref="contentText">
                    {{ currentContent.content }}
                  </div>
                </template>
                <template v-else>
                  <div class="placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>生成的小说内容预览区域</p>
                    <p>设置好参数后点击生成按钮开始创作</p>
                  </div>
                </template>
              </div>

              <div v-if="activeTab === 'reasoning' && !isEditing" class="reasoning-view">
                <template v-if="isGenerating && displayedReasoning">
                  <div class="streaming-reasoning">
                    <span class="streaming-text reasoning-text">{{ displayedReasoning }}</span>
                    <span class="streaming-cursor">|</span>
                  </div>
                </template>
                <template v-else-if="currentReasoning">
                  <div class="reasoning-text" ref="reasoningText">
                    {{ currentReasoning }}
                  </div>
                </template>
                <template v-else>
                  <div class="placeholder">
                    <div class="placeholder-icon">🤔</div>
                    <p>模型思考过程将显示在这里</p>
                    <p>需要启用思维链功能</p>
                  </div>
                </template>
              </div>

              <div v-if="activeTab === 'combined' && !isEditing" class="combined-view">
                <template v-if="isGenerating">
                  <div class="combined-content">
                    <div class="combined-section">
                      <h4>模型思考过程</h4>
                      <div class="streaming-reasoning">
                        <span class="streaming-text reasoning-text">{{ displayedReasoning }}</span>
                        <span class="streaming-cursor">|</span>
                      </div>
                    </div>
                    <div class="combined-divider"></div>
                    <div class="combined-section">
                      <h4>生成内容</h4>
                      <div class="streaming-content">
                        <span class="streaming-text">{{ displayedContent }}</span>
                        <span class="streaming-cursor">|</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="hasCombinedContent">
                  <div class="combined-content">
                    <div class="combined-section">
                      <h4>模型思考过程</h4>
                      <div class="reasoning-text">
                        {{ currentReasoning }}
                      </div>
                    </div>
                    <div class="combined-divider"></div>
                    <div class="combined-section">
                      <h4>正文内容</h4>
                      <div class="content-text">
                        {{ currentContent.content }}
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <textarea v-if="isEditing" v-model="editingContent" @input="autoResize($event, 400, 800)"
                class="content-textarea auto-resize" placeholder="请在此编辑小说内容..."></textarea>
            </div>

            <div v-if="!isEditing && (displayedContent || currentContent)" class="content-stats">
              <p>
                总字符数: {{ currentStats.characterCount }} |
                中文字符: {{ currentStats.chineseCount }}
                <span v-if="reasoningStats.length > 0">
                  | 思维链: {{ reasoningStats.length }} 字符
                </span>
              </p>
            </div>

            <div v-if="!isGenerating && currentContent && !isEditing" class="preview-actions">
              <button @click="saveCurrentContent" class="btn-success">保存到历史</button>
              <button @click="clearCurrentContent" class="btn-secondary">清空预览</button>
            </div>
          </div>
        </div>
      </section>

      <section class="module history">
        <div class="module-header">
          <h2>已生成内容</h2>
          <div class="header-actions">
            <button v-if="history.length > 0" @click="downloadAllChapters" class="btn-primary">
              下载全本
            </button>
            <button @click="importAllChapters" class="btn-secondary">
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
            <div v-for="(item, index) in sortedHistory" :key="index" class="history-item" :class="{
              active: selectedHistoryIndex === index,
              edited: item.isEdited,
              imported: item.imported,
              hasReasoning: item.reasoningContent
            }" @click="selectHistoryItem(index)">
              <div class="history-item-header">
                <h4>{{ item.chapterTitle }}</h4>
                <div class="item-badges">
                  <span v-if="item.isEdited" class="edited-badge">已编辑</span>
                  <span v-if="item.imported" class="imported-badge">已导入</span>
                  <span v-if="item.reasoningContent" class="reasoning-badge">有思维链</span>
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
                <button @click.stop="importChapterParameters(item)" class="btn-secondary small">
                  导入本章参数
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
import {
  generateContent,
  processStream,
  buildSystemConfig,
  buildUserConfig,
  countChineseCharacters
} from './novelGenerator';

export default {
  name: 'NovelGenerator',
  data() {
    return {
      apiKey: '',
      showApiKey: false,
      model: 'deepseek-reasoner',
      enableReasoning: true,
      reasoningDisplay: 'separate',

      worldView: '',
      perspective: '第三人称',
      additionalInfo: '',

      chapterNumber: 1,
      chapterName: '',
      characters: [
        { name: '', setting: '' }
      ],
      plotRequirement: '',

      isGenerating: false,
      generationProgress: 0,
      generationTimer: null,
      currentContent: null,
      currentReasoning: '',
      displayedContent: '',
      displayedReasoning: '',
      activeTab: 'final',
      currentStats: {
        characterCount: 0,
        chineseCount: 0
      },
      reasoningStats: {
        length: 0
      },

      isEditing: false,
      editingContent: '',
      editingIndex: -1,
      originalContent: '',

      history: [],
      selectedHistoryIndex: -1,

      parametersVersion: '1.2',

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
      return [...this.history].sort((a, b) => {
        const getChapterNum = (title) => {
          const match = title.match(/第(\d+)章/);
          return match ? parseInt(match[1]) : 0;
        };
        return getChapterNum(a.chapterTitle) - getChapterNum(b.chapterTitle);
      });
    },
    availableTabs() {
      const tabs = [];

      if (this.reasoningDisplay === 'combined') {
        if (this.currentContent && this.currentReasoning) {
          tabs.push({ id: 'combined', label: '合并视图', available: true });
        } else if (this.isGenerating) {
          tabs.push({ id: 'combined', label: '合并视图', available: true });
        }
      } else if (this.reasoningDisplay === 'hide') {
        tabs.push({ id: 'final', label: '最终内容', available: true });
      } else {
        tabs.push({ id: 'final', label: '最终内容', available: true });
        if (this.currentReasoning || this.isGenerating) {
          tabs.push({ id: 'reasoning', label: '思维链', available: !!this.currentReasoning });
        }
      }

      return tabs;
    },
    hasCombinedContent() {
      return this.currentContent && this.currentReasoning;
    }
  },
  watch: {
    model(newModel) {
      if (newModel !== 'deepseek-reasoner') {
        this.enableReasoning = false;
        this.reasoningDisplay = 'separate';
      } else {
        this.enableReasoning = true;
      }
    },

    reasoningDisplay(newValue) {
      if (newValue === 'combined') {
        this.activeTab = 'combined';
      } else if (newValue === 'hide') {
        this.activeTab = 'final';
      } else {
        this.activeTab = 'final';
      }
    },

    worldView() {
      this.debouncedSaveParameters();
      this.$nextTick(() => {
        this.initTextareaHeights();
      });
    },
    perspective() {
      this.debouncedSaveParameters();
    },
    additionalInfo() {
      this.debouncedSaveParameters();
      this.$nextTick(() => {
        this.initTextareaHeights();
      });
    },
    chapterNumber() {
      this.debouncedSaveParameters();
    },
    chapterName() {
      this.debouncedSaveParameters();
    },
    plotRequirement() {
      this.debouncedSaveParameters();
      this.$nextTick(() => {
        this.initTextareaHeights();
      });
    },
    characters: {
      handler() {
        this.debouncedSaveParameters();
        this.$nextTick(() => {
          this.initTextareaHeights();
        });
      },
      deep: true
    },
    model() {
      this.debouncedSaveParameters();
    },
    enableReasoning() {
      this.debouncedSaveParameters();
    },
    reasoningDisplay() {
      this.debouncedSaveParameters();
    },

    isGenerating(isGenerating) {
      if (isGenerating) {
        this.startGenerationProgress();
      } else {
        this.stopGenerationProgress();
      }
    }
  },
  mounted() {
    this.loadHistory();
    this.loadAllParameters();
    this.$nextTick(() => {
      this.initTextareaHeights();
    });
  },
  created() {
    this.debouncedSaveParameters = this.debounce(() => {
      this.saveAllParameters();
    }, 1000);
  },
  methods: {
    autoResize(event, minHeight = 60, maxHeight = 400) {
      const textarea = event.target;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      textarea.style.height = 'auto';
      let newHeight = textarea.scrollHeight + 2;
      newHeight = Math.max(minHeight, newHeight);
      newHeight = Math.min(maxHeight, newHeight);

      textarea.style.height = `${newHeight}px`;

      if (newHeight >= maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }

      window.scrollTo(0, scrollTop);
    },

    initTextareaHeights() {
      this.$nextTick(() => {
        const textareas = document.querySelectorAll('.auto-resize');
        textareas.forEach(textarea => {
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        });
      });
    },

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

    startGenerationProgress() {
      this.generationProgress = 10;
      if (this.generationTimer) {
        clearInterval(this.generationTimer);
      }

      this.generationTimer = setInterval(() => {
        if (this.generationProgress < 90) {
          this.generationProgress += 5;
        }
      }, 500);
    },

    stopGenerationProgress() {
      if (this.generationTimer) {
        clearInterval(this.generationTimer);
        this.generationTimer = null;
      }
      if (this.generationProgress < 100) {
        const interval = setInterval(() => {
          if (this.generationProgress < 100) {
            this.generationProgress += 5;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              this.generationProgress = 0;
            }, 500);
          }
        }, 50);
      }
    },

    toggleApiKeyVisibility() {
      this.showApiKey = !this.showApiKey;
    },

    goToGetAPIKey() {
      window.open('https://platform.deepseek.com/usage', '_blank');
    },

    addCharacter() {
      this.characters.push({ name: '', setting: '' });
      this.$nextTick(() => {
        this.initTextareaHeights();
      });
    },

    removeCharacter(index) {
      if (this.characters.length > 1) {
        this.characters.splice(index, 1);
      }
    },

    importChapterParameters(item) {
      if (!item.config) {
        alert('该章节没有保存的参数配置');
        return;
      }

      if (confirm('导入本章参数将覆盖当前的参数设置，是否继续？')) {
        const config = item.config;

        this.worldView = config.worldView || '';
        this.perspective = config.perspective || '第三人称';
        this.additionalInfo = config.additionalInfo || '';
        this.chapterNumber = config.chapterNumber || 1;
        this.chapterName = config.chapterName || '';
        this.characters = config.characters && config.characters.length > 0
          ? config.characters
          : [{ name: '', setting: '' }];
        this.plotRequirement = config.plotRequirement || '';
        this.model = config.model || 'deepseek-reasoner';
        this.enableReasoning = config.enableReasoning !== undefined ? config.enableReasoning : true;
        this.reasoningDisplay = config.reasoningDisplay || 'separate';

        this.saveAllParameters();

        if (this.reasoningDisplay === 'combined') {
          this.activeTab = 'combined';
        } else if (this.reasoningDisplay === 'hide') {
          this.activeTab = 'final';
        }

        alert('章节参数导入成功！');
      }
    },

    saveAllParameters() {
      const parameters = {
        version: this.parametersVersion,
        apiKey: this.apiKey,
        model: this.model,
        enableReasoning: this.enableReasoning,
        reasoningDisplay: this.reasoningDisplay,
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
      } catch (error) {
        console.error('保存参数失败:', error);
      }
    },

    saveCurrentParameters() {
      this.saveAllParameters();
      alert('参数已保存！');
    },

    resetParameters() {
      if (confirm('确定要重置所有参数吗？这将清除当前的配置。')) {
        this.worldView = '';
        this.perspective = '第三人称';
        this.additionalInfo = '';
        this.chapterNumber = 1;
        this.chapterName = '';
        this.characters = [{ name: '', setting: '' }];
        this.plotRequirement = '';
        this.model = 'deepseek-reasoner';
        this.enableReasoning = true;
        this.reasoningDisplay = 'separate';

        localStorage.removeItem('novelParameters');

        this.$nextTick(() => {
          this.initTextareaHeights();
        });

        alert('参数已重置！');
      }
    },

    loadAllParameters() {
      try {
        const saved = localStorage.getItem('novelParameters');
        if (saved) {
          const parameters = JSON.parse(saved);

          if (parameters.version === this.parametersVersion) {
            this.apiKey = parameters.apiKey || '';
            this.model = parameters.model || 'deepseek-reasoner';
            this.enableReasoning = parameters.enableReasoning !== undefined ? parameters.enableReasoning : true;
            this.reasoningDisplay = parameters.reasoningDisplay || 'separate';
            this.worldView = parameters.worldView || '';
            this.perspective = parameters.perspective || '第三人称';
            this.additionalInfo = parameters.additionalInfo || '';
            this.chapterNumber = parameters.chapterNumber || 1;
            this.chapterName = parameters.chapterName || '';
            this.characters = parameters.characters && parameters.characters.length > 0
              ? parameters.characters
              : [{ name: '', setting: '' }];
            this.plotRequirement = parameters.plotRequirement || '';

            if (this.reasoningDisplay === 'combined') {
              this.activeTab = 'combined';
            } else if (this.reasoningDisplay === 'hide') {
              this.activeTab = 'final';
            }

            this.$nextTick(() => {
              this.initTextareaHeights();
            });

            return true;
          }
        }
      } catch (error) {
        console.error('加载参数失败:', error);
      }
      return false;
    },

    async generateNovel() {
      if (!this.canGenerate) return;

      this.saveAllParameters();

      this.isGenerating = true;
      this.currentContent = null;
      this.currentReasoning = '';
      this.displayedContent = '';
      this.displayedReasoning = '';
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
      this.reasoningStats = {
        length: 0
      };
      this.isEditing = false;

      if (this.reasoningDisplay === 'combined') {
        this.activeTab = 'combined';
      } else if (this.reasoningDisplay === 'hide') {
        this.activeTab = 'final';
      } else {
        this.activeTab = 'final';
      }

      try {
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

        const stream = await generateContent({
          apiKey: this.apiKey,
          systemConfig,
          userConfig,
          model: this.model,
          enableReasoning: this.enableReasoning && this.model === 'deepseek-reasoner'
        });

        const result = await processStream(stream, (update) => {
          this.currentStats = {
            characterCount: update.characterCount,
            chineseCount: update.chineseCount
          };

          if (update.reasoningContent) {
            this.reasoningStats.length = update.reasoningContent.length;
          }

          this.displayedContent = update.content;

          if (update.reasoningContent) {
            this.displayedReasoning = update.reasoningContent;
          }

          if (update.characterCount > 0) {
            this.generationProgress = Math.min(95, 10 + (update.characterCount / 2000) * 85);
          }

          this.$nextTick(() => {
            this.scrollToBottom();
          });
        });

        if (result.success) {
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
              additionalInfo: this.additionalInfo,
              characters: JSON.parse(JSON.stringify(this.characters)),
              plotRequirement: this.plotRequirement,
              chapterNumber: this.chapterNumber,
              chapterName: this.chapterName,
              model: this.model,
              enableReasoning: this.enableReasoning,
              reasoningDisplay: this.reasoningDisplay
            }
          };

          if (result.reasoningContent) {
            this.currentReasoning = result.reasoningContent;

            if (this.reasoningDisplay === 'combined') {
              this.activeTab = 'combined';
            }
          }

          this.displayedContent = result.finalContent;
          this.displayedReasoning = result.reasoningContent || '';

          this.generationProgress = 100;
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

    scrollToBottom() {
      const contentElement = this.$refs.contentText || this.$refs.reasoningText;
      if (contentElement) {
        contentElement.scrollTop = contentElement.scrollHeight;
      }
    },

    getHistoryContext() {
      if (this.history.length === 0) return '';

      return this.history
        .slice(-3)
        .map(item => `${item.chapterTitle}\n${item.content}`)
        .join('\n\n');
    },

    saveCurrentContent() {
      if (!this.currentContent) return;

      this.currentContent.characterCount = this.currentContent.content.length;
      this.currentContent.chineseCount = countChineseCharacters(this.currentContent.content);

      if (this.currentReasoning) {
        this.currentContent.reasoningContent = this.currentReasoning;
      }

      this.history.push({ ...this.currentContent });
      this.saveHistory();
      alert('保存成功！');
    },

    clearCurrentContent() {
      this.currentContent = null;
      this.currentReasoning = '';
      this.displayedContent = '';
      this.displayedReasoning = '';
      this.isEditing = false;
      if (this.reasoningDisplay === 'combined') {
        this.activeTab = 'combined';
      } else {
        this.activeTab = 'final';
      }
      this.currentStats = {
        characterCount: 0,
        chineseCount: 0
      };
      this.reasoningStats = {
        length: 0
      };
    },

    viewContent(content) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.currentReasoning = content.reasoningContent || '';
      this.currentStats = {
        characterCount: content.characterCount,
        chineseCount: content.chineseCount
      };
      this.isEditing = false;

      if (this.reasoningDisplay === 'combined' && this.currentReasoning) {
        this.activeTab = 'combined';
      } else {
        this.activeTab = 'final';
      }
    },

    selectHistoryItem(index) {
      this.selectedHistoryIndex = index;
      const content = this.sortedHistory[index];
      this.viewContent(content);
    },

    editHistoryItem(content, index) {
      this.currentContent = { ...content };
      this.displayedContent = content.content;
      this.currentReasoning = content.reasoningContent || '';
      this.editingContent = content.content;
      this.originalContent = content.content;
      this.editingIndex = index;
      this.isEditing = true;
      this.selectedHistoryIndex = index;
      this.activeTab = 'final';
    },

    toggleEditMode() {
      if (this.isEditing) {
        this.cancelEdit();
      } else {
        this.startEdit();
      }
    },

    startEdit() {
      if (!this.currentContent) return;
      this.editingContent = this.currentContent.content;
      this.originalContent = this.currentContent.content;
      this.isEditing = true;
      this.editingIndex = -1;
      this.activeTab = 'final';
    },

    saveEditedContent() {
      if (!this.editingContent.trim()) {
        alert('内容不能为空');
        return;
      }

      const characterCount = this.editingContent.length;
      const chineseCount = countChineseCharacters(this.editingContent);

      if (this.editingIndex >= 0) {
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

    cancelEdit() {
      this.isEditing = false;
      this.editingContent = '';
      this.originalContent = '';
      this.editingIndex = -1;
    },

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

    downloadContent(content) {
      const blob = new Blob([content.content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${content.chapterTitle}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },

    downloadAllChapters() {
      if (this.history.length === 0) {
        alert('没有可下载的章节');
        return;
      }

      const format = confirm('是否导出为JSON格式（包含参数和历史记录）？\n点击"确定"导出JSON，点击"取消"导出TXT')
        ? 'json'
        : 'txt';

      if (format === 'json') {
        this.downloadAsJson();
      } else {
        this.downloadAsTxt();
      }
    },

    downloadAsJson() {
      const exportData = {
        format: 'novel-full-export',
        version: '1.2',
        exportedAt: new Date().toISOString(),
        generator: 'TaleMaker DS便捷小说生成器',

        parameters: {
          apiKey: '',
          model: this.model,
          enableReasoning: this.enableReasoning,
          reasoningDisplay: this.reasoningDisplay,
          worldView: this.worldView,
          perspective: this.perspective,
          additionalInfo: this.additionalInfo,
          chapterNumber: this.chapterNumber,
          chapterName: this.chapterName,
          characters: JSON.parse(JSON.stringify(this.characters)),
          plotRequirement: this.plotRequirement
        },

        history: this.sortedHistory.map(item => ({
          chapterTitle: item.chapterTitle,
          content: item.content,
          reasoningContent: item.reasoningContent || '',
          characterCount: item.characterCount,
          chineseCount: item.chineseCount,
          timestamp: item.timestamp,
          isEdited: item.isEdited || false,
          imported: item.imported || false,
          config: item.config || {}
        })),

        statistics: {
          totalChapters: this.history.length,
          totalCharacters: this.history.reduce((sum, item) => sum + item.characterCount, 0),
          totalChineseCharacters: this.history.reduce((sum, item) => sum + item.chineseCount, 0),
          chaptersWithReasoning: this.history.filter(item => item.reasoningContent).length
        }
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], {
        type: 'application/json;charset=utf-8'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${this.history.length}章_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      alert('已导出JSON格式全本，可后续导入恢复数据');
    },

    downloadAsTxt() {
      const sortedChapters = this.sortedHistory;

      let fullContent = `《小说全本》\n\n`;
      fullContent += `生成时间: ${new Date().toLocaleString()}\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n`;
      fullContent += `生成工具: TaleMaker DS便捷小说生成器\n`;
      fullContent += `包含思维链的章节数: ${sortedChapters.filter(c => c.reasoningContent).length}\n\n`;
      fullContent += '='.repeat(50) + '\n\n';

      sortedChapters.forEach((chapter, index) => {
        fullContent += `${chapter.chapterTitle}\n\n`;

        if (chapter.reasoningContent && confirm(`章节"${chapter.chapterTitle}"有思维链内容，是否包含在导出文件中？`)) {
          fullContent += `【模型思考过程】\n${chapter.reasoningContent}\n\n`;
          fullContent += `【生成内容】\n`;
        }

        fullContent += chapter.content + '\n\n';
        fullContent += '='.repeat(50) + '\n\n';

        fullContent += `[本章统计: 字符数 ${chapter.characterCount} | 中文字符 ${chapter.chineseCount}`;
        if (chapter.isEdited) {
          fullContent += ' | 已编辑';
        }
        if (chapter.imported) {
          fullContent += ' | 已导入';
        }
        if (chapter.reasoningContent) {
          fullContent += ' | 有思维链';
        }
        fullContent += ']\n\n';
      });

      const totalChars = sortedChapters.reduce((sum, chapter) => sum + chapter.characterCount, 0);
      const totalChinese = sortedChapters.reduce((sum, chapter) => sum + chapter.chineseCount, 0);

      fullContent += `\n总体统计:\n`;
      fullContent += `总章节数: ${sortedChapters.length}\n`;
      fullContent += `总字符数: ${totalChars}\n`;
      fullContent += `总中文字符: ${totalChinese}\n`;
      fullContent += `包含思维链的章节数: ${sortedChapters.filter(c => c.reasoningContent).length}\n`;

      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `小说全本_${sortedChapters.length}章.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    },

    importAllChapters() {
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

    processImportedFile(content, filename) {
      try {
        const data = JSON.parse(content);

        if (data.format === 'novel-full-export') {
          this.importFullNovelData(data);
        } else if (data.parameters) {
          this.importLegacyFormat(data);
        } else {
          this.importAsSingleChapter(content, filename);
        }
      } catch (jsonError) {
        this.importAsSingleChapter(content, filename);
      }
    },

    importFullNovelData(data) {
      if (!data.parameters || !data.history) {
        throw new Error('文件格式不正确，缺少必要字段');
      }

      if (confirm('是否恢复保存的配置参数？')) {
        this.model = data.parameters.model || 'deepseek-reasoner';
        this.enableReasoning = data.parameters.enableReasoning !== undefined ? data.parameters.enableReasoning : true;
        this.reasoningDisplay = data.parameters.reasoningDisplay || 'separate';
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
      }

      if (confirm(`是否导入 ${data.history.length} 个章节到历史记录？`)) {
        this.history = data.history.map(item => ({
          ...item,
          isEdited: item.isEdited || false,
          imported: true,
          reasoningContent: item.reasoningContent || '',
          timestamp: item.timestamp || new Date().toISOString()
        }));

        this.saveHistory();
        alert(`成功导入 ${this.history.length} 个章节！`);

        if (this.history.length > 0) {
          this.selectHistoryItem(0);
        }
      }
    },

    importLegacyFormat(data) {
      if (data.parameters) {
        this.model = data.parameters.model || 'deepseek-reasoner';
        this.enableReasoning = data.parameters.enableReasoning !== undefined ? data.parameters.enableReasoning : true;
        this.reasoningDisplay = data.parameters.reasoningDisplay || 'separate';
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

    importAsSingleChapter(content, filename) {
      const chapterMatch = filename.match(/(第\d+章)?(.*)\.(json|txt)/i);
      const chapterTitle = chapterMatch
        ? (chapterMatch[1] || '') + (chapterMatch[2] || '导入章节')
        : '导入章节';

      const newHistoryItem = {
        chapterTitle: chapterTitle,
        content: content,
        characterCount: content.length,
        chineseCount: countChineseCharacters(content),
        timestamp: new Date().toISOString(),
        isEdited: false,
        imported: true,
        reasoningContent: '',
        config: {
          worldView: this.worldView,
          perspective: this.perspective,
          additionalInfo: this.additionalInfo,
          characters: this.characters,
          plotRequirement: this.plotRequirement,
          model: this.model,
          enableReasoning: this.enableReasoning
        }
      };

      this.history.push(newHistoryItem);
      this.saveHistory();
      this.selectHistoryItem(this.history.length - 1);

      alert(`已导入章节: ${chapterTitle}`);
    },

    getContentPreview(content, length = 100) {
      return content.length > length ? content.substring(0, length) + '...' : content;
    },

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    saveHistory() {
      localStorage.setItem('novelHistory', JSON.stringify(this.history));
    },

    loadHistory() {
      const saved = localStorage.getItem('novelHistory');
      if (saved) {
        const history = JSON.parse(saved);
        this.history = history.map(item => ({
          ...item,
          isEdited: item.isEdited || false,
          imported: item.imported || false,
          reasoningContent: item.reasoningContent || '',
          config: item.config || {}
        }));
      }
    }
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f5f5f5;
  overflow: auto;
  box-sizing: border-box;
  width: 100%;
  min-width: 320px;
}

.header {
  margin-bottom: 20px;
  padding: 15px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2c3e50, #4a6572);
  color: white;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header h1 {
  margin: 0;
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  word-break: break-word;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  width: 100%;
  min-height: 0;
}

.module {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 300px;
  max-height: none;
  width: 100%;
  box-sizing: border-box;
}

.module h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  font-size: clamp(1.1rem, 3vw, 1.4rem);
  flex-shrink: 0;
  word-break: break-word;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  flex-shrink: 0;
  position: relative;
  width: 100%;
}

.module-header h2 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.module-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 5px;
  width: 100%;
  position: relative;
}

.module-content::-webkit-scrollbar {
  width: 6px;
}

.module-content::-webkit-scrollbar-track {
  background: transparent;
}

.module-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.3s;
}

.module-content:hover::-webkit-scrollbar-thumb {
  opacity: 1;
}

.module-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.floating-generating-indicator {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 100;
  min-width: 350px;
  max-width: 400px;
}

.generating-progress {
  background: white;
  margin-top: 10px;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.progress-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.progress-text {
  flex: 1;
}

.generating-title {
  margin: 0 0 5px 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.generating-stats {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #3498db;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 5px;
  overflow-y: auto;
  max-height: none;
}

.history-item {
  background: #f8f9fa;
  margin: 3px;
  padding: 14px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e1e8ed;
  overflow: visible;
  position: relative;
  flex-shrink: 0;
}

.history-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-item.active {
  border-left-color: #e74c3c;
  background: #e3f2fd;
  border-color: #3498db;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  overflow: visible;
}

.history-item-header h4 {
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badges {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.preview-text {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.meta-info {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 12px;
  overflow: visible;
}

.history-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  overflow: visible;
}

.preview-content {
  height: auto;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  width: 100%;
}

.content-display {
  flex: 1;
  margin-bottom: 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.content-view,
.reasoning-view,
.combined-view {
  flex: 1;
  min-height: 250px;
  max-height: 100%;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #eaeaea;
  position: relative;
}

.content-view::-webkit-scrollbar,
.reasoning-view::-webkit-scrollbar,
.combined-view::-webkit-scrollbar {
  width: 4px;
}

.content-view::-webkit-scrollbar-track,
.reasoning-view::-webkit-scrollbar-track,
.combined-view::-webkit-scrollbar-track {
  background: transparent;
}

.content-view::-webkit-scrollbar-thumb,
.reasoning-view::-webkit-scrollbar-thumb,
.combined-view::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.config-section {
  margin-bottom: 25px;
  padding: 18px;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 4px solid #3498db;
  overflow: visible;
}

.parameter-settings .module-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.content-tabs::-webkit-scrollbar {
  height: 3px;
}

.content-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.content-tabs::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 1.5px;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  transition: all 0.3s;
  position: relative;
  border-bottom: 2px solid transparent;
  margin-bottom: -12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-button:hover:not(.disabled) {
  background: #e9ecef;
  color: #333;
}

.tab-button.active {
  background: white;
  color: #3498db;
  border-bottom: 2px solid #3498db;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}

.tab-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-badge {
  background: #e74c3c;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  margin-left: 5px;
}

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

.checkbox-group {
  gap: 2px;
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.checkbox-input {
  width: 15px;
  height: 15px;
  cursor: pointer;
  position: relative;
  top: 0px;
  flex-shrink: 0;
  margin-right: 8px;
}

.checkbox-label {
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  line-height: 1.4;
  color: #000000;
}

.disabled-hint {
  color: #7f8c8d;
  font-size: 12px;
  font-style: italic;
}

.content-view,
.reasoning-view,
.combined-view {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #eaeaea;
}

.reasoning-view {
  background: #f8f9fa;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reasoning-text {
  color: #2c3e50;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.streaming-reasoning {
  min-height: 200px;
}

.combined-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.combined-section {
  flex: 1;
}

.combined-section h4 {
  margin-bottom: 10px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  font-size: 16px;
}

.combined-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #3498db, transparent);
  margin: 10px 0;
}

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

.history-item.hasReasoning {
  border-left-color: #9b59b6;
}

.reasoning-badge {
  background: #9b59b6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

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

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

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
  overflow-y: auto;
}

.content-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.content-text {
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.8;
  font-family: 'Georgia', serif;
}

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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
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

.input-field,
.textarea-field,
.select-field {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  background: white;
}

.input-field:focus,
.textarea-field:focus,
.select-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.textarea-field.auto-resize {
  resize: none;
  overflow-y: hidden;
  min-height: 60px;
  line-height: 1.5;
  transition: height 0.2s ease;
}

.textarea-field.small.auto-resize {
  min-height: 60px;
  max-height: 200px;
}

.content-textarea.auto-resize {
  min-height: 400px;
  max-height: 800px;
}

.textarea-field.auto-resize::-webkit-scrollbar,
.content-textarea.auto-resize::-webkit-scrollbar {
  width: 6px;
}

.textarea-field.auto-resize::-webkit-scrollbar-track,
.content-textarea.auto-resize::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.textarea-field.auto-resize::-webkit-scrollbar-thumb,
.content-textarea.auto-resize::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.textarea-field.auto-resize::-webkit-scrollbar-thumb:hover,
.content-textarea.auto-resize::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.input-field.small,
.textarea-field.small {
  font-size: 13px;
  margin-bottom: 15px;
}

.input-field.small {
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

.character-juese {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e1e8ed;
  display: grid;
  align-items: start;
}

.btn-primary,
.btn-secondary,
.btn-success,
.btn-danger {
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

.btn-secondary.small,
.btn-danger.small {
  padding: 6px 12px;
  font-size: 12px;
}

.generate-btn {
  min-width: 140px;
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

.stats {
  color: #7f8c8d;
  font-size: 14px;
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

@media (min-width: 768px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 15px;
  }

  .parameter-settings {
    grid-column: 1 / 3;
    grid-row: 1;
  }

  .parameter-settings .module-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .parameter-settings .config-section {
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
  }

  .preview {
    grid-column: 1;
    grid-row: 2;
  }

  .history {
    grid-column: 2;
    grid-row: 2;
  }
}

@media (min-width: 1024px) {
  .app-container {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .main-content {
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: auto;
    gap: 20px;
  }

  .parameter-settings {
    grid-column: 1;
    grid-row: 1;
  }

  .parameter-settings .module-content {
    display: flex;
    flex-direction: column;
    grid-template-columns: none;
    overflow-y: auto;
  }

  .preview {
    grid-column: 2;
    grid-row: 1;
  }

  .history {
    grid-column: 3;
    grid-row: 1;
  }

  .floating-generating-indicator {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 100;
    min-width: 350px;
    max-width: 400px;
  }
}

@media (max-width: 767px) {
  .app-container {
    padding: 8px;
    overflow-x: hidden;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
  }

  .module {
    min-height: 250px;
    padding: 12px;
    margin-bottom: 0;
  }

  .module-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .input-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .character-juese {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input-with-button {
    flex-direction: column;
    gap: 8px;
  }

  .input-with-button .input-field {
    width: 100%;
  }

  .history-list {
    max-height: 400px;
  }

  .content-view,
  .reasoning-view,
  .combined-view {
    min-height: 200px;
  }

  .floating-generating-indicator {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 400px;
    z-index: 1000;
  }

  .generating-progress {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .progress-spinner {
    margin-bottom: 10px;
  }

  .content-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 5px;
  }

  .tab-button {
    white-space: nowrap;
    flex-shrink: 0;
  }

  input,
  select,
  textarea {
    max-width: 100%;
    box-sizing: border-box;
  }

  .history-actions {
    flex-wrap: wrap;
    gap: 6px;
  }

  .history-actions button {
    flex: 1;
    min-width: calc(50% - 6px);
    font-size: 12px;
    padding: 6px 8px;
  }
}

@media (min-resolution: 144dpi) {
  .module {
    padding: 12px;
  }

  .header {
    padding: 12px 15px;
  }

  .input-field,
  .textarea-field,
  .select-field {
    padding: 8px 10px;
  }
}

@media (min-width: 1600px) {
  .app-container {
    max-width: 1600px;
  }

  .main-content {
    gap: 25px;
  }

  .module {
    padding: 25px;
  }
}

@media (hover: none) and (pointer: coarse) {

  button,
  .tab-button {
    min-height: 44px;
    padding: 12px 16px;
  }

  input,
  select,
  textarea {
    font-size: 16px;
  }
}

@media (max-width: 320px) {
  .header h1 {
    font-size: 1rem;
  }

  .module h2 {
    font-size: 1rem;
  }

  .config-section {
    padding: 12px;
  }
}

.character-juese input,
.character-juese textarea {
  max-width: 100%;
}

@media (min-width: 1024px) {
  .module-content {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }

  .module-content::-webkit-scrollbar {
    width: 8px;
  }

  .module-content::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.scrollable-area {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollable-area::-webkit-scrollbar {
  display: none;
}

.content-text,
.reasoning-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
  font-family: 'Georgia', serif;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
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

.importing-indicator p {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

.input-group {
  margin-bottom: 20px;
}

.input-group:last-child {
  margin-bottom: 0;
}
</style>