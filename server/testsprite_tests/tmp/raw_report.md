
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** server
- **Date:** 2026-03-07
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 post api generate bite with valid topic
- **Test Code:** [TC001_post_api_generate_bite_with_valid_topic.py](./TC001_post_api_generate_bite_with_valid_topic.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 81, in <module>
  File "<string>", line 23, in test_post_api_generate_bite_with_valid_topic
AssertionError: Expected 200 OK but got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/5017acfa-c68c-4850-aca7-f7e712dc73ab
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post api generate bite with reused question
- **Test Code:** [TC002_post_api_generate_bite_with_reused_question.py](./TC002_post_api_generate_bite_with_reused_question.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 77, in <module>
  File "<string>", line 18, in test_post_api_generate_bite_with_reused_question
AssertionError: Expected 200 OK, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/8b053c06-2a94-404b-a29a-45e3ea6a787f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 post api generate bite with server error
- **Test Code:** [TC003_post_api_generate_bite_with_server_error.py](./TC003_post_api_generate_bite_with_server_error.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/c4b39e00-1fbc-4850-aec6-a9aefb0fc184
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 post api chat tutor with valid message and context
- **Test Code:** [TC004_post_api_chat_tutor_with_valid_message_and_context.py](./TC004_post_api_chat_tutor_with_valid_message_and_context.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 91, in <module>
  File "<string>", line 26, in test_post_api_chat_tutor_with_valid_message_and_context
AssertionError: Generate bite failed with status 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/5fc26526-c5c1-4e59-a52b-4e91010bef9d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 post api chat tutor with empty message
- **Test Code:** [TC005_post_api_chat_tutor_with_empty_message.py](./TC005_post_api_chat_tutor_with_empty_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/07cc280a-7e28-4888-9ecd-15a6853bc3bc
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 post api chat tutor with insufficient credits
- **Test Code:** [TC006_post_api_chat_tutor_with_insufficient_credits.py](./TC006_post_api_chat_tutor_with_insufficient_credits.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 64, in <module>
  File "<string>", line 62, in test_post_api_chat_tutor_with_insufficient_credits
AssertionError: Expected 4xx error due to insufficient credits, got: 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/f19ccad3-6b3e-40b4-955a-93775906370f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 post api save result with valid data
- **Test Code:** [TC007_post_api_save_result_with_valid_data.py](./TC007_post_api_save_result_with_valid_data.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 63, in <module>
  File "<string>", line 25, in test_post_api_save_result_with_valid_data
AssertionError: Generate bite failed: {"success":false,"error":"[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent: [400 Bad Request] API key not valid. Please pass a valid API key. [{\"@type\":\"type.googleapis.com/google.rpc.ErrorInfo\",\"reason\":\"API_KEY_INVALID\",\"domain\":\"googleapis.com\",\"metadata\":{\"service\":\"generativelanguage.googleapis.com\"}},{\"@type\":\"type.googleapis.com/google.rpc.LocalizedMessage\",\"locale\":\"en-US\",\"message\":\"API key not valid. Please pass a valid API key.\"}]"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/ba075e53-8bd1-4822-9c67-92a99d817fa4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 post api save result with network failure
- **Test Code:** [TC008_post_api_save_result_with_network_failure.py](./TC008_post_api_save_result_with_network_failure.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 28, in test_post_api_save_result_with_network_failure
AssertionError: Generate-bite failed with status 500

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 88, in <module>
  File "<string>", line 40, in test_post_api_save_result_with_network_failure
Exception: Setup generate-bite failed: Generate-bite failed with status 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/a8d48f6e-0149-4d77-bf87-a65998177b99
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 post api get summary with recent mistakes
- **Test Code:** [TC009_post_api_get_summary_with_recent_mistakes.py](./TC009_post_api_get_summary_with_recent_mistakes.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 47, in <module>
  File "<string>", line 41, in test_post_api_get_summary_with_recent_mistakes
AssertionError: No retry options, wrong answer items, or valid empty message found in summary response

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/ff4f4458-29bf-49f3-9b0f-ee58d77f0cfb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 post api get summary with no recent mistakes
- **Test Code:** [TC010_post_api_get_summary_with_no_recent_mistakes.py](./TC010_post_api_get_summary_with_no_recent_mistakes.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 43, in <module>
  File "<string>", line 39, in test_post_api_get_summary_no_recent_mistakes
AssertionError: Expected message '최근 틀린 문제가 없습니다. 더 많은 문제를 풀어보세요' not found in response

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b0af663a-9981-471d-836d-43ae7d40c15e/d6765912-63b4-42b3-ba36-ff15b214224c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **20.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---