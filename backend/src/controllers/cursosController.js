const db = require("../database/sqlite");

// ======================================================
// OBTENER CURSOS
// ======================================================

const obtenerCursos = (req, res) => {
  try {
    const cursos = db
      .prepare(`
        SELECT
          id_curso,
          nombre,
          fecha_inicio,
          fecha_fin,
          activo,
          created_at
        FROM cursos
        ORDER BY id_curso DESC
      `)
      .all();

    res.json(cursos);
  } catch (error) {
    console.error("Error al obtener cursos:", error);

    res.status(500).json({
      mensaje: "Error al obtener cursos",
    });
  }
};

// ======================================================
// CREAR CURSO
// ======================================================

const crearCurso = (req, res) => {
  try {
    const {
      nombre,
      fecha_inicio,
      fecha_fin,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        mensaje: "El nombre del curso es obligatorio",
      });
    }

    const resultado = db
      .prepare(`
        INSERT INTO cursos (
          nombre,
          fecha_inicio,
          fecha_fin
        )
        VALUES (?, ?, ?)
      `)
      .run(
        nombre.trim(),
        fecha_inicio || null,
        fecha_fin || null
      );

    const cursoCreado = db
      .prepare(`
        SELECT *
        FROM cursos
        WHERE id_curso = ?
      `)
      .get(resultado.lastInsertRowid);

    res.status(201).json(cursoCreado);
  } catch (error) {
    console.error("Error al crear curso:", error);

    res.status(500).json({
      mensaje: "Error al crear curso",
    });
  }
};

module.exports = {
  obtenerCursos,
  crearCurso,
};