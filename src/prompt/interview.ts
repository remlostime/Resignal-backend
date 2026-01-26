import type { AIRequest } from "../ai/AIProvider.js"

export function buildPrompt(req: AIRequest): string {
  if (req.task === "mock_interview") {
    return `
你是一个严格但专业的面试官。

候选人的回答如下：
"${req.input}"

请从以下角度给出反馈：
1. 是否切中问题
2. 表达是否清晰
3. 逻辑结构
4. 可以如何改进

请用 ${req.locale === "zh-CN" ? "中文" : "英文"} 回答。
`
  }

  return req.input
}