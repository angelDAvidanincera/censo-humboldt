import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Metricas() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [filtros, setFiltros] = useState({
  categoria: "",
  genero: "",
  edadMin: "",
  edadMax: "",
  estatus: "",
  cuenta: "",
  banco: "",
  pagos: "",
  medioPago: "",
  herramientas: "",
  equipamiento: "",
});

  useEffect(() => {
  const cargarMetricas = async () => {
    try {
      setCargando(true);
      setError("");

      const parametros = new URLSearchParams();

      Object.entries(filtros).forEach(
        ([clave, valor]) => {
          if (
            valor !== "" &&
            valor !== null &&
            valor !== undefined
          ) {
            parametros.append(clave, valor);
          }
        }
      );

      const query = parametros.toString();

      const url = query
        ? `http://localhost:3000/api/metricas?${query}`
        : "http://localhost:3000/api/metricas";

      const respuesta = await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          "No se pudieron cargar las métricas"
        );
      }

      const resultado = await respuesta.json();

      setDatos(resultado);

    } catch (error) {
      console.error(error);

      setError(
        "No se pudieron cargar las métricas."
      );

    } finally {
      setCargando(false);
    }
  };

  cargarMetricas();

}, [filtros]);

const cambiarFiltro = (campo, valor) => {
  setFiltros((anteriores) => {
    const nuevos = {
      ...anteriores,
      [campo]: valor,
    };

    if (
      campo === "cuenta" &&
      valor === "false"
    ) {
      nuevos.banco = "";
    }

    if (
      campo === "pagos" &&
      valor === "false"
    ) {
      nuevos.medioPago = "";
    }

    if (
      campo === "herramientas" &&
      valor === "false"
    ) {
      nuevos.equipamiento = "";
    }

    return nuevos;
  });
};

const limpiarFiltros = () => {
  setFiltros({
    categoria: "",
    genero: "",
    edadMin: "",
    edadMax: "",
    estatus: "",
    cuenta: "",
    banco: "",
    pagos: "",
    medioPago: "",
    herramientas: "",
    equipamiento: "",
  });
};

  if (cargando) {
    return (
      <section className="tarjeta">
        <p>Cargando métricas...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tarjeta">
        <div className="mensaje-error">
          {error}
        </div>
      </section>
    );
  }

  if (!datos) {
    return null;
  }

  const { resumen } = datos;

  const opcionesFiltros =
  datos.opcionesFiltros || {};

const categoriasFiltro =
  opcionesFiltros.categorias || [];

const generosFiltro =
  opcionesFiltros.generos || [];

const bancosFiltro =
  opcionesFiltros.bancos || [];

const mediosPagoFiltro =
  opcionesFiltros.mediosPago || [];

const equipamientosFiltro =
  opcionesFiltros.equipamientos || [];

  const datosCuenta = [
    {
      nombre: "Con cuenta",
      total: resumen.con_cuenta_bancaria,
    },
    {
      nombre: "Sin cuenta",
      total: resumen.sin_cuenta_bancaria,
    },
  ];

  const datosPagos = [
    {
      nombre: "Sí aceptan",
      total: resumen.acepta_pagos_digitales,
    },
    {
      nombre: "No aceptan",
      total: resumen.no_acepta_pagos_digitales,
    },
  ];

  const datosHerramientas = [
    {
      nombre: "Sí utilizan",
      total: resumen.usa_herramientas,
    },
    {
      nombre: "No utilizan",
      total: resumen.no_usa_herramientas,
    },
  ];

  const datosEstado = [
    {
      nombre: "Activos",
      total: resumen.locales_activos,
    },
    {
      nombre: "Bodega",
      total: resumen.locales_bodega,
    },
    {
      nombre: "Cerrados",
      total: resumen.locales_cerrados,
    },
  ];

  const calcularPorcentaje = (cantidad) => {
    if (!resumen.total_censos) {
      return 0;
    }

    return Math.round(
      (cantidad / resumen.total_censos) * 100
    );
  };

  const renderEtiqueta = ({
  name,
  value,
  percent,
}) => {
  return `${Math.round(percent * 100)}%`;
};

