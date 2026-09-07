const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const carpetaDatos = path.join(__dirname, "../../../data");

if (!fs.existsSync(carpetaDatos)) {
  fs.mkdirSync(carpetaDatos, { recursive: true });
}

const rutaDB = path.join(carpetaDatos, "censo-humboldt.db");

const db = new Database(rutaDB);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS categorias_giro (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS comerciantes (
    id_comerciante INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    genero TEXT,
    edad INTEGER,
    telefono TEXT,
    correo TEXT,
    consentimiento_datos INTEGER NOT NULL DEFAULT 0,
    consentimiento_whatsapp INTEGER,
    consentimiento_verbal INTEGER,
    fecha_consentimiento TEXT,
    notas TEXT,
    fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
      edad IS NULL OR
      (edad >= 0 AND edad <= 120)
    ),

    CHECK (
      genero IS NULL OR
      genero IN (
        'Masculino',
        'Femenino',
        'Otro',
        'Prefiere no decir'
      )
    )
  );

  CREATE TABLE IF NOT EXISTS medios_pago (
    id_medio_pago INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS equipamientos (
    id_equipamiento INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS censos (
    id_censo INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_levantamiento TEXT NOT NULL DEFAULT CURRENT_DATE,
    mercado TEXT NOT NULL,
    numero_local TEXT,
    id_comerciante INTEGER NOT NULL,
    giro_autorizado TEXT,
    id_categoria INTEGER,
    estatus_local TEXT NOT NULL,
    tiene_cuenta_bancaria INTEGER NOT NULL,
    institucion_bancaria TEXT,
    acepta_pagos_digitales INTEGER NOT NULL,
    usa_herramientas_tec INTEGER NOT NULL,
    nivel_calculado TEXT,
    observaciones_cualitativas TEXT,
    id_censor TEXT,
    firma_locatario INTEGER,
    fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
      estatus_local IN ('Activo', 'Bodega', 'Cerrado')
    ),

    CHECK (
      tiene_cuenta_bancaria = 1 OR
      institucion_bancaria IS NULL
    ),

    CHECK (
      nivel_calculado IS NULL OR
      nivel_calculado IN (
        'N0 Analógico',
        'N1 Conectado',
        'N2 Presente',
        'N3 Operando'
      )
    ),

    FOREIGN KEY (id_comerciante)
      REFERENCES comerciantes(id_comerciante),

    FOREIGN KEY (id_categoria)
      REFERENCES categorias_giro(id_categoria)
  );

  CREATE TABLE IF NOT EXISTS censo_medios_pago (
    id_censo INTEGER NOT NULL,
    id_medio_pago INTEGER NOT NULL,

    PRIMARY KEY (id_censo, id_medio_pago),

    FOREIGN KEY (id_censo)
      REFERENCES censos(id_censo)
      ON DELETE CASCADE,

    FOREIGN KEY (id_medio_pago)
      REFERENCES medios_pago(id_medio_pago)
  );

  CREATE TABLE IF NOT EXISTS censo_equipamiento (
    id_censo INTEGER NOT NULL,
    id_equipamiento INTEGER NOT NULL,

    PRIMARY KEY (id_censo, id_equipamiento),

    FOREIGN KEY (id_censo)
      REFERENCES censos(id_censo)
      ON DELETE CASCADE,

    FOREIGN KEY (id_equipamiento)
      REFERENCES equipamientos(id_equipamiento)
  );

  CREATE TABLE IF NOT EXISTS bitacora_abordaje (
    id_bitacora INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL DEFAULT CURRENT_DATE,
    censor TEXT,
    zona_pasillo TEXT,
    abordados INTEGER NOT NULL DEFAULT 0,
    aceptaron INTEGER NOT NULL DEFAULT 0,
    motivo_no_participa TEXT,
    observaciones TEXT,
    fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (abordados >= 0),
    CHECK (aceptaron >= 0),
    CHECK (aceptaron <= abordados)
  );
`);

// ======================================================
// CATÁLOGOS INICIALES
// ======================================================

const insertarCategoria = db.prepare(`
  INSERT OR IGNORE INTO categorias_giro (codigo, nombre)
  VALUES (?, ?)
`);

const categorias = [
  ["G1", "Perecederos"],
  ["G2", "Frutas y verduras"],
  ["G3", "Abarrotes"],
  ["G4", "Comida preparada"],
  ["G5", "Dulces regionales"],
  ["G6", "Artesanías"],
  ["G7", "Servicios"],
  ["G8", "Otros"],
];

for (const [codigo, nombre] of categorias) {
  insertarCategoria.run(codigo, nombre);
}


const insertarMedioPago = db.prepare(`
  INSERT OR IGNORE INTO medios_pago (nombre)
  VALUES (?)
`);

const mediosPago = [
  "SPEI - Transferencia",
  "Terminal punto de venta",
  "Enlaces de pago",
  "Códigos QR",
  "Billeteras digitales",
];

for (const nombre of mediosPago) {
  insertarMedioPago.run(nombre);
}


const insertarEquipamiento = db.prepare(`
  INSERT OR IGNORE INTO equipamientos (nombre)
  VALUES (?)
`);

const equipamientos = [
  "Laptop",
  "Tableta",
  "Smartphone",
  "POS",
];

for (const nombre of equipamientos) {
  insertarEquipamiento.run(nombre);
}

console.log("Catálogos SQLite inicializados");

console.log("SQLite conectado:");
console.log(rutaDB);

module.exports = db;