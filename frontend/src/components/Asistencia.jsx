import { useEffect, useState } from "react";
import ReporteAsistencia from "./ReporteAsistencia";

function Asistencia() {
  const [cursos, setCursos] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [asistencias, setAsistencias] = useState([]);

  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

const [mercados, setMercados] = useState([]);

const [mostrarNuevoCurso, setMostrarNuevoCurso] =
  useState(false);

const [mostrarNuevoParticipante, setMostrarNuevoParticipante] =
  useState(false);

const [nuevoCurso, setNuevoCurso] = useState({
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
});

const [nuevoParticipante, setNuevoParticipante] = useState({
  nombre_completo: "",
  telefono: "",
  id_mercado: "",
});

const [guardandoCurso, setGuardandoCurso] = useState(false);
const [guardandoParticipante, setGuardandoParticipante] =
  useState(false);

const [historial, setHistorial] = useState(null);
const [cargandoHistorial, setCargandoHistorial] =
  useState(false);

const [resumenCurso, setResumenCurso] = useState(null);
const [mostrarResumen, setMostrarResumen] =
  useState(false);
const [cargandoResumen, setCargandoResumen] =
  useState(false);
  const [versionDatos, setVersionDatos] = useState(0);

  // ======================================================
  // CARGAR CURSOS Y MEERCADOS
  // ======================================================

 useEffect(() => {
  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);

      const [respuestaCursos, respuestaMercados] =
        await Promise.all([
          fetch("http://localhost:3000/api/cursos"),
          fetch("http://localhost:3000/api/mercados"),
        ]);

      if (!respuestaCursos.ok || !respuestaMercados.ok) {
        throw new Error(
          "No se pudieron cargar los datos iniciales"
        );
      }

      const cursosData = await respuestaCursos.json();
      const mercadosData = await respuestaMercados.json();

      setCursos(cursosData);
      setMercados(mercadosData);

      if (cursosData.length > 0) {
        setCursoSeleccionado(
          String(cursosData[0].id_curso)
        );
      }
    } catch (error) {
      console.error(
        "Error al cargar datos iniciales:",
        error
      );

      setMensaje(
        "No se pudieron cargar los cursos y mercados."
      );
    } finally {
      setCargando(false);
    }
  };

  cargarDatosIniciales();
}, []);

  // ======================================================
  // CARGAR PARTICIPANTES DEL CURSO
  // ======================================================

  useEffect(() => {
    if (!cursoSeleccionado) {
      setParticipantes([]);
      return;
    }

    const cargarParticipantes = async () => {
      try {
        setCargando(true);

        const respuesta = await fetch(
          `http://localhost:3000/api/participantes?id_curso=${cursoSeleccionado}`
        );

        if (!respuesta.ok) {
          throw new Error(
            "No se pudieron cargar los participantes"
          );
        }

        const datos = await respuesta.json();

        setParticipantes(datos);

      } catch (error) {
        console.error(
          "Error al cargar participantes:",
          error
        );

        setMensaje(
          "No se pudieron cargar los participantes."
        );

      } finally {
        setCargando(false);
      }
    };

    cargarParticipantes();
  }, [cursoSeleccionado]);

  // ======================================================
  // CARGAR ASISTENCIAS DEL DÍA
  // ======================================================

  useEffect(() => {
    if (!cursoSeleccionado || !fechaSeleccionada) {
      setAsistencias([]);
      return;
    }

    const cargarAsistencias = async () => {
      try {
        const respuesta = await fetch(
          `http://localhost:3000/api/asistencias?id_curso=${cursoSeleccionado}&fecha=${fechaSeleccionada}`
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las asistencias");
        }

        const datos = await respuesta.json();
        setAsistencias(datos);
      } catch (error) {
        console.error(
          "Error al cargar asistencias:",
          error
        );
      }
    };

    cargarAsistencias();
  }, [cursoSeleccionado, fechaSeleccionada]);

  // ======================================================
  // SABER SI YA ASISTIÓ
  // ======================================================

  const tieneAsistencia = (idParticipante) => {
    return asistencias.some(
      (asistencia) =>
        Number(asistencia.id_participante) ===
        Number(idParticipante)
    );
  };

  // ======================================================
  // REGISTRAR ASISTENCIA
  // ======================================================

  const marcarAsistencia = async (participante) => {
    setMensaje("");

    if (!cursoSeleccionado) {
      setMensaje("Selecciona un curso.");
      return;
    }

    if (!fechaSeleccionada) {
      setMensaje("Selecciona una fecha.");
      return;
    }

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/asistencias",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_participante:
              participante.id_participante,
            id_curso: Number(cursoSeleccionado),
            fecha: fechaSeleccionada,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje ||
            "No se pudo registrar la asistencia"
        );
      }

      setAsistencias((actuales) => [
        ...actuales,
        resultado,
      ]);

      setVersionDatos((actual) => actual + 1);

      setMensaje(
        `Asistencia registrada: ${participante.nombre_completo}`
      );
    } catch (error) {
      console.error(
        "Error al registrar asistencia:",
        error
      );

      setMensaje(error.message);
    }
  };

  // ======================================================