const generarPDF = () => {
  const doc = new jsPDF();

  const total = Number(resumen.total_censos) || 0;
 const filtrosActivos = Object.values(filtros)
  .some((valor) => valor !== "");

const tituloReporte = filtrosActivos
  ? "Reporte filtrado - Censo Humboldt"
  : "Reporte de resultados - Censo Humboldt";

  const porcentaje = (cantidad, base = total) => {
    const cantidadNumero = Number(cantidad) || 0;
    const baseNumero = Number(base) || 0;

    if (baseNumero === 0) {
      return "0%";
    }

    return `${Math.round(
      (cantidadNumero / baseNumero) * 100
    )}%`;
  };

  // ENCABEZADO

  doc.setFontSize(18);
  doc.text(
  tituloReporte,
  14,
  18
);

  doc.setFontSize(10);

  doc.text(
    `Total de censos registrados: ${total}`,
    14,
    27
  );

  doc.text(
    `Fecha de generación: ${new Date().toLocaleDateString(
      "es-MX"
    )}`,
    14,
    33
  );

  const obtenerNombreCategoria = () => {
  const categoria =
    categoriasFiltro.find(
      (item) =>
        String(item.id_categoria) ===
        String(filtros.categoria)
    );

  return categoria
    ? `${categoria.codigo} - ${categoria.nombre}`
    : null;
};

const obtenerNombreMedioPago = () => {
  const medio =
    mediosPagoFiltro.find(
      (item) =>
        String(item.id_medio_pago) ===
        String(filtros.medioPago)
    );

  return medio?.nombre || null;
};

const obtenerNombreEquipamiento = () => {
  const equipo =
    equipamientosFiltro.find(
      (item) =>
        String(item.id_equipamiento) ===
        String(filtros.equipamiento)
    );

  return equipo?.nombre || null;
};

const listaFiltros = [];

if (filtros.categoria) {
  listaFiltros.push([
    "Categoría",
    obtenerNombreCategoria(),
  ]);
}

if (filtros.genero) {
  listaFiltros.push([
    "Género",
    filtros.genero,
  ]);
}

if (filtros.edadMin) {
  listaFiltros.push([
    "Edad mínima",
    filtros.edadMin,
  ]);
}

if (filtros.edadMax) {
  listaFiltros.push([
    "Edad máxima",
    filtros.edadMax,
  ]);
}

if (filtros.estatus) {
  listaFiltros.push([
    "Estado",
    filtros.estatus,
  ]);
}

if (filtros.cuenta) {
  listaFiltros.push([
    "Cuenta bancaria",
    filtros.cuenta === "true"
      ? "Sí"
      : "No",
  ]);
}

if (filtros.banco) {
  listaFiltros.push([
    "Banco",
    filtros.banco,
  ]);
}

if (filtros.pagos) {
  listaFiltros.push([
    "Pagos digitales",
    filtros.pagos === "true"
      ? "Sí"
      : "No",
  ]);
}

if (filtros.medioPago) {
  listaFiltros.push([
    "Medio de pago",
    obtenerNombreMedioPago(),
  ]);
}

if (filtros.herramientas) {
  listaFiltros.push([
    "Herramientas tecnológicas",
    filtros.herramientas === "true"
      ? "Sí"
      : "No",
  ]);
}

if (filtros.equipamiento) {
  listaFiltros.push([
    "Equipamiento",
    obtenerNombreEquipamiento(),
  ]);
}


  // RESUMEN GENERAL

  autoTable(doc, {
    startY: 42,

    head: [
      [
        "Indicador",
        "Registros",
        "Porcentaje",
      ],
    ],

    body: [
      [
        "Total de censos",
        total,
        "100%",
      ],

      [
        "Con cuenta bancaria",
        resumen.con_cuenta_bancaria,
        porcentaje(
          resumen.con_cuenta_bancaria
        ),
      ],

      [
        "Sin cuenta bancaria",
        resumen.sin_cuenta_bancaria,
        porcentaje(
          resumen.sin_cuenta_bancaria
        ),
      ],

      [
        "Aceptan pagos digitales",
        resumen.acepta_pagos_digitales,
        porcentaje(
          resumen.acepta_pagos_digitales
        ),
      ],

      [
        "No aceptan pagos digitales",
        resumen.no_acepta_pagos_digitales,
        porcentaje(
          resumen.no_acepta_pagos_digitales
        ),
      ],

      [
        "Usan herramientas tecnológicas",
        resumen.usa_herramientas,
        porcentaje(
          resumen.usa_herramientas
        ),
      ],

      [
        "No usan herramientas tecnológicas",
        resumen.no_usa_herramientas,
        porcentaje(
          resumen.no_usa_herramientas
        ),
      ],

      [
        "Locales activos",
        resumen.locales_activos,
        porcentaje(
          resumen.locales_activos
        ),
      ],

      [
        "Locales usados como bodega",
        resumen.locales_bodega,
        porcentaje(
          resumen.locales_bodega
        ),
      ],

      [
        "Locales cerrados",
        resumen.locales_cerrados,
        porcentaje(
          resumen.locales_cerrados
        ),
      ],
    ],

    theme: "grid",

    headStyles: {
      fillColor: [23, 76, 60],
    },
  });


  // CATEGORÍAS

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [
      [
        "Categoría",
        "Registros",
        "% del total",
      ],
    ],

    body: datos.categorias.map((item) => [
      `${item.codigo} - ${item.nombre}`,
      item.total,
      porcentaje(item.total),
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [23, 76, 60],
    },
  });


  // INSTITUCIONES BANCARIAS

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [
  [
    "Institución bancaria",
    "Registros",
    "% del total",
  ],
],

