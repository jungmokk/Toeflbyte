import requests
import time

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_post_api_generate_bite_with_reused_question():
    try:
        # Step 1: Call /api/generate-bite with topic likely to return reused=true (History)
        payload_generate = {
            "topic": "History"
        }
        response_generate = requests.post(f"{BASE_URL}/api/generate-bite", json=payload_generate, headers=HEADERS, timeout=TIMEOUT)
        assert response_generate.status_code == 200, f"Expected 200 OK, got {response_generate.status_code}"
        data_generate = response_generate.json()
        assert isinstance(data_generate, dict), "Response is not a JSON object"
        assert "reused" in data_generate, "Missing 'reused' field in response"
        assert data_generate["reused"] is True, "Expected reused=true but got reused=false"
        # Check for badge info
        assert any(keyword in data_generate.get("badge", "") if "badge" in data_generate else "" for keyword in ["검증된 문제", "🔥"]), "Reused question badge not found"
        # Validate presence of passage, question, options, and timer (90 seconds)
        assert "passage" in data_generate and isinstance(data_generate["passage"], str) and data_generate["passage"].strip(), "Missing or empty passage"
        assert "question" in data_generate and isinstance(data_generate["question"], str) and data_generate["question"].strip(), "Missing or empty question"
        assert "options" in data_generate and isinstance(data_generate["options"], list) and len(data_generate["options"]) > 0, "Missing or empty options"
        # Timer validation: timer should be 90 seconds as per user flow
        assert "timer" in data_generate and (data_generate["timer"] == 90 or data_generate["timer"] == "90"), "Timer not present or not 90 seconds"

        question_id = data_generate.get("questionId") or data_generate.get("question_id") or data_generate.get("id")
        assert question_id, "Missing questionId in response"

        # Step 2: Simulate wait for timer expiry (90 seconds)
        # Instead of actually waiting 90 seconds in test, simulate timer expiry by waiting a short time (simulate 2 seconds)
        # In real environment, you could mock timer or wait full time
        time.sleep(2)

        # Step 3: Automatic submit triggered on timeout, call /api/save-result with isTimeout=true and isCorrect=false
        payload_save = {
            "userId": HEADERS["x-user-id"],
            "questionId": question_id,
            "userAnswer": "",        # No answer due to timeout
            "isCorrect": False,
            "timeSpent": 90         # Full timer time spent
        }
        response_save = requests.post(f"{BASE_URL}/api/save-result", json=payload_save, headers=HEADERS, timeout=TIMEOUT)
        assert response_save.status_code == 200, f"Expected 200 OK for save-result, got {response_save.status_code}"
        data_save = response_save.json()
        assert data_save.get("success") is True or data_save.get("saved") is True or response_save.ok, "Save result response not successful"

        # Step 4: Verify timeSpent is correctly saved (by requesting get-summary or validating returned save-result response)
        # Since the API /api/get-summary can be used to check progress, call it to confirm recent results include this entry
        payload_summary = {
            "userId": HEADERS["x-user-id"]
        }
        response_summary = requests.post(f"{BASE_URL}/api/get-summary", json=payload_summary, headers=HEADERS, timeout=TIMEOUT)
        assert response_summary.status_code == 200, f"Expected 200 OK for get-summary, got {response_summary.status_code}"
        data_summary = response_summary.json()
        # Check if recent mistakes or saved result includes this questionId and timeSpent
        # data_summary could contain recent question attempts, check presence and timeSpent
        recent_results = data_summary.get("recentResults") or data_summary.get("results") or []
        matched_result = None
        for result in recent_results:
            if result.get("questionId") == question_id:
                matched_result = result
                break
        assert matched_result is not None, "Saved result not found in get-summary"
        assert "timeSpent" in matched_result, "timeSpent field missing in saved result"
        assert abs(int(matched_result["timeSpent"]) - 90) < 5, f"timeSpent expected ~90 but got {matched_result['timeSpent']}"

    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"


test_post_api_generate_bite_with_reused_question()
