const db = require("../database/sqlite");

const obtenerMetricas = (req, res) => {
  try {
    const {
      categoria,
      genero,
      edadMin,
      edadMax,
      estatus,
      cuenta,
      banco,
      pagos,
      medioPago,
      herramientas,
      equipamiento,
    } = req.query;

    // ======================================================
    // FILTROS DINÁMICOS
    // ======================================================

    const condiciones = [];
    const parametros = [];

    if (categoria) {
      condiciones.push("c.id_categoria = ?");
      parametros.push(Number(categoria));
    }

    if (genero) {
      condiciones.push("co.genero = ?");
      parametros.push(genero);
    }

    if (edadMin !== undefined && edadMin !== "") {
      condiciones.push("co.edad >= ?");
      parametros.push(Number(edadMin));
    }

    if (edadMax !== undefined && edadMax !== "") {
      condiciones.push("co.edad <= ?");
      parametros.push(Number(edadMax));
    }

    if (estatus) {
      condiciones.push("c.estatus_local = ?");
      parametros.push(estatus);
    }

    if (cuenta === "true") {
      condiciones.push("c.tiene_cuenta_bancaria = 1");
    }

    if (cuenta === "false") {
      condiciones.push("c.tiene_cuenta_bancaria = 0");
    }

    if (banco) {
      condiciones.push(`
        LOWER(TRIM(c.institucion_bancaria))
        = LOWER(TRIM(?))
      `);

      parametros.push(banco);
    }

    if (pagos === "true") {
      condiciones.push("c.acepta_pagos_digitales = 1");
    }

    if (pagos === "false") {
      condiciones.push("c.acepta_pagos_digitales = 0");
    }

    if (medioPago) {
      condiciones.push(`
        EXISTS (
          SELECT 1
          FROM censo_medios_pago cmp_filtro
          WHERE cmp_filtro.id_censo = c.id_censo
            AND cmp_filtro.id_medio_pago = ?
        )
      `);

      parametros.push(Number(medioPago));
    }

    if (herramientas === "true") {
      condiciones.push("c.usa_herramientas_tec = 1");
    }

    if (herramientas === "false") {
      condiciones.push("c.usa_herramientas_tec = 0");
    }

    if (equipamiento) {
      condiciones.push(`
        EXISTS (
          SELECT 1
          FROM censo_equipamiento ce_filtro
          WHERE ce_filtro.id_censo = c.id_censo
            AND ce_filtro.id_equipamiento = ?
        )
      `);

      parametros.push(Number(equipamiento));
    }

    const where =
      condiciones.length > 0
        ? `WHERE ${condiciones.join(" AND ")}`
        : "";

    const crearCTE = `
      WITH filtrados AS (
        SELECT
          c.*,
          co.genero,
          co.edad
        FROM censos c

        INNER JOIN comerciantes co
          ON co.id_comerciante = c.id_comerciante

        ${where}
      )
    `;

    // ======================================================
    // RESUMEN
    // ======================================================

    const resumen = db.prepare(`
      ${crearCTE}

      SELECT
        COUNT(*) AS total_censos,

        SUM(
          CASE WHEN tiene_cuenta_bancaria = 1
          THEN 1 ELSE 0 END
        ) AS con_cuenta_bancaria,

        SUM(
          CASE WHEN tiene_cuenta_bancaria = 0
          THEN 1 ELSE 0 END
        ) AS sin_cuenta_bancaria,

        SUM(
          CASE WHEN acepta_pagos_digitales = 1
          THEN 1 ELSE 0 END
        ) AS acepta_pagos_digitales,

        SUM(
          CASE WHEN acepta_pagos_digitales = 0
          THEN 1 ELSE 0 END
        ) AS no_acepta_pagos_digitales,

        SUM(
          CASE WHEN usa_herramientas_tec = 1
          THEN 1 ELSE 0 END
        ) AS usa_herramientas,

        SUM(
          CASE WHEN usa_herramientas_tec = 0
          THEN 1 ELSE 0 END
        ) AS no_usa_herramientas,

        SUM(
          CASE WHEN estatus_local = 'Activo'
          THEN 1 ELSE 0 END
        ) AS locales_activos,

        SUM(
          CASE WHEN estatus_local = 'Bodega'
          THEN 1 ELSE 0 END
        ) AS locales_bodega,

        SUM(
          CASE WHEN estatus_local = 'Cerrado'
          THEN 1 ELSE 0 END
        ) AS locales_cerrados,

        ROUND(AVG(edad), 1) AS edad_promedio

      FROM filtrados
    `).get(...parametros);

    // ======================================================
    // CATEGORÍAS
    // ======================================================

    const categorias = db.prepare(`
      ${crearCTE}

      SELECT
        COALESCE(cg.codigo, 'SIN') AS codigo,
        COALESCE(cg.nombre, 'Sin categoría') AS nombre,
        COUNT(*) AS total

      FROM filtrados f

      LEFT JOIN categorias_giro cg
        ON cg.id_categoria = f.id_categoria

      GROUP BY
        cg.id_categoria,
        cg.codigo,
        cg.nombre

      ORDER BY total DESC
    `).all(...parametros);

    // ======================================================
    // BANCOS
    // ======================================================

    const bancos = db.prepare(`
      ${crearCTE}

      SELECT
        CASE
          WHEN tiene_cuenta_bancaria = 0
            THEN 'No tiene cuenta bancaria'

          WHEN institucion_bancaria IS NULL
            OR TRIM(institucion_bancaria) = ''
            THEN 'No especificado'

          ELSE TRIM(institucion_bancaria)
        END AS banco,

        COUNT(*) AS total

      FROM filtrados

      GROUP BY
        CASE
          WHEN tiene_cuenta_bancaria = 0
            THEN 'No tiene cuenta bancaria'

          WHEN institucion_bancaria IS NULL
            OR TRIM(institucion_bancaria) = ''
            THEN 'No especificado'

          ELSE TRIM(institucion_bancaria)
        END

      ORDER BY total DESC, banco
    `).all(...parametros);

    // ======================================================
    // MEDIOS DE PAGO
    // ======================================================

    const mediosPagoDatos = db.prepare(`
      ${crearCTE}

      SELECT
        mp.id_medio_pago,
        mp.nombre,
        COUNT(f.id_censo) AS total

      FROM medios_pago mp

      LEFT JOIN censo_medios_pago cmp
        ON cmp.id_medio_pago = mp.id_medio_pago

      LEFT JOIN filtrados f
        ON f.id_censo = cmp.id_censo

      GROUP BY
        mp.id_medio_pago,
        mp.nombre

      ORDER BY total DESC, mp.nombre
    `).all(...parametros);

    // ======================================================
    // EQUIPAMIENTOS
    // ======================================================

    const equipamientosDatos = db.prepare(`
      ${crearCTE}

      SELECT
        e.id_equipamiento,
        e.nombre,
        COUNT(f.id_censo) AS total

      FROM equipamientos e

      LEFT JOIN censo_equipamiento ce
        ON ce.id_equipamiento = e.id_equipamiento

      LEFT JOIN filtrados f
        ON f.id_censo = ce.id_censo

      GROUP BY
        e.id_equipamiento,
        e.nombre

      ORDER BY total DESC, e.nombre
    `).all(...parametros);

    // ======================================================
    // GÉNEROS
    // ======================================================

    const generos = db.prepare(`
      ${crearCTE}

      SELECT
        COALESCE(genero, 'No especificado') AS genero,
        COUNT(*) AS total

      FROM filtrados

      GROUP BY genero

      ORDER BY total DESC
    `).all(...parametros);

    // ======================================================
    // RANGOS DE EDAD
    // ======================================================

    const edades = db.prepare(`
      ${crearCTE}

      SELECT
        CASE
          WHEN edad IS NULL THEN 'No especificada'
          WHEN edad < 18 THEN 'Menor de 18'
          WHEN edad BETWEEN 18 AND 29 THEN '18-29'
          WHEN edad BETWEEN 30 AND 39 THEN '30-39'
          WHEN edad BETWEEN 40 AND 49 THEN '40-49'
          WHEN edad BETWEEN 50 AND 59 THEN '50-59'
          ELSE '60+'
        END AS rango,

        COUNT(*) AS total

      FROM filtrados

      GROUP BY
        CASE
          WHEN edad IS NULL THEN 'No especificada'
          WHEN edad < 18 THEN 'Menor de 18'
          WHEN edad BETWEEN 18 AND 29 THEN '18-29'
          WHEN edad BETWEEN 30 AND 39 THEN '30-39'
          WHEN edad BETWEEN 40 AND 49 THEN '40-49'
          WHEN edad BETWEEN 50 AND 59 THEN '50-59'
          ELSE '60+'
        END

      ORDER BY
        MIN(
          CASE
            WHEN edad IS NULL THEN 999
            ELSE edad
          END
        )
    `).all(...parametros);

    // ======================================================
    // OPCIONES DE FILTRO
    // ======================================================

    const opcionesCategorias = db.prepare(`
      SELECT id_categoria, codigo, nombre
      FROM categorias_giro
      ORDER BY id_categoria
    `).all();

    const opcionesGeneros = db.prepare(`
      SELECT DISTINCT genero
      FROM comerciantes
      WHERE genero IS NOT NULL
      ORDER BY genero
    `).all();

    const opcionesBancos = db.prepare(`
      SELECT DISTINCT
        TRIM(institucion_bancaria) AS banco

      FROM censos

      WHERE
        tiene_cuenta_bancaria = 1
        AND institucion_bancaria IS NOT NULL
        AND TRIM(institucion_bancaria) <> ''

      ORDER BY banco
    `).all();

    const opcionesMedios = db.prepare(`
      SELECT id_medio_pago, nombre
      FROM medios_pago
      ORDER BY nombre
    `).all();

    const opcionesEquipamientos = db.prepare(`
      SELECT id_equipamiento, nombre
      FROM equipamientos
      ORDER BY nombre
    `).all();

    // ======================================================
    // RESPUESTA
    // ======================================================

    res.json({
      filtrosAplicados: {
        categoria: categoria ? Number(categoria) : null,
        genero: genero || null,
        edadMin:
          edadMin !== undefined && edadMin !== ""
            ? Number(edadMin)
            : null,
        edadMax:
          edadMax !== undefined && edadMax !== ""
            ? Number(edadMax)
            : null,
        estatus: estatus || null,
        cuenta:
          cuenta === "true"
            ? true
            : cuenta === "false"
              ? false
              : null,
        banco: banco || null,
        pagos:
          pagos === "true"
            ? true
            : pagos === "false"
              ? false
              : null,
        medioPago: medioPago
          ? Number(medioPago)
          : null,
        herramientas:
          herramientas === "true"
            ? true
            : herramientas === "false"
              ? false
              : null,
        equipamiento: equipamiento
          ? Number(equipamiento)
          : null,
      },

      resumen,
      categorias,
      bancos,
      mediosPago: mediosPagoDatos,
      equipamientos: equipamientosDatos,
      generos,
      edades,

      opcionesFiltros: {
        categorias: opcionesCategorias,
        generos: opcionesGeneros,
        bancos: opcionesBancos,
        mediosPago: opcionesMedios,
        equipamientos: opcionesEquipamientos,
      },
    });

  } catch (error) {
    console.error(
      "Error al obtener métricas SQLite:",
      error
    );

    res.status(500).json({
      mensaje: "Error al obtener las métricas",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerMetricas,
};