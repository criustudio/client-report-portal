const REPORT_PORTAL_DATA = {
  clients: [
    {
      id: "sr-miyagi",
      name: "Sr. Miyagi",
      pin: "01-02",
      note: "Acceso activo para este cliente",
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
  ],
  portfolioSections: [
    {
      id: "live",
      title: "Disponible ahora",
      caption: "Acceso activo en este momento para mostrar el historial al cliente.",
      badgeClass: "portfolio-badge--live",
      badgeLabel: "Disponible",
      items: [
        {
          name: "Sr. Miyagi",
          meta: "Historial de junio 2026 con reportes HTML y PDF.",
        },
      ],
    },
    {
      id: "listed",
      title: "Cuentas de clientes",
      caption: "Clientes visibles dentro del portal para ampliar la cartera mostrada.",
      badgeClass: "portfolio-badge--listed",
      badgeLabel: "Listado",
      items: [
        { name: "AGENCIA NOMADEA", meta: "Cuenta listada" },
        { name: "AMBAR PH", meta: "Cuenta listada" },
        { name: "ASTEMAR", meta: "Cuenta listada" },
        { name: "BIFFI", meta: "Cuenta listada" },
        { name: "BIO WATER GROUP", meta: "Cuenta listada" },
        { name: "CAFE Y LUPULO", meta: "Cuenta listada" },
        { name: "CRIUDIGITAL", meta: "Cuenta listada" },
        { name: "DIVING & ADVENTURE", meta: "Cuenta listada" },
        { name: "EMELY - MARCA PERSONAL", meta: "Cuenta listada" },
        { name: "FORCE DEPORTES", meta: "Cuenta listada" },
        { name: "GRUPO GUIPALBAR SAS", meta: "Cuenta listada" },
        { name: "GRUPO QUIMAR 2025", meta: "Cuenta listada" },
        { name: "LA COMPAÑIA", meta: "Cuenta listada" },
        { name: "MARCAS MARKET", meta: "Cuenta listada" },
        { name: "Margoth Reposteria", meta: "Cuenta listada" },
        { name: "MASCOVET", meta: "Cuenta listada" },
        { name: "PEPTIX", meta: "Cuenta listada" },
        { name: "PROGAN CARIBBEAN", meta: "Cuenta listada" },
        { name: "PULIDO", meta: "Cuenta listada" },
        { name: "SORALY ARTEAGA", meta: "Cuenta listada" },
        { name: "TRIPCARIBE", meta: "Cuenta listada" },
      ],
    },
    {
      id: "archive",
      title: "Archivo / finalizados",
      caption: "Referencias adicionales tomadas del archivo de proyectos para dar contexto de volumen.",
      badgeClass: "portfolio-badge--archive",
      badgeLabel: "Archivo",
      items: [
        { name: "AUREA MAESTROS ANTIGUOS", meta: "Proyecto finalizado" },
        { name: "CAR WASH", meta: "Proyecto finalizado" },
        { name: "CARIBE EXPRESS", meta: "Proyecto finalizado" },
        { name: "ENSALUD", meta: "Proyecto finalizado" },
        { name: "FRAVA", meta: "Proyecto finalizado" },
        { name: "FUN GAMES", meta: "Proyecto finalizado" },
        { name: "FUNDACION PRINCIPITO", meta: "Proyecto finalizado" },
        { name: "JUVE", meta: "Proyecto finalizado" },
        { name: "KBTSOL", meta: "Proyecto finalizado" },
        { name: "MARADONA VIVE", meta: "Proyecto finalizado" },
        { name: "PRAGAVET", meta: "Proyecto finalizado" },
        { name: "PUERTO MOJARRA", meta: "Proyecto finalizado" },
        { name: "TENDENCIAS", meta: "Proyecto finalizado" },
        { name: "TIRI", meta: "Proyecto finalizado" },
        { name: "TOURISM WEB", meta: "Proyecto finalizado" },
        { name: "TRIP CARIBE", meta: "Proyecto finalizado" },
      ],
    },
  ],
};

const clientSelect = document.querySelector("#client-select");
const pinInput = document.querySelector("#client-pin");
const accessForm = document.querySelector("#access-form");
const accessFeedback = document.querySelector("#access-feedback");
const clientPanel = document.querySelector("#client-panel");
const clientName = document.querySelector("#client-name");
const clientSummary = document.querySelector("#client-summary");
const timeline = document.querySelector("#timeline");
const signOutButton = document.querySelector("#sign-out");
const heroClientCount = document.querySelector("#hero-client-count");
const heroReportCount = document.querySelector("#hero-report-count");
const portfolioSections = document.querySelector("#portfolio-sections");

const sessionKey = "report-portal-active-client";

function getClientById(clientId) {
  return REPORT_PORTAL_DATA.clients.find((client) => client.id === clientId);
}

function buildOption(client) {
  const option = document.createElement("option");
  option.value = client.id;
  option.textContent = client.name;
  return option;
}

function renderStats() {
  const clientCount = REPORT_PORTAL_DATA.clients.length;
  const reportCount = REPORT_PORTAL_DATA.clients.reduce((total, client) => {
    return (
      total +
      client.months.reduce((monthTotal, month) => monthTotal + month.documents.length, 0)
    );
  }, 0);

  heroClientCount.textContent = String(clientCount);
  heroReportCount.textContent = String(reportCount);
}

function renderClientSelector() {
  clientSelect.innerHTML = "";
  REPORT_PORTAL_DATA.clients.forEach((client) => {
    clientSelect.appendChild(buildOption(client));
  });
}

function createPortfolioItem(item, badgeClass, badgeLabel) {
  const article = document.createElement("article");
  article.className = "portfolio-item";

  const top = document.createElement("div");
  top.className = "portfolio-item-top";

  const name = document.createElement("div");
  name.className = "portfolio-name";
  name.textContent = item.name;

  const badge = document.createElement("span");
  badge.className = `portfolio-badge ${badgeClass}`;
  badge.textContent = badgeLabel;

  top.append(name, badge);

  const meta = document.createElement("p");
  meta.className = "portfolio-meta";
  meta.textContent = item.meta;

  article.append(top, meta);
  return article;
}

function renderPortfolioSections() {
  portfolioSections.innerHTML = "";

  REPORT_PORTAL_DATA.portfolioSections.forEach((section) => {
    const wrapper = document.createElement("section");
    wrapper.className = "portfolio-group";

    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "portfolio-heading";
    title.textContent = section.title;

    const caption = document.createElement("p");
    caption.className = "portfolio-caption";
    caption.textContent = section.caption;

    heading.append(title, caption);

    const list = document.createElement("div");
    list.className = "portfolio-list";

    section.items.forEach((item) => {
      list.appendChild(createPortfolioItem(item, section.badgeClass, section.badgeLabel));
    });

    wrapper.append(heading, list);
    portfolioSections.appendChild(wrapper);
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
  clientSummary.innerHTML = "";
  timeline.innerHTML = "";

  const chipMonths = document.createElement("span");
  chipMonths.className = "summary-chip";
  chipMonths.textContent = `${client.months.length} periodo${client.months.length === 1 ? "" : "s"}`;

  const totalDocs = client.months.reduce((total, month) => total + month.documents.length, 0);
  const chipDocs = document.createElement("span");
  chipDocs.className = "summary-chip";
  chipDocs.textContent = `${totalDocs} documento${totalDocs === 1 ? "" : "s"}`;

  const chipNote = document.createElement("span");
  chipNote.className = "summary-chip";
  chipNote.textContent = client.note;

  clientSummary.append(chipMonths, chipDocs, chipNote);

  client.months.forEach((month, index) => {
    timeline.appendChild(createTimelineItem(month, index === 0));
  });

  clientPanel.classList.remove("hidden");
}

function unlockClient(clientId) {
  const client = getClientById(clientId);
  if (!client) {
    accessFeedback.textContent = "No pudimos encontrar ese cliente.";
    return;
  }

  sessionStorage.setItem(sessionKey, client.id);
  renderClientPanel(client);
  accessFeedback.textContent = `Acceso correcto para ${client.name}.`;
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const client = getClientById(clientSelect.value);
  const pin = pinInput.value.trim();

  if (!client) {
    accessFeedback.textContent = "Selecciona un cliente valido.";
    return;
  }

  if (!pin) {
    accessFeedback.textContent = "Ingresa la clave del cliente.";
    return;
  }

  if (pin !== client.pin) {
    accessFeedback.textContent = "PIN incorrecto.";
    return;
  }

  unlockClient(client.id);
  pinInput.value = "";
}
);

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

  const client = getClientById(activeClientId);
  if (!client) {
    sessionStorage.removeItem(sessionKey);
    return;
  }

  clientSelect.value = client.id;
  renderClientPanel(client);
  accessFeedback.textContent = `Sesion restaurada para ${client.name}.`;
}

renderStats();
renderClientSelector();
renderPortfolioSections();
restoreSession();
