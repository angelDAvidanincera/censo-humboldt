import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const COLORES = [
  "#174c3c",
  "#287b5c",
  "#49a078",
  "#80bfa1",
  "#a9d6bf",
  "#d0e8db",
];

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin definir";

  return new Date(
    `${fecha}T00:00:00`
  ).toLocaleDateString("es-MX");
};

function ReporteAsistencia({ idCurso, versionDatos = 0 }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // ======================================================
  // CONSULTAR RESUMEN
  // ======================================================

  useEffect(() => {
    if (!idCurso) {
      return;
    }

    let cancelado = false;

    const cargarResumen = async () => {
      try {
        setCargando(true);
        setError("");
        setDatos(null);

        const respuesta = await fetch(
          `http://localhost:3000/api/asistencias/resumen/${idCurso}`
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.mensaje ||
              "No se pudo cargar el resumen"
          );
        }

        if (!cancelado) {
          setDatos(resultado);
        }
      } catch (error) {
        if (!cancelado) {
          setError(error.message);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarResumen();

    return () => {
      cancelado = true;
    };
  }, [idCurso, versionDatos]);

  // ======================================================
  // MÉTRICAS DERIVADAS
  // ======================================================

  const metricas = useMemo(() => {
    if (!datos) {
      return {
        porFecha: [],
        porMercado: [],
        participantes: [],
      };
    }

    const conteoFechas = {};
    const conteoMercados = {};

    for (const participante of datos.participantes) {
      const mercado =
        participante.mercado || "Sin mercado";

      conteoMercados[mercado] =
        (conteoMercados[mercado] || 0) + 1;

      for (const fecha of participante.fechas) {
        conteoFechas[fecha] =
          (conteoFechas[fecha] || 0) + 1;
      }
    }

    const porFecha = Object.entries(conteoFechas)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({
        fecha: formatearFecha(fecha),
        total,
      }));

    const porMercado = Object.entries(conteoMercados)
      .sort((a, b) => b[1] - a[1])
      .map(([mercado, total]) => ({
        mercado,
        total,
      }));

    const participantes = [...datos.participantes]
      .sort(
        (a, b) =>
          b.total_asistencias -
            a.total_asistencias ||
          a.nombre_completo.localeCompare(
            b.nombre_completo,
            "es"
          )
      );

    return {
      porFecha,
      porMercado,
      participantes,
    };
  }, [datos]);

  // ======================================================
  // GENERAR PDF
  // ======================================================

  const generarPDF = () => {
    if (!datos) return;

    const doc = new jsPDF({
      orientation: "landscape",
    });

    const anchoPagina =
      doc.internal.pageSize.getWidth();

    const total = datos.resumen;

    doc.setFontSize(18);
    doc.text(
      "Censo de Mercados",
      14,
      18
    );

    doc.setFontSize(14);
    doc.text(
      "Reporte de asistencia",
      14,
      27
    );

    doc.setFontSize(10);

    const lineasCurso = doc.splitTextToSize(
      `Curso: ${datos.curso.nombre}`,
      anchoPagina - 28
    );

    doc.text(lineasCurso, 14, 36);

    const yPeriodo =
      36 + lineasCurso.length * 5;

    doc.text(
      `Periodo: ${formatearFecha(
        datos.curso.fecha_inicio
      )} - ${formatearFecha(
        datos.curso.fecha_fin
      )}`,
      14,
      yPeriodo
    );

    doc.text(
      `Participantes: ${total.total_participantes}`,
      14,
      yPeriodo + 7
    );

    doc.text(
      `Asistencias registradas: ${total.total_asistencias}`,
      14,
      yPeriodo + 14
    );

    doc.text(
      `Promedio por participante: ${total.promedio_asistencias}`,
      14,
      yPeriodo + 21
    );

    doc.text(
      `Generado: ${new Date().toLocaleDateString(
        "es-MX"
      )}`,
      14,
      yPeriodo + 28
    );

    const filas = metricas.participantes.map(
      (participante, indice) => [
        indice + 1,
        participante.nombre_completo,
        participante.mercado || "Sin mercado",
        participante.telefono || "Sin teléfono",
        participante.total_asistencias,
        participante.fechas.length
          ? participante.fechas
              .map(formatearFecha)
              .join(", ")
          : "Sin asistencias",
      ]
    );

    autoTable(doc, {
      startY: yPeriodo + 36,

      head: [[
        "No.",
        "Participante",
        "Mercado / Plaza",
        "Teléfono",
        "Total",
        "Fechas de asistencia",
      ]],

      body: filas,

      theme: "grid",

      headStyles: {
        fillColor: [23, 76, 60],
      },

      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 50 },
        2: { cellWidth: 48 },
        3: { cellWidth: 31 },
        4: { cellWidth: 16 },
      },

      margin: {
        left: 14,
        right: 14,
      },

      didDrawPage: () => {
        const alto =
          doc.internal.pageSize.getHeight();

        doc.setFontSize(8);

        doc.text(
          `Página ${doc.getNumberOfPages()}`,
          anchoPagina - 14,
          alto - 8,
          { align: "right" }
        );
      },
    });

    const nombreCurso = datos.curso.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const fechaArchivo = new Date()
      .toLocaleDateString("en-CA");

    doc.save(
      `asistencia-${nombreCurso}-${fechaArchivo}.pdf`
    );
  };

  // ======================================================
  // INTERFAZ
  // ======================================================

  if (!idCurso) {
    return (
      <section className="tarjeta">
        <h2>Estadísticas del curso</h2>
        <p>
          Selecciona un curso para ver sus estadísticas.
        </p>
      </section>
    );
  }

  if (cargando) {
    return (
      <section className="tarjeta">
        <p>Cargando estadísticas...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tarjeta">
        <p>{error}</p>
      </section>
    );
  }

  if (!datos) return null;

  return (
    <section className="tarjeta">
      <div className="titulo-seccion">
        <span>3</span>

        <div>
          <h2>Estadísticas del curso</h2>
          <p>{datos.curso.nombre}</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div className="tarjeta">
          <strong>Participantes</strong>
          <h2>
            {datos.resumen.total_participantes}
          </h2>
        </div>

        <div className="tarjeta">
          <strong>Asistencias registradas</strong>
          <h2>
            {datos.resumen.total_asistencias}
          </h2>
        </div>

        <div className="tarjeta">
          <strong>Promedio por participante</strong>
          <h2>
            {datos.resumen.promedio_asistencias}
          </h2>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          marginTop: 30,
        }}
      >
        <div>
          <h3>Asistencias por fecha</h3>

          {metricas.porFecha.length === 0 ? (
            <p>Sin asistencias registradas.</p>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={metricas.porFecha}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 35,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="fecha"
                    angle={-35}
                    textAnchor="end"
                    height={65}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    name="Asistencias"
                    fill="#174c3c"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <h3>Participantes por mercado</h3>

          {metricas.porMercado.length === 0 ? (
            <p>Sin participantes.</p>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={metricas.porMercado}
                    dataKey="total"
                    nameKey="mercado"
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                  >
                    {metricas.porMercado.map(
                      (item, indice) => (
                        <Cell
                          key={item.mercado}
                          fill={
                            COLORES[
                              indice % COLORES.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Asistencias por participante</h3>

        {metricas.participantes.length === 0 ? (
          <p>Sin participantes registrados.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Participante",
                    "Mercado / Plaza",
                    "Total",
                    "Fechas",
                  ].map((columna) => (
                    <th
                      key={columna}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderBottom:
                          "1px solid #ddd",
                      }}
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {metricas.participantes.map(
                  (participante) => (
                    <tr
                      key={
                        participante.id_participante
                      }
                    >
                      <td style={{ padding: 12 }}>
                        {participante.nombre_completo}
                      </td>

                      <td style={{ padding: 12 }}>
                        {participante.mercado ||
                          "Sin mercado"}
                      </td>

                      <td style={{ padding: 12 }}>
                        {
                          participante.total_asistencias
                        }
                      </td>

                      <td style={{ padding: 12 }}>
                        {participante.fechas.length
                          ? participante.fechas
                              .map(formatearFecha)
                              .join(", ")
                          : "Sin asistencias"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className="acciones"
        style={{ marginTop: 25 }}
      >
        <button
          className="boton-guardar"
          onClick={generarPDF}
        >
          Generar reporte PDF
        </button>
      </div>
    </section>
  );
}

export default ReporteAsistencia;