body: datos.bancos.map((item) => [
  item.banco,
  item.total,
  porcentaje(item.total),
]),

    theme: "grid",

    headStyles: {
      fillColor: [23, 76, 60],
    },
  });


  // MEDIOS DE PAGO

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [
      [
        "Medio de pago",
        "Registros",
        "% del total",
      ],
    ],

    body: datos.mediosPago.map((item) => [
      item.nombre,
      item.total,
      porcentaje(item.total),
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [23, 76, 60],
    },
  });


  // EQUIPAMIENTO

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [
      [
        "Equipamiento tecnológico",
        "Registros",
        "% del total",
      ],
    ],

    body: datos.equipamientos.map((item) => [
      item.nombre,
      item.total,
      porcentaje(item.total),
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [23, 76, 60],
    },
  });


  // GÉNERO

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [
      [
        "Género",
        "Registros",
        "% del total",
      ],
    ],

    body: datos.generos.map((item) => [
      item.genero,
      item.total,
      porcentaje(item.total),
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [23, 76, 60],
    },
  });


  // NOTA FINAL

  const paginaFinal =
    doc.internal.getNumberOfPages();

  doc.setPage(paginaFinal);

  let posicionFinal =
    doc.lastAutoTable.finalY + 10;

  if (posicionFinal > 270) {
    doc.addPage();
    posicionFinal = 20;
  }

  doc.setFontSize(8);

  doc.text(
    "Nota: un comerciante puede utilizar varios medios de pago y varios tipos de equipamiento, por lo que los porcentajes de esas secciones pueden sumar más de 100%.",
    14,
    posicionFinal,
    {
      maxWidth: 180,
    }
  );

  const fecha = new Date()
  .toISOString()
  .slice(0, 10);

const nombreArchivo = filtrosActivos
  ? `reporte-censo-humboldt-filtrado-${fecha}.pdf`
  : `reporte-censo-humboldt-${fecha}.pdf`;

