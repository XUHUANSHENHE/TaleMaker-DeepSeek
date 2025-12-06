import OpenAI from "openai";

export function countChineseCharacters(str) {
    if (!str) return 0;
    const regex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u20000-\u2A6DF]/gu;
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}

function createOpenAIClient(apiKey) {
    return new OpenAI({
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
}

export function buildSystemConfig(worldView, perspective, additionalInfo) {
    const config = {
        "设定": "你是一个专业的小说创作助手，请根据详细的要求生成高质量的小说章节内容。",
        "世界观设定": worldView,
        "人称视角": perspective,
        "写作要求": {
            "描写重点": "注重环境氛围、人物心理、动作细节",
            "章节结构": "完整的起承转合",
            "字数控制": "3000-4000字为宜"
        },
        "重要规则": "不要添加任何说明或总结性文字。章节结尾要自然收束，不要跳出故事进行评论。"
    };

    if (additionalInfo && additionalInfo.trim()) {
        config["补充信息"] = additionalInfo;
        
        if (!config.写作要求.其他要求) {
            config.写作要求.其他要求 = additionalInfo;
        } else {
            config.写作要求.其他要求 += `\n${additionalInfo}`;
        }
    }
    return config;
}

export function buildUserConfig(chapterNumber, chapterName, plotRequirement, characters, history = "") {
    const config = {
        "章节信息": `第${chapterNumber}章${chapterName ? `：${chapterName}` : ''}`,
        "情节要求": plotRequirement || "请根据世界观设定自然发展情节"
    };

    const validCharacters = characters.filter(char => char.name && char.setting);
    if (validCharacters.length > 0) {
        config["登场角色"] = validCharacters;
    }

    if (history && history.trim()) {
        config["历史上下文"] = history;
    }

    return config;
}

function buildMessages(systemConfig, userConfig) {
    let systemContent = `你是一个专业的小说创作助手。请严格按照以下要求生成小说章节内容：

【世界观设定】
${systemConfig.世界观设定}

【人称视角】
${systemConfig.人称视角}

【写作要求】
- 语言风格：${systemConfig.写作要求.语言风格}
- 描写重点：${systemConfig.写作要求.描写重点}
- 章节结构：${systemConfig.写作要求.章节结构}
- 字数控制：${systemConfig.写作要求.字数控制}`;

    if (systemConfig.补充信息 && systemConfig.补充信息.trim()) {
        systemContent += `\n\n【补充信息】\n${systemConfig.补充信息}`;
    }

    systemContent += `\n\n【重要规则】\n${systemConfig.重要规则}`;

    const systemMessage = {
        role: "system",
        content: systemContent
    };

    const userMessageContent = [
        `请生成：${userConfig.章节信息}`,
        `情节要求：${userConfig.情节要求}`
    ];

    if (userConfig.登场角色 && userConfig.登场角色.length > 0) {
        userMessageContent.push(`登场角色：${JSON.stringify(userConfig.登场角色)}`);
    }

    if (userConfig.历史上下文) {
        userMessageContent.push(`历史上下文：${userConfig.历史上下文}`);
    }

    const userMessage = {
        role: "user",
        content: userMessageContent.join('\n')
    };

    console.log('构建的消息:', { systemMessage, userMessage });
    return [systemMessage, userMessage];
}

export async function generateContent(params) {
    try {
        const {
            apiKey,
            systemConfig = {},
            userConfig = {},
            model = "deepseek-reasoner",
            maxTokens = 64000,
            temperature = 0.7,
            enableReasoning = true
        } = params;

        if (!apiKey) {
            throw new Error("API密钥不能为空");
        }

        const openai = createOpenAIClient(apiKey);

        const messages = buildMessages(systemConfig, userConfig);

        console.log("发送请求到DeepSeek API...");
        console.log("启用思维链:", enableReasoning);
        console.log("使用模型:", model);

        const requestConfig = {
            messages: messages,
            model: model,
            max_tokens: maxTokens,
            stream: true,
        };

        if (enableReasoning && model === "deepseek-reasoner") {
            requestConfig.extra_body = {
                thinking: { type: "enabled" }
            };
            console.log("已启用思维链模式");
        } else if (enableReasoning && model !== "deepseek-reasoner") {
            console.warn("只有deepseek-reasoner模型支持思维链，已禁用思维链");
            requestConfig.temperature = temperature;
        } else {
            requestConfig.temperature = temperature;
        }

        const stream = await openai.chat.completions.create(requestConfig);

        console.log("API请求成功，开始流式传输...");
        return stream;
        
    } catch (error) {
        console.error("API调用失败:", error);
        
        let errorMessage = "生成失败: ";
        if (error.message.includes("401")) {
            errorMessage += "API密钥无效或已过期";
        } else if (error.message.includes("429")) {
            errorMessage += "请求频率过高，请稍后再试";
        } else if (error.message.includes("500")) {
            errorMessage += "服务器内部错误，请稍后再试";
        } else if (error.message.includes("network")) {
            errorMessage += "网络连接错误，请检查网络设置";
        } else if (error.message.includes("thinking")) {
            errorMessage += "思维链参数设置错误，请检查模型是否支持";
        } else {
            errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
}

export async function processStream(stream, onContentUpdate) {
    let fullContent = "";
    let reasoningContent = "";
    let chineseCount = 0;
    let characterCount = 0;
    let startTime = Date.now();
    let lastUpdateTime = startTime;

    try {
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta || {};
            const content = delta.content || "";
            const reasoning = delta.reasoning_content || "";
            
            if (reasoning) {
                reasoningContent += reasoning;
                
                if (onContentUpdate) {
                    onContentUpdate({
                        content: fullContent,
                        chineseCount: chineseCount,
                        characterCount: characterCount,
                        incrementalContent: content,
                        reasoningContent: reasoningContent,
                        incrementalReasoning: reasoning
                    });
                }
            }
            
            if (content) {
                fullContent += content;
                characterCount = fullContent.length;
                chineseCount = countChineseCharacters(fullContent);
                
                const currentTime = Date.now();
                
                if (onContentUpdate) {
                    onContentUpdate({
                        content: fullContent,
                        chineseCount: chineseCount,
                        characterCount: characterCount,
                        incrementalContent: content,
                        reasoningContent: reasoningContent,
                        incrementalReasoning: reasoning || ""
                    });
                }
                
                lastUpdateTime = currentTime;
            }
            
            if (chunk.choices[0]?.finish_reason) {
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000;
                console.log(`生成完成, 原因: ${chunk.choices[0].finish_reason}`);
                console.log(`总耗时: ${duration.toFixed(2)}秒`);
                console.log(`总字符数: ${characterCount}, 中文字符: ${chineseCount}`);
                console.log(`思维链长度: ${reasoningContent.length}字符`);
                break;
            }
        }

        const processedContent = postProcessContent(fullContent);
        
        return {
            finalContent: processedContent,
            reasoningContent: reasoningContent,
            chineseCount: countChineseCharacters(processedContent),
            characterCount: processedContent.length,
            success: true,
            duration: (Date.now() - startTime) / 1000
        };
        
    } catch (error) {
        console.error("流处理错误:", error);
        return {
            finalContent: fullContent,
            reasoningContent: reasoningContent,
            chineseCount: chineseCount,
            characterCount: characterCount,
            success: false,
            error: error.message
        };
    }
}

export async function processNonStreamResponse(stream, onContentUpdate) {
    try {
        let fullResponse = "";
        
        for await (const chunk of stream) {
            fullResponse += JSON.stringify(chunk) + "\n";
        }
        
        const lines = fullResponse.split("\n").filter(line => line.trim());
        let response = null;
        
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                response = JSON.parse(lines[i]);
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!response) {
            throw new Error("无法解析API响应");
        }
        
        const reasoningContent = response.choices?.[0]?.message?.reasoning_content || "";
        const finalContent = response.choices?.[0]?.message?.content || "";
        
        const processedContent = postProcessContent(finalContent);
        const chineseCount = countChineseCharacters(processedContent);
        
        if (onContentUpdate) {
            onContentUpdate({
                content: processedContent,
                reasoningContent: reasoningContent,
                chineseCount: chineseCount,
                characterCount: processedContent.length,
                isComplete: true
            });
        }
        
        return {
            finalContent: processedContent,
            reasoningContent: reasoningContent,
            chineseCount: chineseCount,
            characterCount: processedContent.length,
            success: true
        };
        
    } catch (error) {
        console.error("处理非流式响应错误:", error);
        return {
            finalContent: "",
            reasoningContent: "",
            chineseCount: 0,
            characterCount: 0,
            success: false,
            error: error.message
        };
    }
}

function postProcessContent(content) {
    if (!content) return "";
    
    let processed = content.trim();
    
    const unwantedSuffixes = [
        "\n\n以上就是本章的内容。",
        "\n\n本章到此结束。",
        "\n\n希望这个章节符合您的要求。",
        "\n\n如果您需要修改或继续生成，请告诉我。",
        "\n\n请问您对本章内容是否满意？",
        "\n\n以上就是根据您的要求生成的小说章节内容。",
        "\n\n以上就是为您生成的小说章节。",
        "\n\n内容生成完毕。",
        "\n\n生成完成。"
    ];
    
    unwantedSuffixes.forEach(suffix => {
        if (processed.endsWith(suffix)) {
            processed = processed.slice(0, -suffix.length);
        }
    });
    
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
}

export function postProcessReasoning(content) {
    if (!content) return "";
    
    let processed = content.trim();
    
    const reasoningMarkers = [
        "思考过程：",
        "思考：",
        "推理：",
        "分析：",
        "让我们一步步思考：",
        "首先，",
        "接下来，",
        "最后，"
    ];
    
    reasoningMarkers.forEach(marker => {
        if (processed.startsWith(marker)) {
            processed = processed.slice(marker.length).trim();
        }
    });
    
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
}

export function validateConfig(apiKey, worldView, perspective, chapterNumber) {
    const errors = [];

    if (!apiKey || apiKey.trim().length === 0) {
        errors.push("API密钥不能为空");
    }

    if (!worldView || worldView.trim().length === 0) {
        errors.push("世界观设定不能为空");
    }

    if (!perspective || perspective.trim().length === 0) {
        errors.push("人称视角不能为空");
    }

    if (!chapterNumber || chapterNumber < 1) {
        errors.push("章节号必须大于0");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function formatReasoningContent(reasoningContent, includeMarkdown = true) {
    if (!reasoningContent) return "";
    
    let formatted = reasoningContent;
    
    if (includeMarkdown) {
        formatted = `## 模型思考过程\n\n\`\`\`\n${reasoningContent}\n\`\`\``;
    }
    
    return formatted;
}

export function combineReasoningAndContent(reasoningContent, finalContent, options = {}) {
    const {
        showReasoning = true,
        reasoningTitle = "模型思考过程",
        contentTitle = "生成内容",
        separator = "\n\n---\n\n"
    } = options;
    
    if (!showReasoning || !reasoningContent) {
        return finalContent;
    }
    
    return `## ${reasoningTitle}\n\n${reasoningContent}${separator}## ${contentTitle}\n\n${finalContent}`;
}

export function generateChapterTitle(chapterNumber, chapterName = "") {
    return `第${chapterNumber}章${chapterName ? `：${chapterName}` : ''}`;
}

export function getTextStatistics(text) {
    if (!text) {
        return {
            characterCount: 0,
            chineseCount: 0,
            lineCount: 0,
            wordCount: 0
        };
    }
    
    const characterCount = text.length;
    const chineseCount = countChineseCharacters(text);
    const lineCount = text.split('\n').length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
        characterCount,
        chineseCount,
        lineCount,
        wordCount
    };
}

export function createChapterData(chapterTitle, content, reasoningContent = "", config = {}) {
    const stats = getTextStatistics(content);
    
    return {
        chapterTitle,
        content,
        reasoningContent,
        characterCount: stats.characterCount,
        chineseCount: stats.chineseCount,
        lineCount: stats.lineCount,
        wordCount: stats.wordCount,
        timestamp: new Date().toISOString(),
        isEdited: false,
        imported: false,
        config: {
            model: config.model || "deepseek-reasoner",
            enableReasoning: config.enableReasoning || false,
            worldView: config.worldView || "",
            perspective: config.perspective || "",
            additionalInfo: config.additionalInfo || "",
            characters: config.characters || [],
            plotRequirement: config.plotRequirement || ""
        }
    };
}

export function exportChapter(chapterData, format = 'txt') {
    if (!chapterData) return null;
    
    let content = '';
    let filename = `${chapterData.chapterTitle}`;
    
    switch (format.toLowerCase()) {
        case 'json':
            content = JSON.stringify(chapterData, null, 2);
            filename += '.json';
            break;
            
        case 'txt':
            content = chapterData.content;
            filename += '.txt';
            break;
            
        case 'md':
            if (chapterData.reasoningContent) {
                content = combineReasoningAndContent(
                    chapterData.reasoningContent,
                    chapterData.content,
                    {
                        showReasoning: true,
                        reasoningTitle: "模型思考过程",
                        contentTitle: chapterData.chapterTitle,
                        separator: "\n\n---\n\n"
                    }
                );
            } else {
                content = `# ${chapterData.chapterTitle}\n\n${chapterData.content}`;
            }
            filename += '.md';
            break;
            
        case 'reasoning':
            content = chapterData.reasoningContent || '';
            filename += '_思维链.txt';
            break;
            
        default:
            content = chapterData.content;
            filename += '.txt';
    }
    
    return {
        content,
        filename,
        format
    };
}

export function exportMultipleChapters(chapters, format = 'txt', includeReasoning = false) {
    if (!chapters || chapters.length === 0) return null;
    
    let content = '';
    let filename = `小说全本_${chapters.length}章`;
    
    switch (format.toLowerCase()) {
        case 'json':
            const exportData = {
                format: 'novel-full-export',
                version: '1.2',
                exportedAt: new Date().toISOString(),
                generator: 'TaleMaker DeepSeek便捷小说生成器',
                chapters: chapters.map(chapter => ({
                    ...chapter,
                    config: chapter.config || {}
                })),
                statistics: {
                    totalChapters: chapters.length,
                    totalCharacters: chapters.reduce((sum, ch) => sum + ch.characterCount, 0),
                    totalChineseCharacters: chapters.reduce((sum, ch) => sum + ch.chineseCount, 0),
                    chaptersWithReasoning: chapters.filter(ch => ch.reasoningContent).length
                }
            };
            content = JSON.stringify(exportData, null, 2);
            filename += '.json';
            break;
            
        case 'txt':
            content = chapters.map(chapter => {
                let chapterContent = `${chapter.chapterTitle}\n\n${chapter.content}`;
                
                if (includeReasoning && chapter.reasoningContent) {
                    chapterContent = `【模型思考过程】\n${chapter.reasoningContent}\n\n【生成内容】\n${chapter.content}`;
                }
                
                return chapterContent + '\n\n' + '='.repeat(50) + '\n\n';
            }).join('\n');
            
            const totalChars = chapters.reduce((sum, ch) => sum + ch.characterCount, 0);
            const totalChinese = chapters.reduce((sum, ch) => sum + ch.chineseCount, 0);
            
            content += `\n统计信息：\n`;
            content += `总章节数: ${chapters.length}\n`;
            content += `总字符数: ${totalChars}\n`;
            content += `总中文字符数: ${totalChinese}\n`;
            
            filename += '.txt';
            break;
            
        case 'md':
            content = '# 小说全本\n\n';
            content += `生成时间: ${new Date().toLocaleString()}\n`;
            content += `总章节数: ${chapters.length}\n\n`;
            
            chapters.forEach((chapter, index) => {
                content += `## ${chapter.chapterTitle}\n\n`;
                
                if (includeReasoning && chapter.reasoningContent) {
                    content += `### 模型思考过程\n\n\`\`\`\n${chapter.reasoningContent}\n\`\`\`\n\n`;
                    content += `### 生成内容\n\n`;
                }
                
                content += `${chapter.content}\n\n`;
                
                if (index < chapters.length - 1) {
                    content += '---\n\n';
                }
            });
            
            filename += '.md';
            break;
            
        default:
            content = chapters.map(chapter => 
                `${chapter.chapterTitle}\n\n${chapter.content}\n\n`
            ).join('\n');
            filename += '.txt';
    }
    
    return {
        content,
        filename,
        format,
        chapterCount: chapters.length
    };
}

export function importChapters(importData) {
    try {
        const data = JSON.parse(importData);
        
        if (data.format === 'novel-full-export') {
            return {
                type: 'full-export',
                data: data,
                chapters: data.chapters || [],
                parameters: data.parameters || null,
                statistics: data.statistics || null
            };
        }
        
        if (data.chapterTitle && data.content) {
            return {
                type: 'single-chapter',
                chapters: [data]
            };
        }
        
        return {
            type: 'unknown-json',
            data: data
        };
        
    } catch (error) {
        return {
            type: 'plain-text',
            content: importData
        };
    }
}

export function generateModelConfigHelp() {
    return {
        models: [
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner',
                description: '支持思维链推理的模型，能展示模型的思考过程',
                supportsReasoning: true,
                maxTokens: 64000
            },
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                description: '常规聊天模型，响应速度快',
                supportsReasoning: false,
                maxTokens: 32000
            }
        ],
        reasoning: {
            enabled: '开启思维链，模型会先输出思考过程再生成最终答案',
            disabled: '关闭思维链，直接生成最终答案',
            note: '只有DeepSeek Reasoner模型支持思维链功能'
        }
    };
}

export default {
    generateContent,
    processStream,
    processNonStreamResponse,
    buildSystemConfig,
    buildUserConfig,
    countChineseCharacters,
    validateConfig,
    formatReasoningContent,
    combineReasoningAndContent,
    postProcessReasoning,
    generateChapterTitle,
    getTextStatistics,
    createChapterData,
    exportChapter,
    exportMultipleChapters,
    importChapters,
    generateModelConfigHelp
};