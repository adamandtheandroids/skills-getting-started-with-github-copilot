from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities_contains_known_activity():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Known activity from seed data
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "teststudent@example.com"

    # Ensure email not already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")

    # Verify participant present
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert email in data[activity]["participants"]

    # Unregister (DELETE)
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert "Unregistered" in body.get("message", "")

    # Verify participant removed
    res = client.get("/activities")
    data = res.json()
    assert email not in data[activity]["participants"]


def test_unregister_nonexistent_returns_404():
    activity = "Chess Club"
    email = "nonexistent@example.com"

    # Ensure the email is not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404
