/**
 * Server Keep-Alive Ping Script
 * 
 * 기능:
 * 1. Render 백엔드 서버(https://toeflbyte.onrender.com/health)를 10분마다 호출하여 Sleep 방지
 * 2. Supabase(https://fpvtolzqnmbckfjvsnsy.supabase.co) 상태 점검 및 휴면 방지
 * 
 * 사용법:
 * node scripts/keep-alive.js
 * 또는 일회성 체크:
 * node scripts/keep-alive.js --once
 */

const RENDER_URL = 'https://toeflbyte.onrender.com/health';
const SUPABASE_URL = 'https://fpvtolzqnmbckfjvsnsy.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdnRvbHpxbm1iY2tmanZzbnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjY5MDYsImV4cCI6MjA4ODQ0MjkwNn0.AIvrrz04skBmO8hVUf2cnDOIZNLYOgpReSTuWrK5hfw';
const INTERVAL_MS = 10 * 60 * 1000; // 10분

async function pingUrl(name, url, headers = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ToeflByte-KeepAlive/1.0',
        ...headers,
      },
    });
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ✅ ${name} 응답 완료 (${res.status}) - ${duration}ms`);
    return { ok: true, status: res.status, duration };
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    console.error(`[${new Date().toLocaleTimeString()}] ❌ ${name} 호출 실패 (${err.name === 'AbortError' ? '타임아웃' : err.message}) - ${duration}ms`);
    return { ok: false, error: err.message, duration };
  }
}

async function runPingCycle() {
  console.log(`\n========================================`);
  console.log(`[${new Date().toLocaleString()}] 🚀 서버 킵얼라이브(Keep-Alive) 점검 시작`);
  console.log(`========================================`);

  await pingUrl('Render 백엔드 서버', RENDER_URL);
  await pingUrl('Supabase 서버', SUPABASE_URL, {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  });
}

const isOnce = process.argv.includes('--once');

if (isOnce) {
  runPingCycle().then(() => {
    console.log('\n단일 점검 완료.');
    process.exit(0);
  });
} else {
  console.log('📡 서버 킵얼라이브 데몬이 시작되었습니다.');
  console.log(`⏱️  주기: ${INTERVAL_MS / 60000}분마다 자동 핑 전송 (종료하려면 Ctrl+C)`);
  
  // 첫 실행 즉시 수행
  runPingCycle();

  // 주기적 실행
  setInterval(runPingCycle, INTERVAL_MS);
}
