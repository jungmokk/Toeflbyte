import requests

BASE_URL = "http://127.0.0.1:5001"
HEADERS = {
    "x-user-id": "ecfa9793-3dcd-4dbb-b666-49acfa7d7ec9",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_post_api_chat_tutor_with_insufficient_credits():
    bite_payload = {"topic": "Biology"}
    question_context = None

    try:
        resp_bite = requests.post(
            f"{BASE_URL}/api/generate-bite",
            json=bite_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        resp_bite.raise_for_status()
        bite_data = resp_bite.json()
        if "question" in bite_data:
            question_context = bite_data["question"]
        elif "questionId" in bite_data:
            question_context = {"questionId": bite_data["questionId"]}
        else:
            question_context = bite_data
    except Exception:
        question_context = {"dummy": True}

    chat_payload = {
        "message": "문의가 있습니다.",
        "question_context": question_context,
        "persona": "친절한 과외쌤"
    }

    resp_chat = None
    try:
        resp_chat = requests.post(
            f"{BASE_URL}/api/chat-tutor",
            json=chat_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        err_str = str(e).lower()
        assert ("credit" in err_str or "403" in err_str or "400" in err_str), "Expected credit related error or client error status"
        assert False, f"RequestException occurred: {e}"

    assert resp_chat is not None, "No response received from /api/chat-tutor"

    if resp_chat.status_code == 200:
        try:
            json_resp = resp_chat.json()
        except ValueError:
            assert False, "Response is not valid JSON"

        msg = json_resp.get("message", "") or json_resp.get("error", "")
        assert ("충전 필요" in msg or "charge" in msg.lower() or "insufficient" in msg.lower()), f"Expected insufficent credit message, got: {msg}"
    else:
        assert resp_chat.status_code in (400, 402, 403), f"Expected 4xx error due to insufficient credits, got: {resp_chat.status_code}"

test_post_api_chat_tutor_with_insufficient_credits()
