# [PRD] AI 숏폼 토플 R/C 일타 앱 (가칭: 토플 바이트)

## 1. Product Overview (제품 개요)
* **Target Audience:** 바쁜 일정 속에서 출퇴근/등하굣길 자투리 시간(10분)을 활용해 토플 R/C 감각을 유지하려는 수험생.
* **Core Value:** 700단어의 무거운 지문 대신, 150~200단어의 고밀도 핵심 문단 1개와 킬러 문제 1개를 '숏폼'처럼 제공하여 모바일 피로도를 최소화. 일타강사의 즉각적인 채팅 해설 결합.
* **Business Model:** Pay-as-you-go (크레딧 충전형 종량제, 박리다매 구조).
* **Platform:** Mobile App (React Native 또는 Flutter 추천) 및 Web Admin.

---

## 2. System Architecture (시스템 아키텍처)
기본 4계층 구조를 유지하되, 모바일 환경의 빠른 응답성(Low Latency)에 최적화합니다.

1. **Frontend (Client):** 모바일 최적화 '원 스크린(One-Screen)' UI/UX. 스와이프 제스처 적극 활용.
2. **Backend (Antigravity Orchestrator):** 비즈니스 로직, 크레딧 차감, 프롬프트 체이닝, API 라우팅 처리.
3. **Knowledge Base (NotebookLM via MCP):** '단일 진실 공급원(SSOT)'. 단락 단위의 논리 전개 규칙, 킬러 문항 출제 공식, 일타강사 페르소나가 저장된 공간.
4. **LLM API (e.g., Gemini):** 백엔드의 명령과 NotebookLM의 Context를 조합하여 150단어 지문 및 문제 생성.

---

## 3. Core Features & UX Flow (핵심 기능 및 사용자 동선)



### Feature 1: 데일리 바이트 (Daily Bite) 문제 풀이
* **UI Constraint:** 인스타그램 릴스처럼 위아래 스와이프(또는 '다음' 버튼)로 다음 문제로 빠르게 전환. 상단엔 지문(150단어), 하단엔 4지선다 1문제 배치.
* **Action:** 문제 1개 생성 및 풀이 진입 시 1 크레딧 차감.
* **Backend Logic:**
    1. Antigravity가 MCP를 통해 NotebookLM에서 `[단일_문단_출제규칙]` Fetch.
    2. LLM 호출: *"생물학 주제로 150단어 분량의 논리적 밀도가 높은 단락 1개와, 이 단락에서만 단서를 찾을 수 있는 Inference 문제 1개를 JSON으로 생성하라."*

### Feature 2: 1타 강사의 '팩폭' 채팅 해설
* **Trigger:** 문제를 틀리거나 해설을 원할 때 하단 `[일타강사 해설 듣기]` 버튼 클릭.
* **UI Constraint:** 바텀 시트(Bottom Sheet) 형태로 채팅창이 올라옴.
* **Action:** 해설 요청 시 1 크레딧 차감.
* **Backend Logic:** NotebookLM의 페르소나를 반영하여 "이거 B번 왜 골랐어? 지문 2번째 줄 'However' 뒤를 다시 봐!" 형태의 짧고 직관적인 대화형 텍스트 스트리밍.

### Feature 3: 틴더(Tinder) 스타일 스와이프 단어장
* **Trigger:** 문제 풀이 세션 종료 후 복습 화면 진입.
* **UI Constraint:** 방금 읽은 지문에서 추출된 고급 어휘가 플래시카드로 등장. 오른쪽 스와이프(아는 단어, Pass), 왼쪽 스와이프(모르는 단어, Save).
* **Action:** Save된 단어는 유저의 '오답 단어장' DB에 저장.

---

## 4. NotebookLM DB 구축 전략 (마이크로 버전)

* **Note 1: [단일 문단 논리 압축 규칙]** 기출문제의 정답 근거가 되는 핵심 단락(150단어 내외)의 논리 전개 패턴(원인/결과, 비교/대조 등) 정의.
* **Note 2: [유형별 킬러 문항 출제 공식]** 숏폼에 적합한 Vocabulary, Sentence Insertion, Inference 등 3가지 문제 유형의 정답 및 매력적인 오답(Distractor) 설계 공식.
* **Note 3: [숏폼 최적화 페르소나]** 모바일 채팅창에 맞게 길고 장황한 설명보다는 핵심만 짚어주는 짧고 강렬한 일타강사 화법.

---

## 5. Credit System Policy (크레딧 정책)

| 사용자 액션 (User Action) | 크레딧 증감 | 설명 |
| :--- | :--- | :--- |
| **회원 가입 완료** | + 50 (Free) | 초기 온보딩 및 습관 형성 유도 |
| **숏폼 문제 1개 생성** | - 1 | 단일 문단 생성 비용 커버 (박리다매) |
| **문제 심층 해설 채팅 (1회 발화)** | - 1 | 해설 LLM 비용 커버 |
| **크레딧 인앱 결제 (예: $4.99)** | + 100 | 소액 결제 위주의 상품 구성 |

---

## 6. Database Schema (데이터베이스 스키마 초안)

* **`Users` Table:** `id` (UUID), `email`, `credit_balance` (Int, default: 50).
* **`BiteQuestions` Table:** `id` (UUID), `user_id` (FK), `topic`, `content_json` (지문 1개 + 문제 1개), `created_at`.
* **`BiteResults` Table:** `id` (UUID), `question_id` (FK), `user_id` (FK), `is_correct` (Boolean), `user_answer`, `created_at`.
* **`Flashcards` Table:** `id` (UUID), `user_id` (FK), `word`, `definition`, `context_sentence`, `is_memorized` (Boolean).

---

## 7. Development Constraints (개발 제약사항)
* **LLM Latency 최적화:** 짧은 지문이므로 생성 속도를 최대한 끌어올려야 함 (목표 2~3초 이내). 로딩 중 스켈레톤 UI(Skeleton UI) 필수.
* **UI/UX:** 스크롤을 최소화하고 화면 전환(스와이프) 위주로 구성. 다크 모드 지원.