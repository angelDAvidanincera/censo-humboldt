import { useEffect, useState } from "react";

function Registros() {
  const [registros, setRegistros] = useState([]);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [registroEditando, setRegistroEditando] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mensajeEdicion, setMensajeEdicion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [equipamientos, setEquipamientos] = useState([]);

  const cargarRegistros = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        "http://localhost:3000/api/censos"
      );

      if (!respuesta.ok) {
        throw new Error("No se pudieron obtener los registros");
      }

      const datos = await respuesta.json();

      setRegistros(datos);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los registros.");
    } finally {
      setCargando(false);
    }
  };

  const cambiarCampoEdicion = (campo, valor) => {
  setRegistroEditando((anterior) => ({
    ...anterior,
    [campo]: valor,
  }));
};

const cambiarSeleccionEdicion = (campo, id) => {
  const idTexto = String(id);

  setRegistroEditando((anterior) => {
    const actuales = anterior[campo] || [];

    const nuevos = actuales.includes(idTexto)
      ? actuales.filter((item) => item !== idTexto)
      : [...actuales, idTexto];

    return {
      ...anterior,
      [campo]: nuevos,
    };
  });
};

  useEffect(() => {
  cargarRegistros();

  Promise.all([
    fetch("http://localhost:3000/api/categorias").then((r) => r.json()),
    fetch("http://localhost:3000/api/medios-pago").then((r) => r.json()),
    fetch("http://localhost:3000/api/equipamientos").then((r) => r.json()),
  ])
    .then(([datosCategorias, datosMedios, datosEquipamientos]) => {
      setCategorias(datosCategorias);
      setMediosPago(datosMedios);
      setEquipamientos(datosEquipamientos);
    })
    .catch((error) => {
      console.error("Error cargando catálogos:", error);
    });
}, []);

