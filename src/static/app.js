document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch activities, render activity cards (with participants), populate select, handle signups.
  async function fetchActivities() {
    const res = await fetch("/activities");
    if (!res.ok) throw new Error("Failed to load activities");
    return await res.json();
  }

  function createActivityCard(name, data) {
    const card = document.createElement("div");
    card.className = "activity-card";

    const title = document.createElement("h4");
    title.textContent = name;
    card.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = data.description;
    card.appendChild(desc);

    const sched = document.createElement("p");
    sched.innerHTML = `<strong>Schedule:</strong> ${data.schedule}`;
    card.appendChild(sched);

    // Participants header with count badge
    const partHeader = document.createElement("div");
    partHeader.className = "participants-title";
    const headerText = document.createElement("span");
    headerText.textContent = "Participants";
    const countBadge = document.createElement("span");
    countBadge.className = "participants-count";
    countBadge.textContent = `${data.participants.length}`;
    partHeader.appendChild(headerText);
    partHeader.appendChild(countBadge);
    card.appendChild(partHeader);

    // Participants list (no bullets) with a remove icon for each participant
    if (data.participants.length > 0) {
      const ul = document.createElement("ul");
      ul.className = "participants-list";
      for (const p of data.participants) {
        const li = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.className = "participant-email";
        nameSpan.textContent = p;

        const removeBtn = document.createElement("button");
        removeBtn.className = "participant-remove";
        removeBtn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
        removeBtn.innerHTML = "✖";

        // When clicked, call backend to unregister and re-render
        removeBtn.addEventListener("click", async () => {
          try {
            const encodedActivity = encodeURIComponent(name);
            const res = await fetch(
              `/activities/${encodedActivity}/participants?email=${encodeURIComponent(p)}`,
              { method: "DELETE" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || "Failed to unregister");
            showMessage("success", data.message || "Unregistered successfully");
            await render();
          } catch (err) {
            showMessage("error", err.message || err);
          }
        });

        li.appendChild(nameSpan);
        li.appendChild(removeBtn);
        ul.appendChild(li);
      }
      card.appendChild(ul);
    } else {
      const empty = document.createElement("div");
      empty.className = "participants-empty";
      empty.textContent = "No participants yet. Be the first to sign up!";
      card.appendChild(empty);
    }

    return card;
  }

  function showMessage(type, text) {
    const msg = document.getElementById("message");
    msg.className = `message ${type}`;
    msg.textContent = text;
    msg.classList.remove("hidden");
    setTimeout(() => msg.classList.add("hidden"), 5000);
  }

  async function render() {
    activitiesList.innerHTML = "<p>Loading activities...</p>";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    try {
      const activities = await fetchActivities();
      activitiesList.innerHTML = "";

      // Sort activity names for stable order
      const names = Object.keys(activities).sort();
      for (const name of names) {
        const card = createActivityCard(name, activities[name]);
        activitiesList.appendChild(card);

        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        activitySelect.appendChild(opt);
      }
    } catch (err) {
      activitiesList.innerHTML = `<p class="error">Unable to load activities.</p>`;
      console.error(err);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    const emailEl = document.getElementById("email");
    const activityEl = document.getElementById("activity");
    const email = emailEl.value.trim();
    const activity = activityEl.value;

    if (!email || !activity) {
      showMessage("error", "Please provide an email and select an activity.");
      return;
    }

    try {
      const encodedActivity = encodeURIComponent(activity);
      const res = await fetch(
        `/activities/${encodedActivity}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || "Signup failed");

      showMessage("success", data.message || "Signed up successfully");

      // Re-render to update participants list and count
      await render();

      // Clear email field
      emailEl.value = "";
    } catch (err) {
      showMessage("error", err.message);
    }
  }

  render();
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", handleSignup);
});
