# [PRD] AI TOEFL R/C 일타강사 앱 (MVP)

## 1. Product Overview (제품 개요)
* **Target Audience:** 토플 Reading(R/C) 고득점을 목표로 하는 수험생.
* **Core Value:** 기존 기출문제를 외우는 것을 넘어, 일타강사의 출제 로직(NotebookLM)을 바탕으로 무한한 신규 변형 문제를 생성하고 1:1 심층 해설을 제공.
* **Business Model:** Pay-as-you-go (크레딧 충전형 종량제).
* **Platform:** Mobile App (React Native 또는 Flutter 추천) 및 Web Admin.

---

## 2. System Architecture (시스템 아키텍처)
이 앱은 4개의 주요 계층으로 동작합니다.

1. **Frontend (Client):** 사용자 UI/UX (크레딧 잔액 확인, 문제 풀이, 채팅 해설).
2. **Backend (Antigravity Orchestrator):** 비즈니스 로직 처리, 크레딧 차감, 프롬프트 체이닝, API 라우팅.
3. **Knowledge Base (NotebookLM via MCP):** '단일 진실 공급원(SSOT)'. 일타강사의 말투, 문제 출제 규칙, 오답 설계 로직, 기출 해설 데이터가 저장된 공간. MCP(Model Context Protocol)를 통해 백엔드에 Context 제공.
4. **LLM API (e.g., Gemini):** 백엔드의 명령과 NotebookLM의 Context를 조합하여 최종 텍스트(새로운 지문, 문제, 해설)를 생성.

---

## 3. Core Features & User Flow (핵심 기능 및 사용자 동선)

### Feature 1: 맞춤형 R/C 지문 및 문제 생성 (Generation)
* **Trigger:** 유저가 홈 화면에서 `[새로운 R/C 모의고사 생성]` 버튼 클릭. (주제 선택 가능: 생물, 역사 등)
* **Action:** 5 크레딧 차감.
* **Backend Logic:**
    1. Antigravity가 MCP를 통해 NotebookLM에서 `[토플_RC_출제규칙]` 및 `[오답_설계_로직]` 노트를 Fetch.
    2. LLM API에 프롬프트 전송: *"가져온 출제 규칙에 따라 [선택한 주제]의 700단어 지문 1개와 객관식 3문제(Fact, Inference, Vocab)를 JSON 형태로 생성하라."*
* **Output Format (JSON):**
    ```json
    {
      "passage": "지문 텍스트...",
      "questions": [
        {
          "type": "Inference",
          "question": "문제 텍스트...",
          "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
          "answer": "C",
          "distractor_logic": "B는 Word Salad, D는 Not Mentioned..."
        }
      ]
    }
    ```

### Feature 2: iBT 실전 풀이 모드 (Test UI)
* **UI Constraints:** 실제 토플 환경과 유사하게 좌측에 지문, 우측에 문제 고정. 우측 상단 타이머 작동.
* **Action:** 유저가 답안 제출 시 자동 채점.

### Feature 3: 일타강사 1:1 심층 해설 (Chat Q&A)
* **Trigger:** 채점 결과 화면에서 오답 문제 하단의 `[일타강사 해설 요청]` 버튼 클릭.
* **Action:** 1 크레딧 차감. 채팅창 Open.
* **Backend Logic:**
    1. MCP를 통해 NotebookLM에서 `[일타강사_페르소나]` 및 `[해당 문제의 distractor_logic]` Fetch.
    2. LLM API 호출: *"학생이 C번을 골라 틀렸다. 페르소나의 말투를 적용해 왜 C가 오답(함정)인지 해설해라."*
* **Output:** 유저 화면에 AI 강사의 채팅 메시지 스트리밍.

---

## 4. Credit System Policy (크레딧 정책)

| 사용자 액션 (User Action) | 크레딧 증감 | 설명 |
| :--- | :--- | :--- |
| **회원 가입 완료** | + 20 (Free) | 초기 온보딩 및 성능 체험용 |
| **새 R/C 세트 생성 (1지문 3문제)** | - 5 | 출제 LLM 비용 커버 |
| **문제 심층 해설 채팅 (1회 발화)** | - 1 | 해설 LLM 비용 커버 |
| **크레딧 인앱 결제 (예: $9.99)** | + 100 | Stripe/Apple 결제 연동 |

---

## 5. Database Schema (데이터베이스 스키마 초안)

* **`Users` Table:**
    * `id` (UUID), `email` (String), `credit_balance` (Int, default: 20), `created_at` (Timestamp).
* **`MockTests` Table:**
    * `id` (UUID), `user_id` (FK), `topic` (String), `content_json` (JSON - 지문 및 문제 데이터), `created_at` (Timestamp).
* **`TestResults` Table:**
    * `id` (UUID), `test_id` (FK), `user_id` (FK), `score` (Int), `user_answers_json` (JSON), `created_at` (Timestamp).
* **`ChatHistories` Table:**
    * `id` (UUID), `user_id` (FK), `question_id` (FK), `messages` (JSON - Array of roles/content), `created_at` (Timestamp).

---

## 6. Development Constraints (개발 제약사항)
* **UI/UX:** 토플 수험생의 피로도를 낮추기 위해 다크 모드(Dark Mode) 지원 필수. 지문 영역 스크롤 최적화.
* **Latency:** R/C 문제 세트 생성 시 LLM 대기 시간(보통 5~10초) 동안 유저 이탈을 막기 위해 퀄리티 높은 Lottie 애니메이션(예: "일타강사가 문제를 출제 중입니다...") 로딩 화면 구현.
* **Security:** 프론트엔드에서 LLM API나 NotebookLM으로 직접 호출 금지. 반드시 Antigravity 백엔드를 거쳐 통신.