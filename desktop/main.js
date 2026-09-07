const { app, BrowserWindow } = require("electron");
const path = require("path");

const {
  iniciarServidor,
  detenerServidor,
} = require("../backend/src/server");

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Censo Humboldt",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ventana.loadFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
}

app.whenReady().then(() => {
  iniciarServidor();

  crearVentana();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentana();
    }
  });
});

app.on("before-quit", () => {
  detenerServidor();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});