doc.save(nombreArchivo);

};

  return (
    <div className="metricas">

      <section className="tarjeta">
        <div className="titulo-registros">
  <div>
    <h2>Panel de métricas</h2>

    <p>
      Resumen estadístico de los censos registrados.
    </p>

    <div className="panel-filtros-metricas">

  <div className="encabezado-filtros">
    <div>
      <h3>Filtrar resultados</h3>
      <p>
        Combina uno o varios filtros para analizar
        segmentos específicos del censo.
      </p>
    </div>

    <button
      type="button"
      className="boton-limpiar-filtros"
      onClick={limpiarFiltros}
    >
      Limpiar filtros
    </button>
  </div>


  <div className="grid-filtros">

    {/* CATEGORÍA */}

    <div className="campo">
      <label>Categoría</label>

      <select
        value={filtros.categoria}
        onChange={(e) =>
          cambiarFiltro(
            "categoria",
            e.target.value
          )
        }
      >
        <option value="">
          Todas las categorías
        </option>

        {categoriasFiltro.map((categoria) => (
          <option
            key={categoria.id_categoria}
            value={categoria.id_categoria}
          >
            {categoria.codigo} - {categoria.nombre}
          </option>
        ))}
      </select>
    </div>


    {/* GÉNERO */}

    <div className="campo">
      <label>Género</label>

      <select
        value={filtros.genero}
        onChange={(e) =>
          cambiarFiltro(
            "genero",
            e.target.value
          )
        }
      >
        <option value="">
          Todos los géneros
        </option>

        {generosFiltro.map((item) => (
          <option
            key={item.genero}
            value={item.genero}
          >
            {item.genero}
          </option>
        ))}
      </select>
    </div>


    {/* ESTADO */}

    <div className="campo">
      <label>Estado del local</label>

      <select
        value={filtros.estatus}
        onChange={(e) =>
          cambiarFiltro(
            "estatus",
            e.target.value
          )
        }
      >
        <option value="">
          Todos
        </option>

        <option value="Activo">
          Activo
        </option>

        <option value="Bodega">
          Bodega
        </option>

        <option value="Cerrado">
          Cerrado
        </option>
      </select>
    </div>


    {/* EDAD MÍNIMA */}

    <div className="campo">
      <label>Edad mínima</label>

      <input
        type="number"
        min="0"
        max="120"
        value={filtros.edadMin}
        onChange={(e) =>
          cambiarFiltro(
            "edadMin",
            e.target.value
          )
        }
        placeholder="Ej. 30"
      />
    </div>


    {/* EDAD MÁXIMA */}

    <div className="campo">
      <label>Edad máxima</label>

      <input
        type="number"
        min="0"
        max="120"
        value={filtros.edadMax}
        onChange={(e) =>
          cambiarFiltro(
            "edadMax",
            e.target.value
          )
        }
        placeholder="Ej. 50"
      />
    </div>


    {/* CUENTA BANCARIA */}

    <div className="campo">
      <label>Cuenta bancaria</label>

      <select
        value={filtros.cuenta}
        onChange={(e) =>
          cambiarFiltro(
            "cuenta",
            e.target.value
          )
        }
      >
        <option value="">
          Todos
        </option>

        <option value="true">
          Sí tienen cuenta
        </option>

        <option value="false">
          No tienen cuenta
        </option>
      </select>
    </div>


    {/* BANCO */}

    <div className="campo">
      <label>Institución bancaria</label>

      <select
        value={filtros.banco}
        onChange={(e) =>
          cambiarFiltro(
            "banco",
            e.target.value
          )
        }
        disabled={filtros.cuenta === "false"}
      >
        <option value="">
          Todos los bancos
        </option>

        {bancosFiltro.map((item) => (
          <option
            key={item.banco}
            value={item.banco}
          >
            {item.banco}
          </option>
        ))}
      </select>
    </div>


    {/* PAGOS DIGITALES */}

    <div className="campo">
      <label>Pagos digitales</label>

      <select
        value={filtros.pagos}
        onChange={(e) =>
          cambiarFiltro(
            "pagos",
            e.target.value
          )
        }
      >
        <option value="">
          Todos
        </option>

        <option value="true">
          Sí aceptan
        </option>

        <option value="false">
          No aceptan
        </option>
      </select>
    </div>


    {/* MEDIO DE PAGO */}

    <div className="campo">
      <label>Medio de pago</label>

      <select
        value={filtros.medioPago}
        onChange={(e) =>
          cambiarFiltro(
            "medioPago",
            e.target.value
          )
        }
        disabled={filtros.pagos === "false"}
      >
        <option value="">
          Todos los medios
        </option>

        {mediosPagoFiltro.map((item) => (
          <option
            key={item.id_medio_pago}
            value={item.id_medio_pago}
          >
            {item.nombre}
          </option>
        ))}
      </select>
    </div>


    {/* HERRAMIENTAS */}

    <div className="campo">
      <label>
        Herramientas tecnológicas
      </label>

      <select
        value={filtros.herramientas}
        onChange={(e) =>
          cambiarFiltro(
            "herramientas",
            e.target.value
          )
        }
      >
        <option value="">
          Todos
        </option>

        <option value="true">
          Sí utilizan
        </option>

        <option value="false">
          No utilizan
        </option>
      </select>
    </div>


    {/* EQUIPAMIENTO */}

    <div className="campo">
      <label>Equipamiento</label>

      <select
        value={filtros.equipamiento}
        onChange={(e) =>
          cambiarFiltro(
            "equipamiento",
            e.target.value
          )
        }
        disabled={
          filtros.herramientas === "false"
        }
      >
        <option value="">
          Todos los equipos
        </option>

        {equipamientosFiltro.map((item) => (
          <option
            key={item.id_equipamiento}
            value={item.id_equipamiento}
          >
            {item.nombre}
          </option>
        ))}
      </select>
    </div>
</div>
  </div>
</div>

  <button
    type="button"
    className="boton-pdf"
    onClick={generarPDF}
  >
    Generar PDF
  </button>
</div>
        <div className="metricas-resumen">

          <div className="metrica-card">
            <span>Total censos</span>

            <strong>
              {resumen.total_censos}
            </strong>
          </div>

          <div className="metrica-card">
            <span>Con cuenta bancaria</span>

            <strong>
              {resumen.con_cuenta_bancaria}
            </strong>

            <small>
              {calcularPorcentaje(
                resumen.con_cuenta_bancaria
              )}%
            </small>
          </div>

          <div className="metrica-card">
            <span>Pagos digitales</span>

            <strong>
              {resumen.acepta_pagos_digitales}
            </strong>

            <small>
              {calcularPorcentaje(
                resumen.acepta_pagos_digitales
              )}%
            </small>
          </div>

          <div className="metrica-card">
            <span>Usan herramientas</span>

            <strong>
              {resumen.usa_herramientas}
            </strong>

            <small>
              {calcularPorcentaje(
                resumen.usa_herramientas
              )}%
            </small>
          </div>

          <div className="metrica-card">
            <span>Locales activos</span>

            <strong>
              {resumen.locales_activos}
            </strong>

            <small>
              {calcularPorcentaje(
                resumen.locales_activos
              )}%
            </small>
          </div>

        </div>
      </section>


      <div className="graficas-grid">

        <section className="tarjeta grafica-card">
          <h3>Cuenta bancaria</h3>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={datosCuenta}
                dataKey="total"
                nameKey="nombre"
                outerRadius={90}
                label={renderEtiqueta}
              >
                {datosCuenta.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? "#174c3c" : "#b8c9c2"}
                  />
                ))}
              </Pie>

              <Tooltip />
              
            </PieChart>
          </ResponsiveContainer>
          <div className="leyenda-metricas">
  {datosCuenta.map((item, index) => (
    <div
      className="leyenda-item"
      key={item.nombre}
    >
      <span
        className="leyenda-color"
        style={{
          background:
            index === 0 ? "#174c3c" : "#b8c9c2",
        }}
      />

      <span>
        {item.nombre}: <strong>{item.total}</strong>{" "}
        {item.total === 1 ? "registro" : "registros"}
      </span>
    </div>
  ))}