const guardarEdicion = async () => {
  if (!registroEditando) return;

  if (!registroEditando.nombre_completo?.trim()) {
    setMensajeEdicion("El nombre es obligatorio.");
    return;
  }

  try {
    setGuardandoEdicion(true);
    setMensajeEdicion("");

    const datos = {
      comerciante: {
        nombre_completo:
          registroEditando.nombre_completo.trim(),

        genero:
          registroEditando.genero || null,
        edad:
  registroEditando.edad !== "" &&
  registroEditando.edad !== null &&
  registroEditando.edad !== undefined
    ? Number(registroEditando.edad)
    : null,

        telefono:
          registroEditando.telefono?.trim() || null,

        correo:
          registroEditando.correo?.trim() || null,
      },

      censo: {
        mercado:
          registroEditando.mercado?.trim(),

        numero_local:
          registroEditando.numero_local?.trim() || null,

        giro_autorizado:
          registroEditando.giro_autorizado?.trim() || null,

        id_categoria:
          registroEditando.id_categoria || null,

        estatus_local:
          registroEditando.estatus_local,

        tiene_cuenta_bancaria:
          registroEditando.tiene_cuenta_bancaria,

        institucion_bancaria:
          registroEditando.tiene_cuenta_bancaria
            ? registroEditando.institucion_bancaria?.trim() || null
            : null,

        acepta_pagos_digitales:
          registroEditando.acepta_pagos_digitales,

        usa_herramientas_tec:
          registroEditando.usa_herramientas_tec,

        observaciones_cualitativas:
          registroEditando.observaciones_cualitativas?.trim() || null,
      },

      mediosPago:
        registroEditando.acepta_pagos_digitales
          ? registroEditando.medios_pago_ids
          : [],

      equipamientos:
        registroEditando.usa_herramientas_tec
          ? registroEditando.equipamientos_ids
          : [],
    };

    const respuesta = await fetch(
      `http://localhost:3000/api/censos/${registroEditando.id_censo}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error ||
        resultado.mensaje ||
        "No se pudo actualizar"
      );
    }

    await cargarRegistros();

    setRegistroEditando(null);

  } catch (error) {
    console.error(error);
    setMensajeEdicion(
      `Error al actualizar: ${error.message}`
    );
  } finally {
    setGuardandoEdicion(false);
  }
};

  const registrosFiltrados = registros.filter((registro) => {
    const texto = busqueda.toLowerCase();

    return (
      registro.nombre_completo
        ?.toLowerCase()
        .includes(texto) ||
      registro.numero_local
        ?.toLowerCase()
        .includes(texto) ||
      registro.giro_autorizado
        ?.toLowerCase()
        .includes(texto) ||
      registro.categoria
        ?.toLowerCase()
        .includes(texto)
    );
  });

  const abrirEdicion = async (idCenso) => {
  try {
    setMensajeEdicion("");

    const respuesta = await fetch(
      `http://localhost:3000/api/censos/${idCenso}`
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el censo");
    }

    const datos = await respuesta.json();

    setRegistroEditando({
      ...datos,

      id_categoria: datos.id_categoria
        ? String(datos.id_categoria)
        : "",

      medios_pago_ids:
        datos.medios_pago_ids?.map(String) || [],

      equipamientos_ids:
        datos.equipamientos_ids?.map(String) || [],
    });

  } catch (error) {
    console.error(error);
    setError("No se pudo abrir el registro para editar.");
  }
};


  if (cargando) {
    return (
      <section className="tarjeta">
        <p>Cargando registros...</p>
      </section>
    );
  }

  return (
    <div>
      <section className="tarjeta">
        <div className="titulo-registros">
          <div>
            <h2>Registros realizados</h2>
            <p>
              {registros.length} censos registrados
            </p>
          </div>

          <button
            className="boton-secundario"
            onClick={cargarRegistros}
          >
            Actualizar
          </button>
        </div>

        <div className="campo">
          <label>Buscar comerciante o local</label>

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, local, giro o categoría..."
          />
        </div>

        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}
      </section>

      {registrosFiltrados.length === 0 ? (
        <section className="tarjeta">
          <p>No se encontraron registros.</p>
        </section>
      ) : (
        <div className="lista-registros">
          {registrosFiltrados.map((registro) => (
            <article
              className="registro-card"
              key={registro.id_censo}
            >
              <div className="registro-encabezado">
                <div>
                  <span className="registro-id">
                    Censo #{registro.id_censo}
                  </span>

                  <h3>
                    {registro.nombre_completo}
                  </h3>

                  <p>
                    {registro.numero_local
                      ? `Local ${registro.numero_local}`
                      : "Local no especificado"}
                    {" · "}
                    {registro.giro_autorizado ||
                      "Giro no especificado"}
                  </p>
                </div>

                <span
                  className={`estado estado-${registro.estatus_local?.toLowerCase()}`}
                >
                  {registro.estatus_local}
                </span>
              </div>

              <div className="registro-datos">
                <div>
                  <strong>Categoría</strong>
                  <span>
                    {registro.codigo_categoria
                      ? `${registro.codigo_categoria} - ${registro.categoria}`
                      : "Sin categoría"}
                  </span>
                </div>

                <div>
  <strong>Edad</strong>

  <span>
    {registro.edad !== null &&
    registro.edad !== undefined
      ? `${registro.edad} años`
      : "No proporcionada"}
  </span>
</div>

                <div>
                  <strong>Teléfono</strong>
                  <span>
                    {registro.telefono || "No proporcionado"}
                  </span>
                </div>

                <div>
                  <strong>Cuenta bancaria</strong>
                  <span>
                    {registro.tiene_cuenta_bancaria
                      ? registro.institucion_bancaria ||
                        "Sí, banco no especificado"
                      : "No"}
                  </span>
                </div>

                <div>
                  <strong>Pagos digitales</strong>
                  <span>
                    {registro.acepta_pagos_digitales
                      ? registro.medios_pago ||
                        "Sí, sin medio especificado"
                      : "No"}
                  </span>
                </div>

                <div>
                  <strong>Equipamiento</strong>
                  <span>
                    {registro.usa_herramientas_tec
                      ? registro.equipamientos ||
                        "Sin equipo especificado"
                      : "No utiliza"}
                  </span>
                </div>

                <div>
                  <strong>Mercado</strong>
                  <span>{registro.mercado}</span>
                </div>
              </div>

              <div className="registro-acciones">
                <button
                  className="boton-ver"
                  type="button" onClick={() => setRegistroSeleccionado(registro)}
                >
                  Ver
                </button>

                <button
                  className="boton-editar"
                  type="button" onClick={() => abrirEdicion(registro.id_censo)}
                >
                  Editar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {registroSeleccionado && (
  <div className="detalle-overlay">

    <div className="detalle-registro">
      <div className="detalle-registro-contenido">

        <div className="detalle-registro-encabezado">
          <div>
            <span>
              Censo #{registroSeleccionado.id_censo}
            </span>

            <h2>
              {registroSeleccionado.nombre_completo}
            </h2>
          </div>

          <button
            type="button"
            className="boton-cerrar"
            onClick={() => setRegistroSeleccionado(null)}
          >
            Cerrar
          </button>
        </div>

        <div className="detalle-grid">

          <div>
            <strong>Género</strong>
            <span>
              {registroSeleccionado.genero || "No proporcionado"}
            </span>
          </div>

          <div>
            <strong>Edad</strong>

              <span>
                {registroSeleccionado.edad !== null && registroSeleccionado.edad !== undefined
                      ? `${registroSeleccionado.edad} años`
                        : "No proporcionada"}
                        </span>
                              </div>

          <div>
            <strong>Teléfono</strong>
            <span>
              {registroSeleccionado.telefono || "No proporcionado"}
            </span>
          </div>

          <div>
            <strong>Correo</strong>
            <span>
              {registroSeleccionado.correo || "No proporcionado"}
            </span>
          </div>

          <div>
            <strong>Mercado</strong>
            <span>{registroSeleccionado.mercado}</span>
          </div>

          <div>
            <strong>Local</strong>
            <span>
              {registroSeleccionado.numero_local || "No especificado"}
            </span>
          </div>

          <div>
            <strong>Giro</strong>
            <span>
              {registroSeleccionado.giro_autorizado || "No especificado"}
            </span>
          </div>

          <div>
            <strong>Categoría</strong>
            <span>
              {registroSeleccionado.codigo_categoria
                ? `${registroSeleccionado.codigo_categoria} - ${registroSeleccionado.categoria}`
                : "Sin categoría"}
            </span>
          </div>

          <div>
            <strong>Estado</strong>
            <span>{registroSeleccionado.estatus_local}</span>
          </div>

          <div>
            <strong>Cuenta bancaria</strong>
            <span>
              {registroSeleccionado.tiene_cuenta_bancaria
                ? registroSeleccionado.institucion_bancaria ||
                  "Sí, banco no especificado"
                : "No"}
            </span>
          </div>

          <div>
            <strong>Pagos digitales</strong>
            <span>
              {registroSeleccionado.acepta_pagos_digitales
                ? registroSeleccionado.medios_pago ||
                  "Sí, sin medio especificado"
                : "No"}
            </span>
          </div>

          <div>
            <strong>Equipamiento</strong>
            <span>
              {registroSeleccionado.usa_herramientas_tec
                ? registroSeleccionado.equipamientos ||
                  "Sin equipo especificado"
                : "No utiliza"}
            </span>
          </div>

          <div className="detalle-completo">
            <strong>Observaciones</strong>
            <span>
              {registroSeleccionado.observaciones_cualitativas ||
                "Sin observaciones"}
            </span>
          </div>

        </div>
      </div>
    </div>

  </div>
)}

{registroEditando && (
  <div className="detalle-overlay">

    <div className="modal-edicion">
      <div className="detalle-registro-contenido">

        <div className="detalle-registro-encabezado">
          <div>
            <span>Censo #{registroEditando.id_censo}</span>
            <h2>Editar registro</h2>
          </div>

          <button
            type="button"
            className="boton-cerrar"
            onClick={() => setRegistroEditando(null)}
          >
            Cerrar
          </button>
        </div>

        <div className="grid-formulario">

          <div className="campo campo-completo">
            <label>Nombre completo *</label>
            <input
              value={registroEditando.nombre_completo || ""}
              onChange={(e) =>
                cambiarCampoEdicion(
                  "nombre_completo",
                  e.target.value
                )
              }
            />
          </div>

          <div className="campo">
            <label>Género</label>
            <select
              value={registroEditando.genero || ""}
              onChange={(e) =>
                cambiarCampoEdicion("genero", e.target.value)
              }
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
              <option value="Prefiere no decir">
                Prefiere no decir
              </option>
            </select>
          </div>

          <div className="campo">
              <label>Edad</label>

                        <input
                      type="number"
                      min="0"
                      max="120"
                        value={registroEditando.edad ?? ""}
                          onChange={(e) =>
                        cambiarCampoEdicion(
                        "edad",
                        e.target.value
                          )
                           }
                            />
                                </div>

          <div className="campo">
            <label>Teléfono</label>
            <input
              value={registroEditando.telefono || ""}
              onChange={(e) =>
                cambiarCampoEdicion("telefono", e.target.value)
              }
            />
          </div>

          <div className="campo campo-completo">
            <label>Correo</label>
            <input
              type="email"
              value={registroEditando.correo || ""}
              onChange={(e) =>
                cambiarCampoEdicion("correo", e.target.value)
              }
            />
          </div>

          <div className="campo">
            <label>Mercado *</label>
            <input
              value={registroEditando.mercado || ""}
              onChange={(e) =>
                cambiarCampoEdicion("mercado", e.target.value)
              }
            />
          </div>

          <div className="campo">
            <label>Número de local</label>
            <input
              value={registroEditando.numero_local || ""}
              onChange={(e) =>
                cambiarCampoEdicion(
                  "numero_local",
                  e.target.value
                )
              }
            />
          </div>

          <div className="campo">
            <label>Giro autorizado</label>
            <input
              value={registroEditando.giro_autorizado || ""}
              onChange={(e) =>
                cambiarCampoEdicion(
                  "giro_autorizado",
                  e.target.value
                )
              }
            />
          </div>

          <div className="campo">
            <label>Categoría</label>
            <select
              value={registroEditando.id_categoria || ""}
              onChange={(e) =>
                cambiarCampoEdicion(
                  "id_categoria",
                  e.target.value
                )
              }
            >
              <option value="">Sin categoría</option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id_categoria}
                  value={String(categoria.id_categoria)}
                >
                  {categoria.codigo} - {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Estado del local</label>
            <select
              value={registroEditando.estatus_local || "Activo"}
              onChange={(e) =>
                cambiarCampoEdicion(
                  "estatus_local",
                  e.target.value
                )
              }
            >
              <option value="Activo">Activo</option>
              <option value="Bodega">Bodega</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

        </div>

        <div className="bloque-pregunta">
          <strong>¿Tiene cuenta bancaria?</strong>

          <div className="opciones-si-no">
            <label>
              <input
                type="radio"
                checked={
                  registroEditando.tiene_cuenta_bancaria === true
                }
                onChange={() =>
                  cambiarCampoEdicion(
                    "tiene_cuenta_bancaria",
                    true
                  )
                }
              />
              Sí
            </label>

            <label>
              <input
                type="radio"
                checked={
                  registroEditando.tiene_cuenta_bancaria === false
                }
                onChange={() =>
                  cambiarCampoEdicion(
                    "tiene_cuenta_bancaria",
                    false
                  )
                }
              />
              No
            </label>
          </div>

          {registroEditando.tiene_cuenta_bancaria && (
            <div className="campo">
              <label>Institución bancaria</label>
              <input
                value={
                  registroEditando.institucion_bancaria || ""
                }
                onChange={(e) =>
                  cambiarCampoEdicion(
                    "institucion_bancaria",
                    e.target.value
                  )
                }
              />
            </div>
          )}
        </div>

        <div className="bloque-pregunta">
          <strong>¿Acepta pagos digitales?</strong>

          <div className="opciones-si-no">
            <label>
              <input
                type="radio"
                checked={
                  registroEditando.acepta_pagos_digitales === true
                }
                onChange={() =>
                  cambiarCampoEdicion(
                    "acepta_pagos_digitales",
                    true
                  )
                }
              />
              Sí
            </label>

            <label>
              <input
                type="radio"
                checked={
                  registroEditando.acepta_pagos_digitales === false
                }
                onChange={() =>
                  cambiarCampoEdicion(
                    "acepta_pagos_digitales",
                    false
                  )
                }
              />
              No
            </label>
          </div>

          {registroEditando.acepta_pagos_digitales && (
            <div className="opciones">
              {mediosPago.map((medio) => (
                <label
                  className="opcion-check"
                  key={medio.id_medio_pago}
                >
                  <input
                    type="checkbox"
                    checked={registroEditando.medios_pago_ids.includes(
                      String(medio.id_medio_pago)
                    )}
                    onChange={() =>
                      cambiarSeleccionEdicion(
                        "medios_pago_ids",
                        medio.id_medio_pago
                      )
                    }
                  />

                  {medio.nombre}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bloque-pregunta">
          <strong>¿Utiliza herramientas tecnológicas?</strong>

          <div className="opciones-si-no">
            <label>
              <input
                type="radio"
                checked={
                  registroEditando.usa_herramientas_tec === true
                }
                onChange={() =>
                  cambiarCampoEdicion(
                    "usa_herramientas_tec",
                    true
                  )
                }
              />
              Sí
            </label>

            <label>
              <input
                type="radio"
                checked={
                  registroEditando.usa_herramientas_tec === false
                }
                onChange={() =>
                  cambiarCampoEdicion(
                    "usa_herramientas_tec",
                    false
                  )
                }
              />
              No
            </label>
          </div>

          {registroEditando.usa_herramientas_tec && (
            <div className="opciones">
              {equipamientos.map((equipo) => (
                <label
                  className="opcion-check"
                  key={equipo.id_equipamiento}
                >
                  <input
                    type="checkbox"
                    checked={registroEditando.equipamientos_ids.includes(
                      String(equipo.id_equipamiento)
                    )}
                    onChange={() =>
                      cambiarSeleccionEdicion(
                        "equipamientos_ids",
                        equipo.id_equipamiento
                      )
                    }
                  />

                  {equipo.nombre}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="campo campo-observaciones">
          <label>Observaciones</label>

          <textarea
            rows="4"
            value={
              registroEditando.observaciones_cualitativas || ""
            }
            onChange={(e) =>
              cambiarCampoEdicion(
                "observaciones_cualitativas",
                e.target.value
              )
            }
          />
        </div>

        {mensajeEdicion && (
          <div className="mensaje-error">
            {mensajeEdicion}
          </div>
        )}

        <div className="acciones">
          <button
            className="boton-guardar"
            type="button"
            disabled={guardandoEdicion}
            onClick={guardarEdicion}
          >
            {guardandoEdicion
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>

      </div>
    </div>
  </div>
)}
</div>
  );
}

export default Registros;