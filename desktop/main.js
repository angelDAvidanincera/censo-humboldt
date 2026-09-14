const { app, BrowserWindow } = require("electron");
const path = require("path");

let iniciarServidor;
let detenerServidor;

function prepararBackend() {
  // La base de datos se guarda fuera del programa,
  // en AppData del usuario.
  const carpetaDatos = path.join(
  app.getPath("appData"),
  "Censo Humboldt"
);

process.env.CENSO_DATA_DIR = carpetaDatos;

  let rutaBackend;

  if (app.isPackaged) {
    // Cuando ya sea un .exe instalado
    rutaBackend = path.join(
      process.resourcesPath,
      "backend",
      "src",
      "server.js"
    );
  } else {
    // Mientras desarrollamos con npm start
    rutaBackend = path.join(
      __dirname,
      "../backend/src/server.js"
    );
  }

  const backend = require(rutaBackend);

  iniciarServidor = backend.iniciarServidor;
  detenerServidor = backend.detenerServidor;
}

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Censo Mercados",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  let rutaFrontend;

  if (app.isPackaged) {
    rutaFrontend = path.join(
      process.resourcesPath,
      "frontend",
      "index.html"
    );
  } else {
    rutaFrontend = path.join(
      __dirname,
      "../frontend/dist/index.html"
    );
  }

  ventana.loadFile(rutaFrontend);
}

app.whenReady().then(() => {
  prepararBackend();

  iniciarServidor();

  crearVentana();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentana();
    }
  });
});

app.on("before-quit", () => {
  if (detenerServidor) {
    detenerServidor();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});