</div>
        </section>


        <section className="tarjeta grafica-card">
          <h3>Pagos digitales</h3>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={datosPagos}
                dataKey="total"
                nameKey="nombre"
                outerRadius={90}
                label={renderEtiqueta}
              >
                {datosPagos.map((_, index) => (
                  <Cell
                    key={index}
                        fill={index === 0 ? "#174c3c" : "#cfd8d3"}

                  />
                ))}
              </Pie>

              <Tooltip />
              
            </PieChart>
          </ResponsiveContainer>
          <div className="leyenda-metricas">
  {datosPagos.map((item, index) => (
    <div
      className="leyenda-item"
      key={item.nombre}
    >
      <span
        className="leyenda-color"
        style={{
          background:
            index === 0 ? "#174c3c" : "#cfd8d3",
        }}
      />

      <span>
        {item.nombre}: <strong>{item.total}</strong>{" "}
        {item.total === 1 ? "registro" : "registros"}
      </span>
    </div>
  ))}
</div>
        </section>


        <section className="tarjeta grafica-card">
          <h3>Uso de herramientas tecnológicas</h3>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={datosHerramientas}
                dataKey="total"
                nameKey="nombre"
                outerRadius={90}
                label={renderEtiqueta}
              >
                {datosHerramientas.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? "#174c3c" : "#cfd8d3"}
                  />
                ))}
              </Pie>

              <Tooltip />
            
            </PieChart>
          </ResponsiveContainer>
          <div className="leyenda-metricas">
  {datosHerramientas.map((item, index) => (
    <div
      className="leyenda-item"
      key={item.nombre}
    >
      <span
        className="leyenda-color"
        style={{
          background:
            index === 0 ? "#174c3c" : "#cfd8d3",
        }}
      />

      <span>
        {item.nombre}: <strong>{item.total}</strong>{" "}
        {item.total === 1 ? "registro" : "registros"}
      </span>
    </div>
  ))}
