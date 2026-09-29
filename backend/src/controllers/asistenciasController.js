const db = require("../database/sqlite");

// ======================================================
// OBTENER ASISTENCIAS
// ======================================================

const obtenerAsistencias = (req, res) => {
  try {
    const { id_curso, fecha } = req.query;

    let consulta = `
      SELECT
        a.id_asistencia,
        a.id_participante,
        p.nombre_completo,
        p.telefono,
        p.id_mercado,
        m.nombre AS mercado,
        a.id_curso,
        c.nombre AS curso,
        a.fecha
      FROM asistencias a

      INNER JOIN participantes_curso p
        ON a.id_participante = p.id_participante

      INNER JOIN cursos c
        ON a.id_curso = c.id_curso

      LEFT JOIN mercados m
        ON p.id_mercado = m.id_mercado

      WHERE 1 = 1
    `;

    const parametros = [];

    if (id_curso) {
      consulta += ` AND a.id_curso = ?`;
      parametros.push(id_curso);
    }

    if (fecha) {
      consulta += ` AND a.fecha = ?`;
      parametros.push(fecha);
    }

    consulta += `
      ORDER BY a.fecha DESC, p.nombre_completo ASC
    `;

    const asistencias = db
      .prepare(consulta)
      .all(...parametros);

    res.json(asistencias);
  } catch (error) {
    console.error("Error al obtener asistencias:", error);

    res.status(500).json({
      mensaje: "Error al obtener asistencias",
    });
  }
};

// ======================================================
// REGISTRAR ASISTENCIA
// ======================================================

const registrarAsistencia = (req, res) => {
  try {
    const {
      id_participante,
      id_curso,
      fecha,
    } = req.body;

    if (!id_participante || !id_curso || !fecha) {
      return res.status(400).json({
        mensaje:
          "Participante, curso y fecha son obligatorios",
      });
    }

    // Verificar participante y obtener su curso
const participante = db
  .prepare(`
    SELECT
      id_participante,
      id_curso
    FROM participantes_curso
    WHERE id_participante = ?
  `)
  .get(id_participante);

if (!participante) {
  return res.status(404).json({
    mensaje: "El participante no existe",
  });
}

    // Verificar curso
    const curso = db
      .prepare(`
        SELECT id_curso
        FROM cursos
        WHERE id_curso = ?
      `)
      .get(id_curso);

    if (!curso) {
      return res.status(404).json({
        mensaje: "El curso no existe",
      });
    }

    // Verificar que el participante pertenece al curso
if (Number(participante.id_curso) !== Number(id_curso)) {
  return res.status(400).json({
    mensaje:
      "El participante no está inscrito en el curso seleccionado",
  });
}

    const resultado = db
      .prepare(`
        INSERT INTO asistencias (
          id_participante,
          id_curso,
          fecha
        )
        VALUES (?, ?, ?)
      `)
      .run(
        id_participante,
        id_curso,
        fecha
      );

    const asistencia = db
      .prepare(`
        SELECT
          a.id_asistencia,
          a.fecha,
          a.id_participante,
          p.nombre_completo,
          a.id_curso,
          c.nombre AS curso,
          m.nombre AS mercado
        FROM asistencias a

        INNER JOIN participantes_curso p
          ON a.id_participante = p.id_participante

        INNER JOIN cursos c
          ON a.id_curso = c.id_curso

        LEFT JOIN mercados m
          ON p.id_mercado = m.id_mercado

        WHERE a.id_asistencia = ?
      `)
      .get(resultado.lastInsertRowid);

    res.status(201).json(asistencia);

  } catch (error) {
    // Nuestra tabla tiene:
    // UNIQUE (id_participante, id_curso, fecha)
    //
    // Por eso SQLite no permitirá marcar dos veces
    // al mismo participante el mismo día en el mismo curso.

    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return res.status(409).json({
        mensaje:
          "La asistencia de este participante ya fue registrada para esta fecha",
      });
    }

    console.error(
      "Error al registrar asistencia:",
      error
    );

    res.status(500).json({
      mensaje: "Error al registrar asistencia",
    });
  }
};

