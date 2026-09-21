# [Architecture] AI TOEFL R/C 일타강사 앱

## 1. 개요
전체 시스템은 고성능 벡터 검색(RAG)과 실시간 스트리밍 답변을 지원하는 다중 계층 구조로 설계되었습니다.

## 2. 기술 스택
- **Frontend**: React Native (Expo)
- **Backend**: Node.js (Express)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI/LLM**: Gemini, Qwen, DeepSeek 등 다중 LLM 지원
- **Context**: NotebookLM (via MCP)

## 3. 핵심 아키텍처 흐름
1. **Request**: 사용자가 특정 주제의 'Bite' 문제 생성을 요청.
2. **Cache Hit (DB-First)**: 데이터베이스의 'MockTests' 테이블에서 동일 주제의 기성 문제를 최우선 조회. 존재 시 즉시 반환 (지연 시간 < 0.1초).
3. **Cache Miss (AI Generation)**: DB에 데이터가 없을 경우에만 LLM 호출 및 문제 생성. 생성된 문제는 차후 재사용을 위해 DB에 저장.
4. **Streaming Tutor**: 채팅 해설 요청 시 LLM의 토큰 생성 속도에 맞춰 실시간으로 클라이언트에 스트리밍(SSE) 전송.

## 4. 성능 최적화 전략
- **Topic Indexing**: 주제(Topic) 필드에 인덱스를 생성하여 검색 속도 극대화.
- **Background Pre-generation**: 사용 빈도가 높은 주제(예: Biology, Astronomy)는 백그라운드 워커를 통해 미리 문제를 생성하여 풀(Pool)을 확보.
- **Embedding Cache**: 중복된 검색어에 대한 임베딩 생성을 방지하기 위한 인메모리 캐시 도입.
