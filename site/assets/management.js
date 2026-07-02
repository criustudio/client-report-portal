const loginPanel = document.querySelector("#admin-login-panel");
const adminPanel = document.querySelector("#admin-panel");
const loginForm = document.querySelector("#admin-login-form");
const loginFeedback = document.querySelector("#admin-login-feedback");
const logoutButton = document.querySelector("#admin-logout");
const clientSelect = document.querySelector("#admin-client-select");
const pinForm = document.querySelector("#pin-form");
const pinInput = document.querySelector("#admin-client-pin");
const pinFeedback = document.querySelector("#pin-feedback");
const uploadForm = document.querySelector("#upload-form");
const monthInput = document.querySelector("#report-month");
const titleInput = document.querySelector("#report-title");
const descriptionInput = document.querySelector("#report-description");
const filesInput = document.querySelector("#report-files");
const uploadFeedback = document.querySelector("#upload-feedback");
const historyList = document.querySelector("#admin-history-list");

let cachedClients = [];

function createAdminHistoryItem(month) {
  const wrapper = document.createElement("section");
  wrapper.className = "timeline-item is-open";

  const button = document.createElement("div");
  button.className = "timeline-button";

  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "timeline-title";
  title.textContent = month.title;

  const range = document.createElement("span");
  range.className = "timeline-range";
  range.textContent = month.rangeLabel;

  titleWrap.append(title, range);

  const indicator = document.createElement("span");
  indicator.className = "timeline-indicator";
  indicator.textContent = String(month.documents.length);

  button.append(titleWrap, indicator);

  const body = document.createElement("div");
  body.className = "timeline-body";
  body.style.display = "block";

  const list = document.createElement("div");
  list.className = "doc-list";

  month.documents.forEach((documentItem) => {
    const card = document.createElement("article");
    card.className = "doc-card";

    const copy = document.createElement("div");
    const itemTitle = document.createElement("h4");
    itemTitle.className = "doc-title";
    itemTitle.textContent = documentItem.title;

    const meta = document.createElement("p");
    meta.className = "doc-meta";
    meta.textContent = `${documentItem.displayType} · ${documentItem.description}`;

    copy.append(itemTitle, meta);

    const link = document.createElement("a");
    link.className = "doc-link";
    link.href = documentItem.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Abrir";

    card.append(copy, link);
    list.appendChild(card);
  });

  body.appendChild(list);
  wrapper.append(button, body);
  return wrapper;
}

function getSelectedClient() {
  return cachedClients.find((client) => client.id === clientSelect.value) ?? null;
}

function renderHistory() {
  const client = getSelectedClient();
  historyList.innerHTML = "";

  if (!client || !client.months.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Este cliente aun no tiene historial cargado.";
    historyList.appendChild(empty);
    return;
  }

  client.months.forEach((month) => {
    historyList.appendChild(createAdminHistoryItem(month));
  });
}

function renderClients() {
  clientSelect.innerHTML = "";
  cachedClients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.name;
    clientSelect.appendChild(option);
  });
  renderHistory();
}

async function loadAdminClients() {
  const response = await fetch("/api/admin/clients");
  if (!response.ok) {
    throw new Error("No autorizado");
  }
  const data = await response.json();
  cachedClients = data.clients;
  renderClients();
}

async function ensureSession() {
  const response = await fetch("/api/admin/session");
  if (!response.ok) {
    loginPanel.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    return;
  }

  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  await loadAdminClients();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginFeedback.textContent = "";

  const email = document.querySelector("#admin-email").value.trim();
  const password = document.querySelector("#admin-password").value;

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      loginFeedback.textContent = data.message || "No fue posible iniciar sesion.";
      return;
    }

    loginPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    await loadAdminClients();
  } catch (_error) {
    loginFeedback.textContent = "No fue posible conectar con el panel.";
  }
});

logoutButton.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  adminPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
});

clientSelect.addEventListener("change", () => {
  renderHistory();
});

pinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  pinFeedback.textContent = "";

  const client = getSelectedClient();
  if (!client) {
    pinFeedback.textContent = "Selecciona un cliente.";
    return;
  }

  try {
    const response = await fetch(`/api/admin/clients/${client.id}/pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin: pinInput.value.trim() }),
    });
    const data = await response.json();
    pinFeedback.textContent = data.message || "Clave actualizada.";
    if (response.ok) {
      pinInput.value = "";
      await loadAdminClients();
      clientSelect.value = client.id;
      renderHistory();
    }
  } catch (_error) {
    pinFeedback.textContent = "No fue posible guardar la clave.";
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  uploadFeedback.textContent = "";

  const client = getSelectedClient();
  if (!client) {
    uploadFeedback.textContent = "Selecciona un cliente.";
    return;
  }

  const formData = new FormData();
  formData.set("clientId", client.id);
  formData.set("month", monthInput.value);
  formData.set("title", titleInput.value.trim());
  formData.set("description", descriptionInput.value.trim());

  Array.from(filesInput.files).forEach((file) => {
    formData.append("documents", file);
  });

  try {
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    uploadFeedback.textContent = data.message || "Carga completada.";

    if (response.ok) {
      uploadForm.reset();
      await loadAdminClients();
      clientSelect.value = client.id;
      renderHistory();
    }
  } catch (_error) {
    uploadFeedback.textContent = "No fue posible subir los documentos.";
  }
});

ensureSession().catch(() => {
  loginPanel.classList.remove("hidden");
  adminPanel.classList.add("hidden");
});