// CREAR CURSO
// ======================================================

const crearCurso = async () => {
  setMensaje("");

  if (!nuevoCurso.nombre.trim()) {
    setMensaje("El nombre del curso es obligatorio.");
    return;
  }

  try {
    setGuardandoCurso(true);

    const respuesta = await fetch(
      "http://localhost:3000/api/cursos",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nuevoCurso.nombre.trim(),
          fecha_inicio: nuevoCurso.fecha_inicio || null,
          fecha_fin: nuevoCurso.fecha_fin || null,
        }),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje ||
          "No se pudo crear el curso"
      );
    }

    setCursos((actuales) => [
      resultado,
      ...actuales,
    ]);

    setCursoSeleccionado(
      String(resultado.id_curso)
    );

    setNuevoCurso({
      nombre: "",
      fecha_inicio: "",
      fecha_fin: "",
    });

    setMostrarNuevoCurso(false);

    setMensaje(
      `Curso creado correctamente: ${resultado.nombre}`
    );
  } catch (error) {
    console.error("Error al crear curso:", error);
    setMensaje(error.message);
  } finally {
    setGuardandoCurso(false);
  }
};

// ======================================================
// CREAR PARTICIPANTE
// ======================================================

const crearParticipante = async () => {
  setMensaje("");

  if (!cursoSeleccionado) {
    setMensaje(
      "Selecciona un curso antes de registrar participantes."
    );
    return;
  }

  if (!nuevoParticipante.nombre_completo.trim()) {
    setMensaje(
      "El nombre del participante es obligatorio."
    );
    return;
  }

  try {
    setGuardandoParticipante(true);

    const respuesta = await fetch(
      "http://localhost:3000/api/participantes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_completo:
            nuevoParticipante.nombre_completo.trim(),

          telefono:
            nuevoParticipante.telefono.trim() || null,

          id_mercado:
            nuevoParticipante.id_mercado
              ? Number(nuevoParticipante.id_mercado)
              : null,

          id_curso: Number(cursoSeleccionado),
        }),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje ||
          "No se pudo registrar el participante"
      );
    }

    setParticipantes((actuales) => [
      ...actuales,
      resultado,
    ]);

    setVersionDatos((actual) => actual + 1);

    setNuevoParticipante({
      nombre_completo: "",
      telefono: "",
      id_mercado: "",
    });

    setMostrarNuevoParticipante(false);

    setMensaje(
      `Participante registrado: ${resultado.nombre_completo}`
    );
  } catch (error) {
    console.error(
      "Error al registrar participante:",
      error
    );

    setMensaje(error.message);
  } finally {
    setGuardandoParticipante(false);
  }
};

// ======================================================
// VER HISTORIAL DEL PARTICIPANTE
// ======================================================

const verHistorial = async (participante) => {
  if (!cursoSeleccionado) {
    setMensaje("Selecciona un curso.");
    return;
  }

  try {
    setCargandoHistorial(true);
    setMensaje("");

    const respuesta = await fetch(
      `http://localhost:3000/api/asistencias/participante/${participante.id_participante}?id_curso=${cursoSeleccionado}`
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje ||
          "No se pudo obtener el historial"
      );
    }

    setHistorial(resultado);

  } catch (error) {
    console.error(
      "Error al obtener historial:",
      error
    );

    setMensaje(error.message);

  } finally {
    setCargandoHistorial(false);
  }
};