// ======================================================
// HISTORIAL DE UN PARTICIPANTE
// ======================================================

const obtenerHistorialParticipante = (req, res) => {
  try {
    const { id } = req.params;
    const { id_curso } = req.query;

    const participante = db
      .prepare(`
        SELECT
          p.id_participante,
          p.nombre_completo,
          p.telefono,
          p.id_mercado,
          m.nombre AS mercado
        FROM participantes_curso p

        LEFT JOIN mercados m
          ON p.id_mercado = m.id_mercado

        WHERE p.id_participante = ?
      `)
      .get(id);

    if (!participante) {
      return res.status(404).json({
        mensaje: "El participante no existe",
      });
    }

    let consulta = `
      SELECT
        a.id_asistencia,
        a.fecha,
        a.id_curso,
        c.nombre AS curso
      FROM asistencias a

      INNER JOIN cursos c
        ON a.id_curso = c.id_curso

      WHERE a.id_participante = ?
    `;

    const parametros = [id];

    if (id_curso) {
      consulta += ` AND a.id_curso = ?`;
      parametros.push(id_curso);
    }

    consulta += ` ORDER BY a.fecha ASC`;

    const asistencias = db
      .prepare(consulta)
      .all(...parametros);

    res.json({
      participante,
      total_asistencias: asistencias.length,
      asistencias,
    });

  } catch (error) {
    console.error(
      "Error al obtener historial:",
      error
    );

    res.status(500).json({
      mensaje:
        "Error al obtener historial del participante",
    });
  }
};

// ======================================================
// RESUMEN DE ASISTENCIA POR CURSO
// ======================================================

const obtenerResumenCurso = (req, res) => {
  try {
    const { id_curso } = req.params;

    const curso = db
      .prepare(`
        SELECT
          id_curso,
          nombre,
          fecha_inicio,
          fecha_fin
        FROM cursos
        WHERE id_curso = ?
      `)
      .get(id_curso);

    if (!curso) {
      return res.status(404).json({
        mensaje: "El curso no existe",
      });
    }

    const participantes = db
      .prepare(`
        SELECT
          p.id_participante,
          p.nombre_completo,
          p.telefono,
          p.id_mercado,
          m.nombre AS mercado,

          COUNT(a.id_asistencia) AS total_asistencias,

          GROUP_CONCAT(
            a.fecha,
            '|'
          ) AS fechas

        FROM participantes_curso p

        LEFT JOIN mercados m
          ON p.id_mercado = m.id_mercado

        LEFT JOIN asistencias a
          ON a.id_participante = p.id_participante
          AND a.id_curso = ?

        WHERE p.id_curso = ?

        GROUP BY
          p.id_participante,
          p.nombre_completo,
          p.telefono,
          p.id_mercado,
          m.nombre

        ORDER BY
          total_asistencias DESC,
          p.nombre_completo ASC
      `)
      .all(id_curso, id_curso);

    const participantesProcesados =
      participantes.map((participante) => ({
        ...participante,

        total_asistencias:
          Number(participante.total_asistencias),

        fechas: participante.fechas
          ? participante.fechas
              .split("|")
              .sort()
          : [],
      }));

    const totalParticipantes =
      participantesProcesados.length;

    const totalAsistencias =
      participantesProcesados.reduce(
        (acumulado, participante) =>
          acumulado +
          participante.total_asistencias,
        0
      );

    const promedioAsistencias =
      totalParticipantes > 0
        ? Number(
            (
              totalAsistencias /
              totalParticipantes
            ).toFixed(2)
          )
        : 0;

    res.json({
      curso,
      resumen: {
        total_participantes: totalParticipantes,
        total_asistencias: totalAsistencias,
        promedio_asistencias:
          promedioAsistencias,
      },
      participantes:
        participantesProcesados,
    });

  } catch (error) {
    console.error(
      "Error al obtener resumen del curso:",
      error
    );

    res.status(500).json({
      mensaje:
        "Error al obtener resumen de asistencia",
    });
  }
};

module.exports = {
  obtenerAsistencias,
  registrarAsistencia,
  obtenerHistorialParticipante,
  obtenerResumenCurso,
};