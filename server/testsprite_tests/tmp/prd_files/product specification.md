# [Product Spec] AI 숏폼 토플 R/C 일타 앱: TOEFL Byte (MVP)

## 1. 제품 비전 및 목적
* **제품명:** 토플 바이트 (TOEFL Byte)
* **슬로건:** "출퇴근길 10분, 일타강사의 뇌를 이식하는 킬러 문항 훈련"
* **핵심 가치:** 700단어의 무거운 지문 대신, 고밀도 150단어 지문과 킬러 추론 문제를 통해 모바일 환경에 최적화된 고효율 토플 학습 경험 제공.

---

## 2. 핵심 기술 스택 (Tech Stack)
* **Frontend:** React Native (Expo), Zustand (상태 관리), Lucide React Native (아이콘).
* **Backend:** Node.js (Express), Prisma ORM, PostgreSQL (Database).
* **AI Engine:** Gemini API (Generation), NotebookLM (Knowledge Base via MCP).
* **Design:** Stitch MCP (Premium Dark Mode Design System).

---

## 3. 시스템 아키텍처 (Hybrid Architecture)
1.  **DB Caching Layer:** 유저가 주제 요청 시, PostgreSQL에서 기존 생성 문제를 검색하여 재사용 (`reused: true`). API 비용 절감 및 속도 최적화.
2.  **Knowledge Refinement:** 신규 생성 시 MCP를 통해 NotebookLM의 기출 패턴 및 일타강사 로직을 Fetch하여 LLM 프롬프트에 주입 (Prompt Chaining).
3.  **Memory Cache:** NotebookLM에서 가져온 출제 규칙 및 페르소나 데이터는 서버 메모리에 캐싱하여 실시간 응답성 확보.

---

## 4. 주요 기능 상세 (Core Features)

### ① 데일리 바이트 (문제 풀이)
* **지문 구성:** 150~200단어 내외의 초고밀도 학술 지문 (Biology, History 등 주제별).
* **문제 유형:** 고난도 추론(Inference) 위주, 매력적인 오답(Word Salad, Extreme 등) 설계 적용.
* **타이머 압박 모드:** 90초 카운트다운 제공. 10초 남을 시 Red Glow 애니메이션 및 시간 초과 시 자동 오답 처리.
* **사회적 증거:** 재사용 문항의 경우 "🔥 1,200명이 푼 검증된 문제" 배지 노출.

### ② 일타강사 AI 1:1 해설 (Bottom Sheet)
* **페르소나:** '츤데레 팩폭 일타강사' 또는 '친절한 과외쌤' 선택 가능.
* **해설 로직:** 오답 선택 시 "왜 낚였는지"에 대한 팩폭 진단 및 지문 내 정답 근거(Signal) 제시.
* **독해 속도 피드백:** 소요 시간(`timeSpent`)을 분석하여 "너무 느리다"는 등의 속도 기반 조언 포함.

### ③ AI 오답 노트 (Review Dashboard)
* **약점 분석:** 최근 틀린 문제 5개를 분석하여 유저의 고질적인 오답 패턴(예: 극단적 단어에 취약)을 요약.
* **취약 주제 TOP 3:** 주제별 정답률을 시각화하여 우선 학습 순위 제안.
* **복습 모드:** 틀린 문제는 크레딧 차감 없이 무제한 재풀이 가능.

### ④ 설정 및 크레딧 관리
* **비즈니스 모델:** 신규 생성/재사용 시 5 크레딧, 채팅 해설 시 1 크레딧 차감.
* **유저 커스텀:** 일타강사 페르소나 설정 및 타이머 모드 On/Off 스위치.

---

## 5. 데이터베이스 스키마 (Main Models)
* **User:** `id`, `email`, `credit_balance` (Initial: 50).
* **BiteQuestion:** `id`, `topic`, `content_json` (Passage, Question, Options, Answer, Logic), `reused_count`.
* **BiteResult:** `id`, `user_id`, `question_id`, `is_correct`, `time_spent`, `is_timeout`.

---

## 6. UX/UI 가이드라인 (Stitch MCP 기준)
* **Theme:** Deep Navy (#0F172A) 배경 기반 프리미엄 다크 모드.
* **Accent:** Vibrant Blue (#3B82F6) 및 시간 임박 시 Vibrant Red (#EF4444).
* **Effects:** Glassmorphism 효과를 적용한 카드 레이아웃 및 버튼 Glow 효과.
* **Typography:** Inter 폰트, 지문 가독성을 위한 Line Height 1.6 설정.

---

## 7. 향후 로드맵 (Post-MVP)
* **Phase 1:** 실제 결제 모듈(Stripe/Apple Pay) 연동.
* **Phase 2:** 음성 AI 도입으로 일타강사의 목소리로 해설 듣기 기능.
* **Phase 3:** 주제별 랭킹 시스템 및 학습 스트릭(Streak) 보상 강화.