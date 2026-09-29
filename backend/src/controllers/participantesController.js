const db = require("../database/sqlite");

// ======================================================
// OBTENER PARTICIPANTES
// ======================================================

const obtenerParticipantes = (req, res) => {
  try {
    const { id_curso } = req.query;

    let consulta = `
      SELECT
        p.id_participante,
        p.nombre_completo,
        p.telefono,
        p.id_mercado,
        m.nombre AS mercado,
        p.id_curso,
        c.nombre AS curso,
        p.fecha_registro
      FROM participantes_curso p

      LEFT JOIN mercados m
        ON p.id_mercado = m.id_mercado

      LEFT JOIN cursos c
        ON p.id_curso = c.id_curso

      WHERE 1 = 1
    `;

    const parametros = [];

    if (id_curso) {
      consulta += ` AND p.id_curso = ?`;
      parametros.push(id_curso);
    }

    consulta += `
      ORDER BY p.nombre_completo ASC
    `;

    const participantes = db
      .prepare(consulta)
      .all(...parametros);

    res.json(participantes);

  } catch (error) {
    console.error(
      "Error al obtener participantes:",
      error
    );

    res.status(500).json({
      mensaje: "Error al obtener participantes",
    });
  }
};

// ======================================================
// CREAR PARTICIPANTE
// ======================================================

const crearParticipante = (req, res) => {
  try {
    const {
      nombre_completo,
      telefono,
      id_mercado,
      id_curso,
    } = req.body;

    if (!nombre_completo || !nombre_completo.trim()) {
      return res.status(400).json({
        mensaje:
          "El nombre del participante es obligatorio",
      });
    }

    if (!id_curso) {
      return res.status(400).json({
        mensaje:
          "El curso del participante es obligatorio",
      });
    }

    // Comprobar que el curso realmente exista
    const cursoExiste = db
      .prepare(`
        SELECT id_curso
        FROM cursos
        WHERE id_curso = ?
      `)
      .get(id_curso);

    if (!cursoExiste) {
      return res.status(404).json({
        mensaje: "El curso seleccionado no existe",
      });
    }

    // Si seleccionó mercado, comprobar que exista
    if (id_mercado) {
      const mercadoExiste = db
        .prepare(`
          SELECT id_mercado
          FROM mercados
          WHERE id_mercado = ?
            AND activo = 1
        `)
        .get(id_mercado);

      if (!mercadoExiste) {
        return res.status(404).json({
          mensaje:
            "El mercado o plaza seleccionado no existe",
        });
      }
    }

    const resultado = db
      .prepare(`
        INSERT INTO participantes_curso (
          nombre_completo,
          telefono,
          id_mercado,
          id_curso
        )
        VALUES (?, ?, ?, ?)
      `)
      .run(
        nombre_completo.trim(),
        telefono?.trim() || null,
        id_mercado || null,
        id_curso
      );

    const participante = db
      .prepare(`
        SELECT
          p.id_participante,
          p.nombre_completo,
          p.telefono,
          p.id_mercado,
          m.nombre AS mercado,
          p.id_curso,
          c.nombre AS curso,
          p.fecha_registro
        FROM participantes_curso p

        LEFT JOIN mercados m
          ON p.id_mercado = m.id_mercado

        LEFT JOIN cursos c
          ON p.id_curso = c.id_curso

        WHERE p.id_participante = ?
      `)
      .get(resultado.lastInsertRowid);

    res.status(201).json(participante);

  } catch (error) {
    console.error(
      "Error al crear participante:",
      error
    );

    res.status(500).json({
      mensaje: "Error al crear participante",
    });
  }
};

module.exports = {
  obtenerParticipantes,
  crearParticipante,
};