</div>
        </section>


        <section className="tarjeta grafica-card">
          <h3>Estado de los locales</h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={datosEstado}>
              <XAxis dataKey="nombre" />
              <YAxis allowDecimals={false} />
              <Tooltip />

              <Bar
                dataKey="total"
                fill="#174c3c"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

      </div>


      <section className="tarjeta">
        <h3>Censos por categoría</h3>

        <div className="grafica-grande">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={datos.categorias}>
              <XAxis
                dataKey="codigo"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip
                formatter={(valor) => [
                  valor,
                  "Censos",
                ]}
                labelFormatter={(codigo) => {
                  const categoria =
                    datos.categorias.find(
                      (item) =>
                        item.codigo === codigo
                    );

                  return categoria
                    ? `${categoria.codigo} - ${categoria.nombre}`
                    : codigo;
                }}
              />

              <Bar
                dataKey="total"
                fill="#174c3c"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>


      <div className="graficas-grid">

        <section className="tarjeta grafica-card">
          <h3>Instituciones bancarias</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datos.bancos}>
              <XAxis
                dataKey="banco"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Bar
                dataKey="total"
                fill="#174c3c"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>


        <section className="tarjeta grafica-card">
          <h3>Género</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datos.generos}>
              <XAxis
                dataKey="genero"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Bar
                dataKey="total"
                fill="#174c3c"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

      </div>


      <section className="tarjeta">
        <h3>Medios de pago utilizados</h3>

        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={datos.mediosPago}>
            <XAxis
              dataKey="nombre"
              interval={0}
              angle={-15}
              textAnchor="end"
              height={80}
            />

            <YAxis
              allowDecimals={false}
            />

            <Tooltip />

            <Bar
              dataKey="total"
              fill="#174c3c"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>


      <section className="tarjeta">
        <h3>Equipamiento tecnológico</h3>

        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={datos.equipamientos}>
            <XAxis
              dataKey="nombre"
              interval={0}
            />

            <YAxis
              allowDecimals={false}
            />

            <Tooltip />

            <Bar
              dataKey="total"
              fill="#174c3c"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>

    </div>
  );
}

export default Metricas;