# Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-19 | Use DeepSeek function calling for LLM schema enforcement instead of simple JSON mode | The n8n production workflow uses LangChain's Structured Output Parser which internally uses function calling to enforce schemas. This is more reliable than response_format: json_object because the LLM must call the function with properly typed arguments. DeepSeek supports this via the tools API with tool_choice enforcement. Test proved this works perfectly - generated valid scenario in 45 seconds with all 11 expected_calculations fields populated. |
