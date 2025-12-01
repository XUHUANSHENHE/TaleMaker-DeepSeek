import OpenAI from "openai";

// 统计中文字符数量
export function countChineseCharacters(str) {
    if (!str) return 0;
    const regex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u20000-\u2A6DF]/gu;
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}

// 创建OpenAI客户端实例
function createOpenAIClient(apiKey) {
    return new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
}

// 构建系统配置
export function buildSystemConfig(worldView, perspective, additionalInfo) {
    const config = {
        "设定": "你是一个专业的小说创作助手，请根据用户要求生成高质量的小说章节内容。",
        "世界观设定": worldView,
        "人称视角": perspective,
        "写作要求": {
            "语言风格": "生动形象，富有文学性",
            "描写重点": "注重环境氛围、人物心理、动作细节",
            "章节结构": "完整的起承转合",
            "字数控制": "1500-3000字为宜"
        },
        "重要规则": "请直接开始章节内容，不要添加任何开场白、说明或总结性文字。章节结尾要自然收束，不要跳出故事进行评论。"
    };

    if (additionalInfo && additionalInfo.trim()) {
        config["补充信息"] = additionalInfo;
    }

    return config;
}

// 构建用户配置
export function buildUserConfig(chapterNumber, chapterName, plotRequirement, characters, history = "") {
    const config = {
        "章节信息": `第${chapterNumber}章${chapterName ? `：${chapterName}` : ''}`,
        "情节要求": plotRequirement || "请根据世界观设定自然发展情节"
    };

    // 添加角色信息
    const validCharacters = characters.filter(char => char.name && char.setting);
    if (validCharacters.length > 0) {
        config["登场角色"] = validCharacters;
    }

    // 添加上下文信息
    if (history && history.trim()) {
        config["历史上下文"] = history;
    }

    return config;
}

// 构建完整的提示词
function buildMessages(systemConfig, userConfig) {
    const systemMessage = {
        role: "system",
        content: `你是一个专业的小说创作助手。请严格按照以下要求生成内容：

世界观：${systemConfig.世界观设定}
人称视角：${systemConfig.人称视角}
写作风格：${JSON.stringify(systemConfig.写作要求)}
特殊要求：${systemConfig.重要规则}

请直接输出小说章节内容，不要添加任何额外的说明、开场白或总结。`
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

    return [systemMessage, userMessage];
}

// 主功能函数 - 生成内容
export async function generateContent(params) {
    try {
        const {
            apiKey,
            systemConfig = {},
            userConfig = {},
            model = "deepseek-chat",
            maxTokens = 4000,
            temperature = 0.7
        } = params;

        // 验证必要参数
        if (!apiKey) {
            throw new Error("API密钥不能为空");
        }

        // 创建OpenAI客户端
        const openai = createOpenAIClient(apiKey);

        // 构建消息
        const messages = buildMessages(systemConfig, userConfig);

        console.log("发送请求到DeepSeek API...");
        console.log("系统消息:", messages[0].content);
        console.log("用户消息:", messages[1].content);

        const stream = await openai.chat.completions.create({
            messages: messages,
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            stream: true,
        });

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
        } else {
            errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
}

// 处理流式响应 - 改进版本
export async function processStream(stream, onContentUpdate) {
    let fullContent = "";
    let chineseCount = 0;
    let characterCount = 0;
    let startTime = Date.now();
    let lastUpdateTime = startTime;

    try {
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            
            if (content) {
                fullContent += content;
                characterCount = fullContent.length;
                chineseCount = countChineseCharacters(fullContent);
                
                const currentTime = Date.now();
                
                // 实时回调更新内容 - 每次有内容就立即更新
                if (onContentUpdate && content) {
                    onContentUpdate({
                        content: fullContent,
                        chineseCount: chineseCount,
                        characterCount: characterCount,
                        incrementalContent: content
                    });
                }
                
                lastUpdateTime = currentTime;
            }
            
            // 检查是否完成
            if (chunk.choices[0]?.finish_reason) {
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000;
                console.log(`生成完成, 原因: ${chunk.choices[0].finish_reason}`);
                console.log(`总耗时: ${duration.toFixed(2)}秒`);
                console.log(`总字符数: ${characterCount}, 中文字符: ${chineseCount}`);
                break;
            }
        }

        // 最终后处理
        const processedContent = postProcessContent(fullContent);
        
        return {
            finalContent: processedContent,
            chineseCount: countChineseCharacters(processedContent),
            characterCount: processedContent.length,
            success: true,
            duration: (Date.now() - startTime) / 1000
        };
        
    } catch (error) {
        console.error("流处理错误:", error);
        return {
            finalContent: fullContent,
            chineseCount: chineseCount,
            characterCount: characterCount,
            success: false,
            error: error.message
        };
    }
}

// 内容后处理
function postProcessContent(content) {
    if (!content) return "";
    
    let processed = content.trim();
    
    // 清理常见的AI附加文本
    const unwantedSuffixes = [
        "\n\n以上就是本章的内容。",
        "\n\n本章到此结束。",
        "\n\n希望这个章节符合您的要求。",
        "\n\n如果您需要修改或继续生成，请告诉我。",
        "\n\n请问您对本章内容是否满意？"
    ];
    
    unwantedSuffixes.forEach(suffix => {
        if (processed.endsWith(suffix)) {
            processed = processed.slice(0, -suffix.length);
        }
    });
    
    // 清理多余的换行
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
}

// 验证配置
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

export default {
    generateContent,
    processStream,
    buildSystemConfig,
    buildUserConfig,
    countChineseCharacters,
    validateConfig
};