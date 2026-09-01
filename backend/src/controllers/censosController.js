const pool = require("../database/db");

const crearCenso = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      comerciante,
      censo,
      mediosPago = [],
      equipamientos = [],
    } = req.body;

    await client.query("BEGIN");

    // 1. Crear comerciante
    const comercianteResult = await client.query(
      `
      INSERT INTO comerciantes (
        nombre_completo,
        genero,
        edad,
        telefono,
        correo,
        consentimiento_datos,
        consentimiento_whatsapp,
        consentimiento_verbal,
        fecha_consentimiento,
        notas
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING id_comerciante
      `,
      [
        comerciante.nombre_completo,
        comerciante.genero || null,
        comerciante.edad !== null &&
        comerciante.edad !== undefined &&
        comerciante.edad !== "" ? Number(comerciante.edad) : null,
        comerciante.telefono || null,
        comerciante.correo || null,
        comerciante.consentimiento_datos,
        comerciante.consentimiento_whatsapp ?? null,
        comerciante.consentimiento_verbal ?? null,
        comerciante.fecha_consentimiento || null,
        comerciante.notas || null,
      ]
    );

    const idComerciante =
      comercianteResult.rows[0].id_comerciante;

    // 2. Crear censo
    const censoResult = await client.query(
      `
      INSERT INTO censos (
        fecha_levantamiento,
        mercado,
        numero_local,
        id_comerciante,
        giro_autorizado,
        id_categoria,
        estatus_local,
        tiene_cuenta_bancaria,
        institucion_bancaria,
        acepta_pagos_digitales,
        usa_herramientas_tec,
        nivel_calculado,
        observaciones_cualitativas,
        id_censor,
        firma_locatario
      )
      VALUES (
        COALESCE($1, CURRENT_DATE),
        $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15
      )
      RETURNING id_censo
      `,
      [
        censo.fecha_levantamiento || null,
        censo.mercado,
        censo.numero_local || null,
        idComerciante,
        censo.giro_autorizado || null,
        censo.id_categoria || null,
        censo.estatus_local,
        censo.tiene_cuenta_bancaria,
        censo.tiene_cuenta_bancaria
          ? censo.institucion_bancaria || null
          : null,
        censo.acepta_pagos_digitales,
        censo.usa_herramientas_tec,
        censo.nivel_calculado || null,
        censo.observaciones_cualitativas || null,
        censo.id_censor || null,
        censo.firma_locatario ?? null,
      ]
    );

    const idCenso = censoResult.rows[0].id_censo;

    // 3. Medios de pago
    if (censo.acepta_pagos_digitales) {
      for (const idMedioPago of mediosPago) {
        await client.query(
          `
          INSERT INTO censo_medios_pago (
            id_censo,
            id_medio_pago
          )
          VALUES ($1, $2)
          `,
          [idCenso, idMedioPago]
        );
      }
    }

    // 4. Equipamientos
    if (censo.usa_herramientas_tec) {
      for (const idEquipamiento of equipamientos) {
        await client.query(
          `
          INSERT INTO censo_equipamiento (
            id_censo,
            id_equipamiento
          )
          VALUES ($1, $2)
          `,
          [idCenso, idEquipamiento]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      mensaje: "Censo registrado correctamente",
      idComerciante,
      idCenso,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al crear censo:", error);

    res.status(500).json({
      mensaje: "Error al registrar el censo",
      error: error.message,
    });

  } finally {
    client.release();
  }
};

const obtenerCensos = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        c.id_censo,
        c.fecha_levantamiento,

        co.id_comerciante,
        co.nombre_completo,
        co.genero,
        co.edad,
        co.telefono,
        co.correo,

        c.mercado,
        c.numero_local,
        c.giro_autorizado,

        cg.codigo AS codigo_categoria,
        cg.nombre AS categoria,

        c.estatus_local,

        c.tiene_cuenta_bancaria,
        c.institucion_bancaria,

        c.acepta_pagos_digitales,
        c.usa_herramientas_tec,

        c.observaciones_cualitativas,

        COALESCE(
          STRING_AGG(
            DISTINCT mp.nombre,
            ', '
          ) FILTER (
            WHERE mp.nombre IS NOT NULL
          ),
          ''
        ) AS medios_pago,

        COALESCE(
          STRING_AGG(
            DISTINCT e.nombre,
            ', '
          ) FILTER (
            WHERE e.nombre IS NOT NULL
          ),
          ''
        ) AS equipamientos

      FROM censos c

      INNER JOIN comerciantes co
        ON co.id_comerciante = c.id_comerciante

      LEFT JOIN categorias_giro cg
        ON cg.id_categoria = c.id_categoria

      LEFT JOIN censo_medios_pago cmp
        ON cmp.id_censo = c.id_censo

      LEFT JOIN medios_pago mp
        ON mp.id_medio_pago = cmp.id_medio_pago

      LEFT JOIN censo_equipamiento ce
        ON ce.id_censo = c.id_censo

      LEFT JOIN equipamientos e
        ON e.id_equipamiento = ce.id_equipamiento

      GROUP BY
        c.id_censo,
        co.id_comerciante,
        cg.id_categoria

      ORDER BY c.id_censo DESC
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al obtener censos:", error);

    res.status(500).json({
      mensaje: "Error al obtener los censos",
    });
  }
};

const obtenerCensoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `
      SELECT
        c.id_censo,
        c.fecha_levantamiento,

        co.id_comerciante,
        co.nombre_completo,
        co.genero,
        co.edad,
        co.telefono,
        co.correo,

        c.mercado,
        c.numero_local,
        c.giro_autorizado,
        c.id_categoria,
        c.estatus_local,

        c.tiene_cuenta_bancaria,
        c.institucion_bancaria,

        c.acepta_pagos_digitales,
        c.usa_herramientas_tec,

        c.observaciones_cualitativas,

        COALESCE(
          ARRAY_AGG(DISTINCT cmp.id_medio_pago)
          FILTER (WHERE cmp.id_medio_pago IS NOT NULL),
          '{}'
        ) AS medios_pago_ids,

        COALESCE(
          ARRAY_AGG(DISTINCT ce.id_equipamiento)
          FILTER (WHERE ce.id_equipamiento IS NOT NULL),
          '{}'
        ) AS equipamientos_ids

      FROM censos c

      INNER JOIN comerciantes co
        ON co.id_comerciante = c.id_comerciante

      LEFT JOIN censo_medios_pago cmp
        ON cmp.id_censo = c.id_censo

      LEFT JOIN censo_equipamiento ce
        ON ce.id_censo = c.id_censo

      WHERE c.id_censo = $1

      GROUP BY
        c.id_censo,
        co.id_comerciante
      `,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Censo no encontrado",
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error("Error al obtener censo:", error);

    res.status(500).json({
      mensaje: "Error al obtener el censo",
    });
  }
};

const actualizarCenso = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      comerciante,
      censo,
      mediosPago = [],
      equipamientos = [],
    } = req.body;

    await client.query("BEGIN");

    const buscar = await client.query(
      `
      SELECT id_comerciante
      FROM censos
      WHERE id_censo = $1
      `,
      [id]
    );

    if (buscar.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "Censo no encontrado",
      });
    }

    const idComerciante =
      buscar.rows[0].id_comerciante;

    // 1. Actualizar comerciante

    await client.query(
      `
      UPDATE comerciantes
      SET
        nombre_completo = $1,
        genero = $2,
        edad = $3,
        telefono = $4,
        correo = $5
      WHERE id_comerciante = $6
      `,
      [
        comerciante.nombre_completo,
        comerciante.genero || null,
        comerciante.edad !== null && comerciante.edad !== undefined && comerciante.edad !== ""
          ? Number(comerciante.edad)
          : null,
        comerciante.telefono || null,
        comerciante.correo || null,
        idComerciante,
      ]
    );

    // 2. Actualizar censo

    await client.query(
      `
      UPDATE censos
      SET
        mercado = $1,
        numero_local = $2,
        giro_autorizado = $3,
        id_categoria = $4,
        estatus_local = $5,
        tiene_cuenta_bancaria = $6,
        institucion_bancaria = $7,
        acepta_pagos_digitales = $8,
        usa_herramientas_tec = $9,
        observaciones_cualitativas = $10
      WHERE id_censo = $11
      `,
      [
        censo.mercado,
        censo.numero_local || null,
        censo.giro_autorizado || null,
        censo.id_categoria || null,
        censo.estatus_local,
        censo.tiene_cuenta_bancaria,
        censo.tiene_cuenta_bancaria
          ? censo.institucion_bancaria || null
          : null,
        censo.acepta_pagos_digitales,
        censo.usa_herramientas_tec,
        censo.observaciones_cualitativas || null,
        id,
      ]
    );

    // 3. Eliminar relaciones anteriores

    await client.query(
      `
      DELETE FROM censo_medios_pago
      WHERE id_censo = $1
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM censo_equipamiento
      WHERE id_censo = $1
      `,
      [id]
    );

    // 4. Guardar nuevos medios

    if (censo.acepta_pagos_digitales) {
      for (const idMedio of mediosPago) {
        await client.query(
          `
          INSERT INTO censo_medios_pago (
            id_censo,
            id_medio_pago
          )
          VALUES ($1, $2)
          `,
          [id, idMedio]
        );
      }
    }

    // 5. Guardar nuevos equipos

    if (censo.usa_herramientas_tec) {
      for (const idEquipo of equipamientos) {
        await client.query(
          `
          INSERT INTO censo_equipamiento (
            id_censo,
            id_equipamiento
          )
          VALUES ($1, $2)
          `,
          [id, idEquipo]
        );
      }
    }

    await client.query("COMMIT");

    res.json({
      mensaje: "Censo actualizado correctamente",
      idCenso: id,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al actualizar censo:", error);

    res.status(500).json({
      mensaje: "Error al actualizar el censo",
      error: error.message,
    });

  } finally {
    client.release();
  }
};

module.exports = {
  crearCenso,
  obtenerCensos,
  obtenerCensoPorId,
  actualizarCenso,
};