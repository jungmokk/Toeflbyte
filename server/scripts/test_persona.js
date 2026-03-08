// Native fetch use
async function testPersona() {
  const url = 'http://localhost:5001/api/chat-tutor'; // Ensure this matches the route
  const body = {
    message: "선생님, 제가 Inference 문제를 자꾸 틀려요... 이번에도 본문에 없는 내용이라 지웠는데 정답이더라고요. 왜 틀렸는지 확인해주실 수 있나요?",
    question_context: {
      question: "What can be inferred about Photosynthesis?",
      passage: "Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities.",
      student_answer: "It occurs at night.",
      correct_answer: "It converts light energy into chemical energy.",
      isTimeout: false
    },
    persona: 'tsun'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'eeb9dcbc-b246-4a30-84bd-8cfd3cd44789'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log("=== 일타강사 응답 테스트 결과 ===");
    console.log(data);
  } catch (err) {
    console.error("Test Failed:", err.message);
  }
}

testPersona();
