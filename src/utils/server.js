import OpenAI from "openai";

// 创建OpenAI客户端实例
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-44450728c29a4dada3a49d045c13430d', // 可以改为从环境变量获取
    dangerouslyAllowBrowser: true // 允许在浏览器中运行
});

// 统计中文字符数量
function countChineseCharacters(str) {
    if (!str) return 0;
    const regex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u20000-\u2A6DF]/gu;
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}

// 主功能函数 - 生成内容
export async function generateContent(params) {
    try {
        const {
            systemConfig = {},
            history = "",
            userConfig = {},
            model = "deepseek-reasoner",
            maxTokens = 64000
        } = params;

        const stream = await openai.chat.completions.create({
            messages: [
                { role: "system", content: JSON.stringify(systemConfig) },
                { role: "assistant", content: history },
                { role: "user", content: JSON.stringify(userConfig) }
            ],
            model: model,
            max_tokens: maxTokens,
            stream: true,
        });

        return stream;
        
    } catch (error) {
        console.error("API调用失败:", error);
        throw error;
    }
}

// 处理流式响应
export async function processStream(stream, onContentUpdate) {
    let reasoningContent = "";
    let finalContent = "";
    let chineseCount = 0;

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        const reasoning = chunk.choices[0]?.delta?.reasoning_content || "";
        
        if (content) {
            finalContent += content;
            chineseCount = countChineseCharacters(finalContent);
            
            // 回调函数更新内容
            if (onContentUpdate) {
                onContentUpdate({
                    content: finalContent,
                    chineseCount: chineseCount,
                    characterCount: finalContent.length
                });
            }
        }
        
        if (reasoning) {
            reasoningContent += reasoning;
        }
        
        if (chunk.choices[0]?.finish_reason) {
            console.log(`生成完成,原因:${chunk.choices[0].finish_reason}`);
        }
    }

    return {
        finalContent,
        reasoningContent,
        chineseCount,
        characterCount: finalContent.length
    };
}

// 默认配置
export const defaultSystemConfig = {
    "设定": "专业的小说创作工具",
    "世界观设定": "仙侠世界",
    "字数要求": "每章字数越多越好，请尽量扩充细节完善",
    "输出框架": "第N章:章节名\n正文内容",
    "特殊要求": {
        "带入视角": "第三人称",
        "情节节奏": "控制情节密度,避免事件过多导致节奏过快",
        "细节描写": "重点描写人物表情、动作、心理活动和环境氛围",
        "人物塑造": "通过言行举止展现人物性格,避免标签化描述",
        "章节结尾": "请勿在本章结尾添加任何总结性、评价性、说明性的段落。本章结尾应自然收束，聚焦于场景、动作、对话或人物的内心感受，不要解释本章的意义或教训。结尾必须保持纯粹的叙事状态，不要跳出故事进行评论或总结。",
    }
};

// 默认导出
export default {
    generateContent,
    processStream,
    defaultSystemConfig,
    countChineseCharacters
};