export class DeepSeekProvider {
    name = "deepseek";
    async interview(req) {
        return {
            output: {
                title: "DeepSeek Placeholder Interview",
                summary: `DeepSeek placeholder for: ${req.input}`,
                strengths: [],
                improvement: [],
                hiring_signal: "N/A",
                key_observations: []
            }
        };
    }
    async chat(req) {
        return {
            reply: `DeepSeek placeholder reply for: ${req.message}`
        };
    }
}
