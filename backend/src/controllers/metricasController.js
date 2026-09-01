const pool = require("../database/db");

const obtenerMetricas = async (req, res) => {
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

    const valores = [
      categoria ? Number(categoria) : null,
      genero || null,
      edadMin !== undefined && edadMin !== ""
        ? Number(edadMin)
        : null,
      edadMax !== undefined && edadMax !== ""
        ? Number(edadMax)
        : null,
      estatus || null,
      cuenta === "true"
        ? true
        : cuenta === "false"
          ? false
          : null,
      banco || null,
      pagos === "true"
        ? true
        : pagos === "false"
          ? false
          : null,
      medioPago ? Number(medioPago) : null,
      herramientas === "true"
        ? true
        : herramientas === "false"
          ? false
          : null,
      equipamiento ? Number(equipamiento) : null,
    ];

    const filtros = `
      WHERE
        ($1::BIGINT IS NULL OR c.id_categoria = $1)

        AND (
          $2::TEXT IS NULL
          OR co.genero = $2
        )

        AND (
          $3::INTEGER IS NULL
          OR co.edad >= $3
        )

        AND (
          $4::INTEGER IS NULL
          OR co.edad <= $4
        )

        AND (
          $5::TEXT IS NULL
          OR c.estatus_local = $5
        )

        AND (
          $6::BOOLEAN IS NULL
          OR c.tiene_cuenta_bancaria = $6
        )

        AND (
          $7::TEXT IS NULL
          OR LOWER(TRIM(c.institucion_bancaria))
             = LOWER(TRIM($7))
        )

        AND (
          $8::BOOLEAN IS NULL
          OR c.acepta_pagos_digitales = $8
        )

        AND (
          $9::BIGINT IS NULL
          OR EXISTS (
            SELECT 1
            FROM censo_medios_pago cmp_filtro
            WHERE
              cmp_filtro.id_censo = c.id_censo
              AND cmp_filtro.id_medio_pago = $9
          )
        )

        AND (
          $10::BOOLEAN IS NULL
          OR c.usa_herramientas_tec = $10
        )

        AND (
          $11::BIGINT IS NULL
          OR EXISTS (
            SELECT 1
            FROM censo_equipamiento ce_filtro
            WHERE
              ce_filtro.id_censo = c.id_censo
              AND ce_filtro.id_equipamiento = $11
          )
        )
    `;

    const crearCTE = `
      WITH filtrados AS (
        SELECT
          c.*,
          co.genero,
          co.edad
        FROM censos c

        INNER JOIN comerciantes co
          ON co.id_comerciante = c.id_comerciante

        ${filtros}
      )
    `;

    // RESUMEN

    const resumen = await pool.query(
      `
      ${crearCTE}

      SELECT
        COUNT(*)::INTEGER AS total_censos,

        COUNT(*) FILTER (
          WHERE tiene_cuenta_bancaria = TRUE
        )::INTEGER AS con_cuenta_bancaria,

        COUNT(*) FILTER (
          WHERE tiene_cuenta_bancaria = FALSE
        )::INTEGER AS sin_cuenta_bancaria,

        COUNT(*) FILTER (
          WHERE acepta_pagos_digitales = TRUE
        )::INTEGER AS acepta_pagos_digitales,

        COUNT(*) FILTER (
          WHERE acepta_pagos_digitales = FALSE
        )::INTEGER AS no_acepta_pagos_digitales,

        COUNT(*) FILTER (
          WHERE usa_herramientas_tec = TRUE
        )::INTEGER AS usa_herramientas,

        COUNT(*) FILTER (
          WHERE usa_herramientas_tec = FALSE
        )::INTEGER AS no_usa_herramientas,

        COUNT(*) FILTER (
          WHERE estatus_local = 'Activo'
        )::INTEGER AS locales_activos,

        COUNT(*) FILTER (
          WHERE estatus_local = 'Bodega'
        )::INTEGER AS locales_bodega,

        COUNT(*) FILTER (
          WHERE estatus_local = 'Cerrado'
        )::INTEGER AS locales_cerrados,

        ROUND(AVG(edad), 1) AS edad_promedio

      FROM filtrados
      `,
      valores
    );

    // CATEGORÍAS

    const categorias = await pool.query(
      `
      ${crearCTE}

      SELECT
        COALESCE(cg.codigo, 'SIN') AS codigo,
        COALESCE(cg.nombre, 'Sin categoría') AS nombre,
        COUNT(*)::INTEGER AS total

      FROM filtrados f

      LEFT JOIN categorias_giro cg
        ON cg.id_categoria = f.id_categoria

      GROUP BY
        cg.id_categoria,
        cg.codigo,
        cg.nombre

      ORDER BY total DESC
      `,
      valores
    );

    // INSTITUCIONES BANCARIAS
    // AQUÍ YA CONTAMOS TAMBIÉN A QUIENES NO TIENEN CUENTA

    const bancos = await pool.query(
      `
      ${crearCTE}

      SELECT
        CASE
          WHEN tiene_cuenta_bancaria = FALSE
            THEN 'No tiene cuenta bancaria'

          WHEN institucion_bancaria IS NULL
            OR TRIM(institucion_bancaria) = ''
            THEN 'No especificado'

          ELSE TRIM(institucion_bancaria)
        END AS banco,

        COUNT(*)::INTEGER AS total

      FROM filtrados

      GROUP BY
        CASE
          WHEN tiene_cuenta_bancaria = FALSE
            THEN 'No tiene cuenta bancaria'

          WHEN institucion_bancaria IS NULL
            OR TRIM(institucion_bancaria) = ''
            THEN 'No especificado'

          ELSE TRIM(institucion_bancaria)
        END

      ORDER BY total DESC, banco
      `,
      valores
    );

    // MEDIOS DE PAGO

    const mediosPago = await pool.query(
      `
      ${crearCTE}

      SELECT
        mp.id_medio_pago,
        mp.nombre,
        COUNT(f.id_censo)::INTEGER AS total

      FROM medios_pago mp

      LEFT JOIN censo_medios_pago cmp
        ON cmp.id_medio_pago = mp.id_medio_pago

      LEFT JOIN filtrados f
        ON f.id_censo = cmp.id_censo

      GROUP BY
        mp.id_medio_pago,
        mp.nombre

      ORDER BY total DESC, mp.nombre
      `,
      valores
    );

    // EQUIPAMIENTO

    const equipamientos = await pool.query(
      `
      ${crearCTE}

      SELECT
        e.id_equipamiento,
        e.nombre,
        COUNT(f.id_censo)::INTEGER AS total

      FROM equipamientos e

      LEFT JOIN censo_equipamiento ce
        ON ce.id_equipamiento = e.id_equipamiento

      LEFT JOIN filtrados f
        ON f.id_censo = ce.id_censo

      GROUP BY
        e.id_equipamiento,
        e.nombre

      ORDER BY total DESC, e.nombre
      `,
      valores
    );

    // GÉNERO

    const generos = await pool.query(
      `
      ${crearCTE}

      SELECT
        COALESCE(genero, 'No especificado') AS genero,
        COUNT(*)::INTEGER AS total

      FROM filtrados

      GROUP BY genero

      ORDER BY total DESC
      `,
      valores
    );

    // EDADES

    const edades = await pool.query(
      `
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

        COUNT(*)::INTEGER AS total

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
      `,
      valores
    );

    // OPCIONES PARA LOS FILTROS
    // Estas NO dependen de los filtros seleccionados.

    const opcionesCategorias = await pool.query(`
      SELECT id_categoria, codigo, nombre
      FROM categorias_giro
      ORDER BY id_categoria
    `);

    const opcionesGeneros = await pool.query(`
      SELECT DISTINCT genero
      FROM comerciantes
      WHERE genero IS NOT NULL
      ORDER BY genero
    `);

    const opcionesBancos = await pool.query(`
      SELECT DISTINCT
        TRIM(institucion_bancaria) AS banco

      FROM censos

      WHERE
        tiene_cuenta_bancaria = TRUE
        AND institucion_bancaria IS NOT NULL
        AND TRIM(institucion_bancaria) <> ''

      ORDER BY banco
    `);

    const opcionesMedios = await pool.query(`
      SELECT id_medio_pago, nombre
      FROM medios_pago
      ORDER BY nombre
    `);

    const opcionesEquipamientos = await pool.query(`
      SELECT id_equipamiento, nombre
      FROM equipamientos
      ORDER BY nombre
    `);

    res.json({
      filtrosAplicados: {
        categoria: valores[0],
        genero: valores[1],
        edadMin: valores[2],
        edadMax: valores[3],
        estatus: valores[4],
        cuenta: valores[5],
        banco: valores[6],
        pagos: valores[7],
        medioPago: valores[8],
        herramientas: valores[9],
        equipamiento: valores[10],
      },

      resumen: resumen.rows[0],
      categorias: categorias.rows,
      bancos: bancos.rows,
      mediosPago: mediosPago.rows,
      equipamientos: equipamientos.rows,
      generos: generos.rows,
      edades: edades.rows,

      opcionesFiltros: {
        categorias: opcionesCategorias.rows,
        generos: opcionesGeneros.rows,
        bancos: opcionesBancos.rows,
        mediosPago: opcionesMedios.rows,
        equipamientos: opcionesEquipamientos.rows,
      },
    });

  } catch (error) {
    console.error(
      "Error al obtener métricas:",
      error
    );

    res.status(500).json({
      mensaje: "Error al obtener las métricas",
    });
  }
};

module.exports = {
  obtenerMetricas,
};