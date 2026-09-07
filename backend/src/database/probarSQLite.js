const db = require("./sqlite");

const resultado = db
  .prepare("SELECT sqlite_version() AS version")
  .get();

console.log("Versión de SQLite:", resultado.version);

const tablas = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)
  .all();

console.log("Tablas creadas:");

for (const tabla of tablas) {
  console.log("-", tabla.name);
}

console.log("\nCategorías:");
console.table(
  db.prepare(`
    SELECT id_categoria, codigo, nombre
    FROM categorias_giro
    ORDER BY id_categoria
  `).all()
);

console.log("\nMedios de pago:");
console.table(
  db.prepare(`
    SELECT id_medio_pago, nombre
    FROM medios_pago
    ORDER BY id_medio_pago
  `).all()
);

console.log("\nEquipamientos:");
console.table(
  db.prepare(`
    SELECT id_equipamiento, nombre
    FROM equipamientos
    ORDER BY id_equipamiento
  `).all()
);

db.close();