import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 80);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "portal-data.json");
const SEED_FILE = path.join(__dirname, "seed-data.json");
const SITE_DIR = path.join(__dirname, "site");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@informes.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "2026";
const SESSION_SECRET = process.env.SESSION_SECRET || "portal-management-secret";
const SESSION_COOKIE = "report_portal_session";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 25 * 1024 * 1024,
  },
});

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getSessionToken() {
  return sha(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}:${SESSION_SECRET}`);
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf("=");
      if (index === -1) {
        return acc;
      }
      const key = part.slice(0, index);
      const value = decodeURIComponent(part.slice(index + 1));
      acc[key] = value;
      return acc;
    }, {});
}

function formatMonthTitle(monthValue) {
  const [year, month] = monthValue.split("-");
  const date = new Date(`${year}-${month}-01T12:00:00Z`);
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .toUpperCase();
}

function formatRangeLabel(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return `Del 1 de ${monthLabel} al ${lastDay} de ${monthLabel} de ${year}`;
}

function sanitizeBaseName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path
    .basename(fileName, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "documento";
}

function inferTitleFromHtml(buffer) {
  const content = buffer.toString("utf8");
  const match = content.match(/<title>(.*?)<\/title>/i);
  if (!match) {
    return "";
  }
  return match[1].trim().toUpperCase();
}

function inferTitleFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".html") {
    const htmlTitle = inferTitleFromHtml(file.buffer);
    if (htmlTitle) {
      return htmlTitle;
    }
  }
  return sanitizeBaseName(file.originalname).replace(/-/g, " ").toUpperCase();
}

function buildPublicClient(client) {
  return {
    id: client.id,
    name: client.name,
  };
}

function groupReportsByMonth(reports = []) {
  const monthMap = new Map();

  reports
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((report) => {
      if (!monthMap.has(report.month)) {
        monthMap.set(report.month, {
          id: report.month,
          title: report.monthTitle,
          rangeLabel: report.rangeLabel,
          documents: [],
        });
      }

      monthMap.get(report.month).documents.push({
        id: report.id,
        title: report.title,
        description: report.description,
        displayType: report.displayType,
        fileKind: report.fileKind,
        url: report.url,
      });
    });

  return Array.from(monthMap.values()).sort((a, b) => b.id.localeCompare(a.id));
}

async function ensureDataFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });

  if (!fs.existsSync(DB_FILE)) {
    await fsp.copyFile(SEED_FILE, DB_FILE);
  }
}

async function readDb() {
  await ensureDataFile();
  const raw = await fsp.readFile(DB_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeDb(data) {
  await ensureDataFile();
  await fsp.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

function adminOnly(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE] !== getSessionToken()) {
    res.status(401).json({ message: "No autorizado." });
    return;
  }
  next();
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /\n");
});

app.use("/assets", express.static(path.join(SITE_DIR, "assets")));
app.use("/reports", express.static(path.join(SITE_DIR, "reports")));
app.use("/files", express.static(UPLOAD_DIR));

app.get("/api/public/clients", async (_req, res) => {
  const db = await readDb();
  res.json({
    clients: db.clients.map(buildPublicClient),
  });
});

app.post("/api/public/access", async (req, res) => {
  const { clientId, pin } = req.body ?? {};
  const db = await readDb();
  const client = db.clients.find((item) => item.id === clientId);

  if (!client) {
    res.status(404).json({ message: "Selecciona un cliente." });
    return;
  }

  if (!client.pin || !client.reports || client.reports.length === 0) {
    res.status(403).json({
      message: "Este cliente activo aun no tiene acceso individual publicado.",
    });
    return;
  }

  if (!/^[0-9]{4}$/.test(String(pin || ""))) {
    res.status(400).json({
      message: "Ingresa un codigo de seguridad de 4 digitos.",
    });
    return;
  }

  if (String(pin) !== client.pin) {
    res.status(401).json({
      message: "Codigo de seguridad incorrecto.",
    });
    return;
  }

  res.json({
    client: {
      id: client.id,
      name: client.name,
      months: groupReportsByMonth(client.reports),
    },
  });
});

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: "Credenciales incorrectas." });
    return;
  }

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${getSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
  );
  res.json({ ok: true, email: ADMIN_EMAIL });
});

app.post("/api/admin/logout", adminOnly, (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  res.json({ ok: true });
});

app.get("/api/admin/session", adminOnly, (_req, res) => {
  res.json({ ok: true, email: ADMIN_EMAIL });
});

app.get("/api/admin/clients", adminOnly, async (_req, res) => {
  const db = await readDb();
  res.json({
    clients: db.clients.map((client) => ({
      id: client.id,
      name: client.name,
      hasPin: Boolean(client.pin),
      pinPreview: client.pin ? "••••" : "Sin clave",
      reportsCount: client.reports.length,
      months: groupReportsByMonth(client.reports),
    })),
  });
});

app.post("/api/admin/clients/:clientId/pin", adminOnly, async (req, res) => {
  const { clientId } = req.params;
  const { pin } = req.body ?? {};

  if (!/^[0-9]{4}$/.test(String(pin || ""))) {
    res.status(400).json({ message: "La clave debe tener 4 digitos." });
    return;
  }

  const db = await readDb();
  const client = db.clients.find((item) => item.id === clientId);
  if (!client) {
    res.status(404).json({ message: "Cliente no encontrado." });
    return;
  }

  client.pin = String(pin);
  await writeDb(db);
  res.json({ ok: true, message: `Clave actualizada para ${client.name}.` });
});

app.post(
  "/api/admin/uploads",
  adminOnly,
  upload.array("documents", 10),
  async (req, res) => {
    const { clientId, month, title, description } = req.body ?? {};
    const files = req.files ?? [];

    if (!clientId) {
      res.status(400).json({ message: "Selecciona un cliente." });
      return;
    }

    if (!/^\d{4}-\d{2}$/.test(String(month || ""))) {
      res.status(400).json({ message: "Selecciona un mes valido." });
      return;
    }

    if (!files.length) {
      res.status(400).json({ message: "Sube al menos un documento." });
      return;
    }

    const db = await readDb();
    const client = db.clients.find((item) => item.id === clientId);
    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado." });
      return;
    }

    const monthTitle = formatMonthTitle(month);
    const rangeLabel = formatRangeLabel(month);
    const targetDir = path.join(UPLOAD_DIR, clientId, month);
    await fsp.mkdir(targetDir, { recursive: true });

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (![".html", ".pdf"].includes(ext)) {
        continue;
      }

      const safeBase = sanitizeBaseName(file.originalname);
      const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeBase}${ext}`;
      const filePath = path.join(targetDir, uniqueName);
      await fsp.writeFile(filePath, file.buffer);

      const inferredTitle = inferTitleFromFile(file);
      const reportTitle =
        files.length === 1 && title?.trim() ? title.trim().toUpperCase() : inferredTitle;
      const reportDescription = description?.trim()
        ? description.trim()
        : ext === ".html"
          ? "Informe cargado como archivo HTML dinamico."
          : "Documento PDF cargado desde el panel administrativo.";

      client.reports.push({
        id: crypto.randomUUID(),
        month,
        monthTitle,
        rangeLabel,
        title: reportTitle,
        description: reportDescription,
        displayType: ext === ".html" ? "INFORME DINAMICO" : "PDF",
        fileKind: ext === ".html" ? "html" : "pdf",
        url: `/files/${clientId}/${month}/${uniqueName}`,
        createdAt: new Date().toISOString(),
      });
    }

    await writeDb(db);
    res.json({ ok: true, message: `Documentos cargados para ${client.name}.` });
  }
);

app.get("/management", (_req, res) => {
  res.sendFile(path.join(SITE_DIR, "management", "index.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(SITE_DIR, "index.html"));
});

await ensureDataFile();

app.listen(PORT, () => {
  console.log(`Client report portal running on port ${PORT}`);
});
