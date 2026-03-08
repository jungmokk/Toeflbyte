import requests

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_post_api_save_result_with_valid_data():
    # Step 1: Generate a bite to get a valid questionId to use for saving result.
    generate_bite_payload = {
        "topic": "Biology",
        "persona": "친절한 과외쌤"
    }
    question_id = None
    try:
        resp_gen = requests.post(
            f"{BASE_URL}/api/generate-bite",
            headers=HEADERS,
            json=generate_bite_payload,
            timeout=TIMEOUT
        )
        assert resp_gen.status_code == 200, f"Generate bite failed: {resp_gen.text}"
        data_gen = resp_gen.json()
        # Validate essential fields exist: questionId and userId (userId is given, questionId from API)
        # The schema implies questionId is included in the response.
        assert "questionId" in data_gen, "questionId missing in generate bite response"
        question_id = data_gen["questionId"]
        # Also ensure timer behavior and persona is correct but minimized here; focus on questionId availability

        # Step 2: Post valid save-result with the captured questionId
        save_result_payload = {
            "userId": HEADERS["x-user-id"],
            "questionId": question_id,
            "userAnswer": "A",
            "isCorrect": True,
            "timeSpent": 42.5  # Check that timeSpent is correctly accepted and saved
        }
        resp_save = requests.post(
            f"{BASE_URL}/api/save-result",
            headers=HEADERS,
            json=save_result_payload,
            timeout=TIMEOUT
        )
        assert resp_save.status_code == 200, f"Save result failed: {resp_save.text}"
        data_save = resp_save.json()
        # Validate response confirming saved result (assuming response includes saved data)
        # Since no explicit response schema given, verify success acknowledged.
        # If result echo or id is returned, check presence, otherwise at least check status_code.
        # We'll assert the response JSON includes at least a success indicator or stored timeSpent

        assert isinstance(data_save, dict), "Save result response is not a JSON object"
        # Check timeSpent in response if present for correctness
        if "timeSpent" in data_save:
            assert abs(float(data_save["timeSpent"]) - 42.5) < 0.01, "timeSpent not stored correctly"
    finally:
        # Cleanup is not specified as resource creation persisted here; no resource deletion needed.
        pass


test_post_api_save_result_with_valid_data()