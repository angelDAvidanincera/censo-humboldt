const db = require("../database/sqlite");

// ======================================================
// CREAR CENSO
// ======================================================

const crearCenso = (req, res) => {
  const transaccion = db.transaction((datos) => {
    const {
      comerciante,
      censo,
      mediosPago = [],
      equipamientos = [],
    } = datos;

    // 1. Crear comerciante
    const comercianteResult = db.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      comerciante.nombre_completo,
      comerciante.genero || null,
      comerciante.edad !== null &&
      comerciante.edad !== undefined &&
      comerciante.edad !== ""
        ? Number(comerciante.edad)
        : null,
      comerciante.telefono || null,
      comerciante.correo || null,
      comerciante.consentimiento_datos ? 1 : 0,
      comerciante.consentimiento_whatsapp == null
        ? null
        : comerciante.consentimiento_whatsapp ? 1 : 0,
      comerciante.consentimiento_verbal == null
        ? null
        : comerciante.consentimiento_verbal ? 1 : 0,
      comerciante.fecha_consentimiento || null,
      comerciante.notas || null
    );

    const idComerciante = Number(
      comercianteResult.lastInsertRowid
    );

    // 2. Crear censo
    const censoResult = db.prepare(`
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
        COALESCE(?, CURRENT_DATE),
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      censo.fecha_levantamiento || null,
      censo.mercado,
      censo.numero_local || null,
      idComerciante,
      censo.giro_autorizado || null,
      censo.id_categoria || null,
      censo.estatus_local,
      censo.tiene_cuenta_bancaria ? 1 : 0,
      censo.tiene_cuenta_bancaria
        ? censo.institucion_bancaria || null
        : null,
      censo.acepta_pagos_digitales ? 1 : 0,
      censo.usa_herramientas_tec ? 1 : 0,
      censo.nivel_calculado || null,
      censo.observaciones_cualitativas || null,
      censo.id_censor || null,
      censo.firma_locatario == null
        ? null
        : censo.firma_locatario ? 1 : 0
    );

    const idCenso = Number(censoResult.lastInsertRowid);

    // 3. Medios de pago
    if (censo.acepta_pagos_digitales) {
      const insertarMedio = db.prepare(`
        INSERT INTO censo_medios_pago (
          id_censo,
          id_medio_pago
        )
        VALUES (?, ?)
      `);

      for (const idMedioPago of mediosPago) {
        insertarMedio.run(idCenso, Number(idMedioPago));
      }
    }

    // 4. Equipamientos
    if (censo.usa_herramientas_tec) {
      const insertarEquipo = db.prepare(`
        INSERT INTO censo_equipamiento (
          id_censo,
          id_equipamiento
        )
        VALUES (?, ?)
      `);

      for (const idEquipamiento of equipamientos) {
        insertarEquipo.run(
          idCenso,
          Number(idEquipamiento)
        );
      }
    }

    return {
      idComerciante,
      idCenso,
    };
  });

  try {
    const resultado = transaccion(req.body);

    res.status(201).json({
      mensaje: "Censo registrado correctamente",
      idComerciante: resultado.idComerciante,
      idCenso: resultado.idCenso,
    });
  } catch (error) {
    console.error("Error al crear censo SQLite:", error);

    res.status(500).json({
      mensaje: "Error al registrar el censo",
      error: error.message,
    });
  }
};


// ======================================================
// OBTENER TODOS LOS CENSOS
// ======================================================

const obtenerCensos = (req, res) => {
  try {
    const censos = db.prepare(`
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

        COALESCE((
          SELECT GROUP_CONCAT(nombre, ', ')
          FROM (
            SELECT DISTINCT mp.nombre AS nombre
            FROM censo_medios_pago cmp
            INNER JOIN medios_pago mp
              ON mp.id_medio_pago = cmp.id_medio_pago
            WHERE cmp.id_censo = c.id_censo
            ORDER BY mp.nombre
          )
        ), '') AS medios_pago,

        COALESCE((
          SELECT GROUP_CONCAT(nombre, ', ')
          FROM (
            SELECT DISTINCT e.nombre AS nombre
            FROM censo_equipamiento ce
            INNER JOIN equipamientos e
              ON e.id_equipamiento = ce.id_equipamiento
            WHERE ce.id_censo = c.id_censo
            ORDER BY e.nombre
          )
        ), '') AS equipamientos

      FROM censos c

      INNER JOIN comerciantes co
        ON co.id_comerciante = c.id_comerciante

      LEFT JOIN categorias_giro cg
        ON cg.id_categoria = c.id_categoria

      ORDER BY c.id_censo DESC
    `).all();

    res.json(censos);
  } catch (error) {
    console.error("Error al obtener censos SQLite:", error);

    res.status(500).json({
      mensaje: "Error al obtener los censos",
    });
  }
};


// ======================================================
// OBTENER CENSO POR ID
// ======================================================

const obtenerCensoPorId = (req, res) => {
  try {
    const id = Number(req.params.id);

    const censo = db.prepare(`
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

        c.observaciones_cualitativas

      FROM censos c

      INNER JOIN comerciantes co
        ON co.id_comerciante = c.id_comerciante

      WHERE c.id_censo = ?
    `).get(id);

    if (!censo) {
      return res.status(404).json({
        mensaje: "Censo no encontrado",
      });
    }

    censo.medios_pago_ids = db.prepare(`
      SELECT id_medio_pago
      FROM censo_medios_pago
      WHERE id_censo = ?
      ORDER BY id_medio_pago
    `).all(id).map((fila) => fila.id_medio_pago);

    censo.equipamientos_ids = db.prepare(`
      SELECT id_equipamiento
      FROM censo_equipamiento
      WHERE id_censo = ?
      ORDER BY id_equipamiento
    `).all(id).map((fila) => fila.id_equipamiento);

    res.json(censo);
  } catch (error) {
    console.error(
      "Error al obtener censo SQLite:",
      error
    );

    res.status(500).json({
      mensaje: "Error al obtener el censo",
    });
  }
};


// ======================================================
// ACTUALIZAR CENSO
// ======================================================

const actualizarCenso = (req, res) => {
  const transaccion = db.transaction((id, datos) => {
    const {
      comerciante,
      censo,
      mediosPago = [],
      equipamientos = [],
    } = datos;

    const registro = db.prepare(`
      SELECT id_comerciante
      FROM censos
      WHERE id_censo = ?
    `).get(id);

    if (!registro) {
      const error = new Error("Censo no encontrado");
      error.codigo = "NO_ENCONTRADO";
      throw error;
    }

    const idComerciante = registro.id_comerciante;

    // 1. Comerciante
    db.prepare(`
      UPDATE comerciantes
      SET
        nombre_completo = ?,
        genero = ?,
        edad = ?,
        telefono = ?,
        correo = ?
      WHERE id_comerciante = ?
    `).run(
      comerciante.nombre_completo,
      comerciante.genero || null,
      comerciante.edad !== null &&
      comerciante.edad !== undefined &&
      comerciante.edad !== ""
        ? Number(comerciante.edad)
        : null,
      comerciante.telefono || null,
      comerciante.correo || null,
      idComerciante
    );

    // 2. Censo
    db.prepare(`
      UPDATE censos
      SET
        mercado = ?,
        numero_local = ?,
        giro_autorizado = ?,
        id_categoria = ?,
        estatus_local = ?,
        tiene_cuenta_bancaria = ?,
        institucion_bancaria = ?,
        acepta_pagos_digitales = ?,
        usa_herramientas_tec = ?,
        observaciones_cualitativas = ?
      WHERE id_censo = ?
    `).run(
      censo.mercado,
      censo.numero_local || null,
      censo.giro_autorizado || null,
      censo.id_categoria || null,
      censo.estatus_local,
      censo.tiene_cuenta_bancaria ? 1 : 0,
      censo.tiene_cuenta_bancaria
        ? censo.institucion_bancaria || null
        : null,
      censo.acepta_pagos_digitales ? 1 : 0,
      censo.usa_herramientas_tec ? 1 : 0,
      censo.observaciones_cualitativas || null,
      id
    );

    // 3. Relaciones anteriores
    db.prepare(`
      DELETE FROM censo_medios_pago
      WHERE id_censo = ?
    `).run(id);

    db.prepare(`
      DELETE FROM censo_equipamiento
      WHERE id_censo = ?
    `).run(id);

    // 4. Nuevos medios
    if (censo.acepta_pagos_digitales) {
      const insertarMedio = db.prepare(`
        INSERT INTO censo_medios_pago (
          id_censo,
          id_medio_pago
        )
        VALUES (?, ?)
      `);

      for (const idMedio of mediosPago) {
        insertarMedio.run(id, Number(idMedio));
      }
    }

    // 5. Nuevos equipos
    if (censo.usa_herramientas_tec) {
      const insertarEquipo = db.prepare(`
        INSERT INTO censo_equipamiento (
          id_censo,
          id_equipamiento
        )
        VALUES (?, ?)
      `);

      for (const idEquipo of equipamientos) {
        insertarEquipo.run(id, Number(idEquipo));
      }
    }
  });

  try {
    const id = Number(req.params.id);

    transaccion(id, req.body);

    res.json({
      mensaje: "Censo actualizado correctamente",
      idCenso: id,
    });
  } catch (error) {
    if (error.codigo === "NO_ENCONTRADO") {
      return res.status(404).json({
        mensaje: "Censo no encontrado",
      });
    }

    console.error(
      "Error al actualizar censo SQLite:",
      error
    );

    res.status(500).json({
      mensaje: "Error al actualizar el censo",
      error: error.message,
    });
  }
};


module.exports = {
  crearCenso,
  obtenerCensos,
  obtenerCensoPorId,
  actualizarCenso,
};