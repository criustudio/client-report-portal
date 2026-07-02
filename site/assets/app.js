const clientSelect = document.querySelector("#client-select");
const pinInput = document.querySelector("#client-pin");
const accessForm = document.querySelector("#access-form");
const accessFeedback = document.querySelector("#access-feedback");
const clientPanel = document.querySelector("#client-panel");
const clientName = document.querySelector("#client-name");
const timeline = document.querySelector("#timeline");
const signOutButton = document.querySelector("#sign-out");
const heroClientCount = document.querySelector("#hero-client-count");

function createDocCard(documentItem) {
  const card = document.createElement("article");
  card.className = "doc-card";

  const copy = document.createElement("div");
  const title = document.createElement("h4");
  title.className = "doc-title";
  title.textContent = documentItem.title;

  const meta = document.createElement("p");
  meta.className = "doc-meta";
  meta.textContent = `${documentItem.displayType} · ${documentItem.description}`;

  copy.append(title, meta);

  const link = document.createElement("a");
  link.className = "doc-link";
  link.href = documentItem.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Abrir";

  card.append(copy, link);
  return card;
}

function createTimelineItem(month, openByDefault = false) {
  const wrapper = document.createElement("section");
  wrapper.className = `timeline-item${openByDefault ? " is-open" : ""}`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "timeline-button";
  button.setAttribute("aria-expanded", openByDefault ? "true" : "false");

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
  indicator.textContent = openByDefault ? "−" : "+";

  button.append(titleWrap, indicator);

  const body = document.createElement("div");
  body.className = "timeline-body";

  if (!month.documents.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Aun no hay documentos cargados para este periodo.";
    body.appendChild(empty);
  } else {
    const list = document.createElement("div");
    list.className = "doc-list";
    month.documents.forEach((documentItem) => {
      list.appendChild(createDocCard(documentItem));
    });
    body.appendChild(list);
  }

  button.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("is-open");
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    indicator.textContent = isOpen ? "−" : "+";
  });

  wrapper.append(button, body);
  return wrapper;
}

function renderClientPanel(client) {
  clientName.textContent = client.name;
  timeline.innerHTML = "";
  client.months.forEach((month, index) => {
    timeline.appendChild(createTimelineItem(month, index === 0));
  });
  clientPanel.classList.remove("hidden");
}

async function loadClients() {
  const response = await fetch("/api/public/clients");
  const data = await response.json();

  clientSelect.innerHTML = '<option value="">Selecciona un cliente</option>';
  data.clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.name;
    clientSelect.appendChild(option);
  });

  heroClientCount.textContent = String(data.clients.length);
}

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  accessFeedback.textContent = "";
  clientPanel.classList.add("hidden");

  const clientId = clientSelect.value;
  const pin = pinInput.value.trim();

  if (!clientId) {
    accessFeedback.textContent = "Selecciona un cliente.";
    return;
  }

  try {
    const response = await fetch("/api/public/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId, pin }),
    });

    const data = await response.json();
    if (!response.ok) {
      accessFeedback.textContent = data.message || "No fue posible abrir el historial.";
      return;
    }

    renderClientPanel(data.client);
    accessFeedback.textContent = `Acceso correcto para ${data.client.name}.`;
    pinInput.value = "";
  } catch (_error) {
    accessFeedback.textContent = "No fue posible conectar con el portal.";
  }
});

signOutButton.addEventListener("click", () => {
  clientPanel.classList.add("hidden");
  accessFeedback.textContent = "Sesion cerrada.";
});

loadClients().catch(() => {
  accessFeedback.textContent = "No fue posible cargar el listado de clientes.";
});