const cerrarHistorial = () => {
  setHistorial(null);
};

// ======================================================
// RESUMEN DEL CURSO
// ======================================================

const verResumenCurso = async () => {
  if (!cursoSeleccionado) {
    setMensaje("Selecciona un curso.");
    return;
  }

  try {
    setCargandoResumen(true);
    setMensaje("");

    const respuesta = await fetch(
      `http://localhost:3000/api/asistencias/resumen/${cursoSeleccionado}`
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje ||
          "No se pudo obtener el resumen"
      );
    }

    setResumenCurso(resultado);
    setMostrarResumen(true);

  } catch (error) {
    console.error(
      "Error al obtener resumen:",
      error
    );

    setMensaje(error.message);

  } finally {
    setCargandoResumen(false);
  }
};

const cerrarResumen = () => {
  setMostrarResumen(false);
  setResumenCurso(null);
};

  // ======================================================
  // FILTRAR PARTICIPANTES
  // ======================================================

  const participantesFiltrados = participantes.filter(
    (participante) => {
      const texto = busqueda.toLowerCase();

      return (
        participante.nombre_completo
          ?.toLowerCase()
          .includes(texto) ||
        participante.telefono
          ?.toLowerCase()
          .includes(texto) ||
        participante.mercado
          ?.toLowerCase()
          .includes(texto)
      );
    }
  );

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <>
      <section className="tarjeta">
        <div className="titulo-seccion">
          <span>1</span>

          <div>
            <h2>Control de asistencia</h2>
            <p>
              Selecciona el curso y la fecha para registrar
              la asistencia de los participantes.
            </p>
          </div>
        </div>

        <div className="grid-formulario">
          <div className="campo">
            <label>Curso *</label>

            <select
              value={cursoSeleccionado}
              onChange={(e) => {
  setCursoSeleccionado(e.target.value);
  setHistorial(null);
  setMostrarResumen(false);
  setResumenCurso(null);
  setMensaje("");
}
              }
            >
              <option value="">
                Seleccionar curso...
              </option>

              {cursos.map((curso) => (
                <option
                  key={curso.id_curso}
                  value={curso.id_curso}
                >
                  {curso.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Fecha *</label>

            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) =>
                setFechaSeleccionada(e.target.value)
              }
            />
          </div>
        </div>

<div className="acciones">
  <button
    className="boton-guardar"
    onClick={() =>
      setMostrarNuevoCurso(!mostrarNuevoCurso)
    }
  >
    {mostrarNuevoCurso
      ? "Cancelar"
      : "+ Nuevo curso"}
  </button>

  <button
  className="boton-guardar"
  onClick={verResumenCurso}
  disabled={
    !cursoSeleccionado ||
    cargandoResumen
  }
>
  {cargandoResumen
    ? "Cargando..."
    : "Ver resumen del curso"}
</button>
</div>

{mostrarNuevoCurso && (
  <div className="tarjeta" style={{ marginTop: "20px" }}>
    <h3>Crear nuevo curso</h3>

    <div className="grid-formulario">
      <div className="campo campo-completo">
        <label>Nombre del curso *</label>

        <input
          value={nuevoCurso.nombre}
          onChange={(e) =>
            setNuevoCurso({
              ...nuevoCurso,
              nombre: e.target.value,
            })
          }
          placeholder="Ej. Ventas digitales para comerciantes"
        />
      </div>

      <div className="campo">
        <label>Fecha de inicio</label>

        <input
          type="date"
          value={nuevoCurso.fecha_inicio}
          onChange={(e) =>
            setNuevoCurso({
              ...nuevoCurso,
              fecha_inicio: e.target.value,
            })
          }
        />
      </div>

      <div className="campo">
        <label>Fecha de finalización</label>

        <input
          type="date"
          value={nuevoCurso.fecha_fin}
          onChange={(e) =>
            setNuevoCurso({
              ...nuevoCurso,
              fecha_fin: e.target.value,
            })
          }
        />
      </div>
    </div>

    <div className="acciones">
      <button
        className="boton-guardar"
        onClick={crearCurso}
        disabled={guardandoCurso}
      >
        {guardandoCurso
          ? "Guardando..."
          : "Guardar curso"}
      </button>
    </div>
  </div>
)}

      </section>

      <section className="tarjeta">
        <div className="titulo-seccion">
          <span>2</span>

          <div>
            <h2>Participantes</h2>
            <p>
              Busca al participante y registra su
              asistencia.
            </p>
          </div>
        </div>

        <div className="campo campo-completo">
          <label>Buscar participante</label>

          <input
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            placeholder="Nombre, teléfono o mercado..."
          />
        </div>

        <div className="acciones">
  <button
    className="boton-guardar"
    onClick={() =>
      setMostrarNuevoParticipante(
        !mostrarNuevoParticipante
      )
    }
    disabled={!cursoSeleccionado}
  >
    {mostrarNuevoParticipante
      ? "Cancelar"
      : "+ Nuevo participante"}
  </button>
</div>

{mostrarNuevoParticipante && (
  <div className="tarjeta" style={{ marginTop: "20px" }}>
    <h3>Registrar participante</h3>

    <p>
      El participante será registrado en el curso
      actualmente seleccionado.
    </p>

    <div className="grid-formulario">
      <div className="campo campo-completo">
        <label>Nombre completo *</label>

        <input
          value={nuevoParticipante.nombre_completo}
          onChange={(e) =>
            setNuevoParticipante({
              ...nuevoParticipante,
              nombre_completo: e.target.value,
            })
          }
          placeholder="Nombre del participante"
        />
      </div>

      <div className="campo">
        <label>Teléfono</label>

        <input
          value={nuevoParticipante.telefono}
          onChange={(e) =>
            setNuevoParticipante({
              ...nuevoParticipante,
              telefono: e.target.value,
            })
          }
          placeholder="443 000 0000"
        />
      </div>

      <div className="campo">
        <label>Mercado / Plaza</label>

        <select
          value={nuevoParticipante.id_mercado}
          onChange={(e) =>
            setNuevoParticipante({
              ...nuevoParticipante,
              id_mercado: e.target.value,
            })
          }
        >
          <option value="">
            Seleccionar mercado...
          </option>

          {mercados.map((mercado) => (
            <option
              key={mercado.id_mercado}
              value={mercado.id_mercado}
            >
              {mercado.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="acciones">
      <button
        className="boton-guardar"
        onClick={crearParticipante}
        disabled={guardandoParticipante}
      >
        {guardandoParticipante
          ? "Guardando..."
          : "Registrar participante"}
      </button>
    </div>
  </div>
)}

        {mensaje && (
          <div className="mensaje-formulario">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <p>Cargando participantes...</p>
        ) : participantesFiltrados.length === 0 ? (
          <p>No se encontraron participantes.</p>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {participantesFiltrados.map(
              (participante) => {
                const asistio = tieneAsistencia(
                  participante.id_participante
                );

                return (
                  <div
                    key={participante.id_participante}
                    style={{
                      padding: "16px 0",
                      borderBottom: "1px solid #ddd",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <strong>
                        {participante.nombre_completo}
                      </strong>

                      <div>
                        {participante.mercado ||
                          "Sin mercado"}
                      </div>

                      {participante.telefono && (
                        <div>
                          {participante.telefono}
                        </div>
                      )}
                    </div>

                    <div
  style={{
    display: "flex",
    gap: "10px",
    alignItems: "center",
  }}
>
  <button
    className="boton-guardar"
    onClick={() =>
      verHistorial(participante)
    }
    disabled={cargandoHistorial}
  >
    Ver historial
  </button>

  <button
    className="boton-guardar"
    disabled={asistio}
    onClick={() =>
      marcarAsistencia(participante)
    }
  >
    {asistio
      ? "Asistencia registrada ✓"
      : "Marcar asistencia"}
  </button>
</div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      <ReporteAsistencia
  idCurso={cursoSeleccionado}
  versionDatos={versionDatos}
/>


{historial && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 1000,
    }}
  >
    <div
      className="tarjeta"
      style={{
        width: "100%",
        maxWidth: "650px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div className="titulo-seccion">
        <span>✓</span>

        <div>
          <h2>Historial de asistencia</h2>

          <p>
            Registro de fechas de asistencia del
            participante.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>
          {historial.participante.nombre_completo}
        </h3>

        <p>
          <strong>Mercado / Plaza:</strong>{" "}
          {historial.participante.mercado ||
            "Sin mercado"}
        </p>

        {historial.participante.telefono && (
          <p>
            <strong>Teléfono:</strong>{" "}
            {historial.participante.telefono}
          </p>
        )}

        <p>
          <strong>Total de asistencias:</strong>{" "}
          {historial.total_asistencias}
        </p>
      </div>

      <div style={{ marginTop: "25px" }}>
        <h3>Fechas registradas</h3>

        {historial.asistencias.length === 0 ? (
          <p>
            Este participante todavía no tiene
            asistencias registradas en este curso.
          </p>
        ) : (
          <div>
            {historial.asistencias.map(
              (asistencia) => (
                <div
                  key={asistencia.id_asistencia}
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      "1px solid #e0e0e0",
                  }}
                >
                  ✓{" "}
                  {new Date(
                    `${asistencia.fecha}T00:00:00`
                  ).toLocaleDateString("es-MX")}
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="acciones">
        <button
          className="boton-guardar"
          onClick={cerrarHistorial}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

{mostrarResumen && resumenCurso && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 1000,
    }}
  >
    <div
      className="tarjeta"
      style={{
        width: "100%",
        maxWidth: "900px",
        maxHeight: "85vh",
        overflowY: "auto",
      }}
    >
      <div className="titulo-seccion">
        <span>R</span>

        <div>
          <h2>Resumen de asistencia</h2>

          <p>
            {resumenCurso.curso.nombre}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "15px",
          marginTop: "25px",
        }}
      >
        <div className="tarjeta">
          <strong>Participantes</strong>

          <div
            style={{
              fontSize: "28px",
              marginTop: "8px",
            }}
          >
            {
              resumenCurso.resumen
                .total_participantes
            }
          </div>
        </div>

        <div className="tarjeta">
          <strong>Asistencias registradas</strong>

          <div
            style={{
              fontSize: "28px",
              marginTop: "8px",
            }}
          >
            {
              resumenCurso.resumen
                .total_asistencias
            }
          </div>
        </div>

        <div className="tarjeta">
          <strong>
            Promedio por participante
          </strong>

          <div
            style={{
              fontSize: "28px",
              marginTop: "8px",
            }}
          >
            {
              resumenCurso.resumen
                .promedio_asistencias
            }
          </div>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Participantes</h3>

        {resumenCurso.participantes.length ===
        0 ? (
          <p>
            No hay participantes registrados
            en este curso.
          </p>
        ) : (
          resumenCurso.participantes.map(
            (participante) => (
              <div
                key={
                  participante.id_participante
                }
                style={{
                  padding: "18px 0",
                  borderBottom:
                    "1px solid #ddd",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "20px",
                  }}
                >
                  <div>
                    <strong>
                      {
                        participante.nombre_completo
                      }
                    </strong>

                    <div>
                      {participante.mercado ||
                        "Sin mercado"}
                    </div>

                    {participante.telefono && (
                      <div>
                        {participante.telefono}
                      </div>
                    )}
                  </div>

                  <div>
                    <strong>
                      {
                        participante.total_asistencias
                      }{" "}
                      asistencias
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <strong>Fechas:</strong>{" "}

                  {participante.fechas.length ===
                  0
                    ? "Sin asistencias"
                    : participante.fechas
                        .map((fecha) =>
                          new Date(
                            `${fecha}T00:00:00`
                          ).toLocaleDateString(
                            "es-MX"
                          )
                        )
                        .join(", ")}
                </div>
              </div>
            )
          )
        )}
      </div>

      <div className="acciones">
        <button
          className="boton-guardar"
          onClick={cerrarResumen}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}


    </>
  );
}

export default Asistencia;