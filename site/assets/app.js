const CLIENT_NAMES = [
  "Sr. Miyagi",
  "AGENCIA NOMADEA",
  "AMBAR PH",
  "ASTEMAR",
  "AUREA MAESTROS ANTIGUOS",
  "BIFFI",
  "BIO WATER GROUP",
  "CAFE Y LUPULO",
  "CAR WASH",
  "CARIBE EXPRESS",
  "CRIUDIGITAL",
  "DIVING & ADVENTURE",
  "EMELY - MARCA PERSONAL",
  "ENSALUD",
  "FORCE DEPORTES",
  "FOTOS ESTUDIO COLECCION VERSALLES 2022",
  "FRAVA",
  "FUN GAMES",
  "FUNDACION PRINCIPITO",
  "GRUPO GUIPALBAR SAS",
  "GRUPO QUIMAR 2025",
  "JUVE",
  "KBTSOL",
  "MARCAS MARKET",
  "MARADONA VIVE",
  "Margoth Reposteria",
  "MASCOVET",
  "PEPTIX",
  "PRAGAVET",
  "PROGAN CARIBBEAN",
  "PUERTO MOJARRA",
  "PULIDO",
  "SORALY ARTEAGA",
  "TENDENCIAS",
  "TIRI",
  "TOURISM WEB",
  "TRIPCARIBE",
];

function slugifyClientName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const REPORT_PORTAL_DATA = {
  clients: CLIENT_NAMES.map((name) => ({
    id: slugifyClientName(name),
    name,
  })),
  portalClients: {
    "sr-miyagi": {
      id: "sr-miyagi",
      name: "Sr. Miyagi",
      pin: "0102",
      months: [
        {
          id: "2026-06",
          title: "Junio 2026",
          rangeLabel: "Del 1 de junio al 30 de junio de 2026",
          documents: [
            {
              id: "general-html",
              title: "Informe de campanas",
              type: "HTML",
              description: "Google Ads, Meta Ads, TripAdvisor y resenas del mes.",
              href: "./reports/sr-miyagi/2026-06/informe-campanas.html",
            },
            {
              id: "social-html",
              title: "Informe de redes",
              type: "HTML",
              description: "Instagram y TikTok con interacciones y visibilidad.",
              href: "./reports/sr-miyagi/2026-06/informe-redes.html",
            },
            {
              id: "general-pdf",
              title: "Informe general",
              type: "PDF",
              description: "Version descargable para compartir o archivar.",
              href: "./reports/sr-miyagi/2026-06/informe-general.pdf",
            },
          ],
        },
      ],
    },
  },
};

const clientSelect = document.querySelector("#client-select");
const pinInput = document.querySelector("#client-pin");
const accessForm = document.querySelector("#access-form");
const accessFeedback = document.querySelector("#access-feedback");
const clientPanel = document.querySelector("#client-panel");
const clientName = document.querySelector("#client-name");
const timeline = document.querySelector("#timeline");
const signOutButton = document.querySelector("#sign-out");
const heroClientCount = document.querySelector("#hero-client-count");

const sessionKey = "report-portal-active-client";

function getClientById(clientId) {
  return REPORT_PORTAL_DATA.clients.find((client) => client.id === clientId);
}

function getPortalClientById(clientId) {
  return REPORT_PORTAL_DATA.portalClients[clientId] ?? null;
}

function buildOption(client) {
  const option = document.createElement("option");
  option.value = client.id;
  option.textContent = client.name;
  return option;
}

function renderStats() {
  heroClientCount.textContent = String(REPORT_PORTAL_DATA.clients.length);
}

function renderClientSelector() {
  clientSelect.innerHTML = '<option value="">Selecciona un cliente</option>';
  REPORT_PORTAL_DATA.clients.forEach((client) => {
    clientSelect.appendChild(buildOption(client));
  });
}

function createDocCard(documentItem) {
  const card = document.createElement("article");
  card.className = "doc-card";

  const copy = document.createElement("div");
  const title = document.createElement("h4");
  title.className = "doc-title";
  title.textContent = documentItem.title;

  const meta = document.createElement("p");
  meta.className = "doc-meta";
  meta.textContent = `${documentItem.type} · ${documentItem.description}`;

  copy.append(title, meta);

  const link = document.createElement("a");
  link.className = "doc-link";
  link.href = documentItem.href;
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

  if (month.documents.length === 0) {
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

function unlockClient(clientId) {
  const portalClient = getPortalClientById(clientId);
  if (!portalClient) {
    accessFeedback.textContent =
      "Este cliente activo aun no tiene acceso individual publicado.";
    clientPanel.classList.add("hidden");
    sessionStorage.removeItem(sessionKey);
    return;
  }

  sessionStorage.setItem(sessionKey, portalClient.id);
  renderClientPanel(portalClient);
  accessFeedback.textContent = `Acceso correcto para ${portalClient.name}.`;
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const clientId = clientSelect.value;
  const selectedClient = getClientById(clientId);
  const portalClient = getPortalClientById(clientId);
  const pin = pinInput.value.trim();

  if (!selectedClient) {
    accessFeedback.textContent = "Selecciona un cliente.";
    clientPanel.classList.add("hidden");
    return;
  }

  if (!portalClient) {
    accessFeedback.textContent =
      "Este cliente activo aun no tiene acceso individual publicado.";
    clientPanel.classList.add("hidden");
    return;
  }

  if (!/^[0-9]{4}$/.test(pin)) {
    accessFeedback.textContent = "Ingresa un codigo de seguridad de 4 digitos.";
    clientPanel.classList.add("hidden");
    return;
  }

  if (pin !== portalClient.pin) {
    accessFeedback.textContent = "Codigo de seguridad incorrecto.";
    clientPanel.classList.add("hidden");
    return;
  }

  unlockClient(portalClient.id);
  pinInput.value = "";
});

signOutButton.addEventListener("click", () => {
  sessionStorage.removeItem(sessionKey);
  clientPanel.classList.add("hidden");
  accessFeedback.textContent = "Sesion cerrada.";
});

function restoreSession() {
  const activeClientId = sessionStorage.getItem(sessionKey);
  if (!activeClientId) {
    return;
  }

  const portalClient = getPortalClientById(activeClientId);
  if (!portalClient) {
    sessionStorage.removeItem(sessionKey);
    return;
  }

  clientSelect.value = portalClient.id;
  renderClientPanel(portalClient);
  accessFeedback.textContent = `Sesion restaurada para ${portalClient.name}.`;
}

renderStats();
renderClientSelector();
restoreSession();
