import { useEffect, useState } from "react";
import "./App.css";
import Registros from "./components/Registros";
import Metricas from "./components/Metricas";

const estadoInicial = {
  nombre_completo: "",
  genero: "",
  edad: "",
  telefono: "",
  correo: "",

  mercado: "Mercado Humboldt",
  numero_local: "",
  giro_autorizado: "",
  id_categoria: "",

  estatus_local: "Activo",

  tiene_cuenta_bancaria: null,
  institucion_bancaria: "",

  acepta_pagos_digitales: null,
  usa_herramientas_tec: null,

  observaciones_cualitativas: "",
};

function App() {
  const [formulario, setFormulario] = useState(estadoInicial);
  const [vista, setVista] = useState("nuevo");

  const [categorias, setCategorias] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [equipamientos, setEquipamientos] = useState([]);
  const [mensaje, setMensaje] = useState("");
const [guardando, setGuardando] = useState(false);

  const [mediosSeleccionados, setMediosSeleccionados] =
    useState([]);

  const [equipamientosSeleccionados, setEquipamientosSeleccionados] =
    useState([]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [
          respuestaCategorias,
          respuestaMedios,
          respuestaEquipamientos,
        ] = await Promise.all([
          fetch("http://localhost:3000/api/categorias"),
          fetch("http://localhost:3000/api/medios-pago"),
          fetch("http://localhost:3000/api/equipamientos"),
        ]);

        const categoriasData =
          await respuestaCategorias.json();

        const mediosData =
          await respuestaMedios.json();

        const equipamientosData =
          await respuestaEquipamientos.json();

        setCategorias(categoriasData);
        setMediosPago(mediosData);
        setEquipamientos(equipamientosData);

      } catch (error) {
        console.error(
          "Error al cargar catálogos:",
          error
        );
      }
    };

    cargarCatalogos();
  }, []);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const cambiarBooleano = (campo, valor) => {
    setFormulario({
      ...formulario,
      [campo]: valor,
    });

    if (
      campo === "tiene_cuenta_bancaria" &&
      valor === false
    ) {
      setFormulario((actual) => ({
        ...actual,
        tiene_cuenta_bancaria: false,
        institucion_bancaria: "",
      }));
    }

    if (
      campo === "acepta_pagos_digitales" &&
      valor === false
    ) {
      setMediosSeleccionados([]);
    }

    if (
      campo === "usa_herramientas_tec" &&
      valor === false
    ) {
      setEquipamientosSeleccionados([]);
    }
  };

  const cambiarMedioPago = (id) => {
    setMediosSeleccionados((actuales) => {
      if (actuales.includes(id)) {
        return actuales.filter(
          (elemento) => elemento !== id
        );
      }

      return [...actuales, id];
    });
  };

  const cambiarEquipamiento = (id) => {
    setEquipamientosSeleccionados((actuales) => {
      if (actuales.includes(id)) {
        return actuales.filter(
          (elemento) => elemento !== id
        );
      }

      return [...actuales, id];
    });
  };

  const guardarCenso = async () => {
  setMensaje("");

  // Validaciones básicas
  if (!formulario.nombre_completo.trim()) {
    setMensaje("El nombre del comerciante es obligatorio.");
    return;
  }

  if (
  formulario.edad !== "" &&
  (
    Number(formulario.edad) < 0 ||
    Number(formulario.edad) > 120 ||
    !Number.isInteger(Number(formulario.edad))
  )
) {
  setMensaje(
    "La edad debe ser un número entero entre 0 y 120."
  );
  return;
}

  if (!formulario.mercado.trim()) {
    setMensaje("El mercado es obligatorio.");
    return;
  }

  if (!formulario.estatus_local) {
    setMensaje("Selecciona el estado del local.");
    return;
  }

  if (formulario.tiene_cuenta_bancaria === null) {
    setMensaje("Indica si tiene cuenta bancaria.");
    return;
  }

  if (formulario.acepta_pagos_digitales === null) {
    setMensaje("Indica si acepta pagos digitales.");
    return;
  }

  if (formulario.usa_herramientas_tec === null) {
    setMensaje("Indica si utiliza herramientas tecnológicas.");
    return;
  }

  try {
    setGuardando(true);

    const datos = {
      comerciante: {
        nombre_completo: formulario.nombre_completo.trim(),
        genero: formulario.genero || null,
        edad: formulario.edad !=="" ? Number(formulario.edad) : null,
        telefono: formulario.telefono.trim() || null,
        correo: formulario.correo.trim() || null,

        consentimiento_datos: true,
        consentimiento_whatsapp: null,
        consentimiento_verbal: true,
        fecha_consentimiento: null,
        notas: null,
      },

      censo: {
        mercado: formulario.mercado.trim(),
        numero_local: formulario.numero_local.trim() || null,
        giro_autorizado:
          formulario.giro_autorizado.trim() || null,

        id_categoria:
          formulario.id_categoria || null,

        estatus_local:
          formulario.estatus_local,

        tiene_cuenta_bancaria:
          formulario.tiene_cuenta_bancaria,

        institucion_bancaria:
          formulario.tiene_cuenta_bancaria
            ? formulario.institucion_bancaria.trim() || null
            : null,

        acepta_pagos_digitales:
          formulario.acepta_pagos_digitales,

        usa_herramientas_tec:
          formulario.usa_herramientas_tec,

        nivel_calculado: null,

        observaciones_cualitativas:
          formulario.observaciones_cualitativas.trim() || null,

        id_censor: "CENSOR-01",

        firma_locatario: true,
      },

      mediosPago:
        formulario.acepta_pagos_digitales
          ? mediosSeleccionados
          : [],

      equipamientos:
        formulario.usa_herramientas_tec
          ? equipamientosSeleccionados
          : [],
    };

    const respuesta = await fetch(
      "http://localhost:3000/api/censos",
      {
        method: "POST",
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
        "No se pudo guardar el censo"
      );
    }

    setMensaje(
      `Censo registrado correctamente. ID: ${resultado.idCenso}`
    );

    setFormulario({
      ...estadoInicial,
      mercado: "Mercado Humboldt",
      estatus_local: "Activo",
    });

    setMediosSeleccionados([]);
    setEquipamientosSeleccionados([]);

  } catch (error) {
    console.error("Error al guardar:", error);

    setMensaje(
      `Error al guardar el censo: ${error.message}`
    );

  } finally {
    setGuardando(false);
  }
};

  return (
    <div className="app">

      <header className="encabezado">
        <div>
          <p className="etiqueta">
            Mercado Humboldt
          </p>

          <h1>Censo de Comerciantes</h1>

          <p className="descripcion">
            Sistema de captura de información del
            comerciante y su local.
          </p>
        </div>
      </header>

      <nav className="navegacion-principal">
  <div>
    <button
      className={vista === "nuevo" ? "activo" : ""}
      onClick={() => setVista("nuevo")}
    >
      Nuevo censo
    </button>

    <button
      className={vista === "registros" ? "activo" : ""}
      onClick={() => setVista("registros")}
    >
      Registros
    </button>

    <button
      className={vista === "metricas" ? "activo" : ""}
      onClick={() => setVista("metricas")}
    >
      Métricas
    </button>
  </div>
</nav>

<main className="contenedor">

  {vista === "nuevo" && (
    <>
       <section className="tarjeta">

          <div className="titulo-seccion">
            <span>1</span>

            <div>
              <h2>Datos del comerciante</h2>

              <p>
                Información general del titular del local.
              </p>
            </div>
          </div>

          <div className="grid-formulario">

            <div className="campo campo-completo">
              <label>Nombre completo *</label>

              <input
                name="nombre_completo"
                value={formulario.nombre_completo}
                onChange={cambiarCampo}
                placeholder="Nombre del comerciante"
              />
            </div>

            <div className="campo">
              <label>Género</label>

              <select
                name="genero"
                value={formulario.genero}
                onChange={cambiarCampo}
              >
                <option value="">
                  Seleccionar...
                </option>

                <option value="Masculino">
                  Masculino
                </option>

                <option value="Femenino">
                  Femenino
                </option>

                <option value="Otro">
                  Otro
                </option>

                <option value="Prefiere no decir">
                  Prefiere no decir
                </option>
              </select>
            </div>

            <div className="campo">
  <label>Edad</label>

  <input
    type="number"
    name="edad"
    min="0"
    max="120"
    value={formulario.edad}
    onChange={cambiarCampo}
    placeholder="Ej. 45"
  />
</div>

            <div className="campo">
              <label>Teléfono</label>

              <input
                name="telefono"
                value={formulario.telefono}
                onChange={cambiarCampo}
                placeholder="443 000 0000"
              />
            </div>

            <div className="campo campo-completo">
              <label>Correo electrónico</label>

              <input
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={cambiarCampo}
                placeholder="correo@ejemplo.com"
              />
            </div>

          </div>
        </section>


        {/* DATOS DEL LOCAL */}

        <section className="tarjeta">

          <div className="titulo-seccion">
            <span>2</span>

            <div>
              <h2>Datos del local</h2>

              <p>
                Información comercial del establecimiento.
              </p>
            </div>
          </div>

          <div className="grid-formulario">

            <div className="campo">
              <label>Mercado *</label>

              <input
                name="mercado"
                value={formulario.mercado}
                onChange={cambiarCampo}
              />
            </div>

            <div className="campo">
              <label>Número de local</label>

              <input
                name="numero_local"
                value={formulario.numero_local}
                onChange={cambiarCampo}
                placeholder="Ej. A-15"
              />
            </div>

            <div className="campo">
              <label>Giro autorizado</label>

              <input
                name="giro_autorizado"
                value={formulario.giro_autorizado}
                onChange={cambiarCampo}
                placeholder="Ej. Venta de comida"
              />
            </div>

            <div className="campo">
              <label>Categoría</label>

              <select
                name="id_categoria"
                value={formulario.id_categoria}
                onChange={cambiarCampo}
              >
                <option value="">
                  Seleccionar categoría...
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.id_categoria}
                  >
                    {categoria.codigo} -{" "}
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label>Estado del local *</label>

              <select
                name="estatus_local"
                value={formulario.estatus_local}
                onChange={cambiarCampo}
              >
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

          </div>
        </section>


        {/* INFORMACIÓN DIGITAL */}

        <section className="tarjeta">

          <div className="titulo-seccion">
            <span>3</span>

            <div>
              <h2>Información digital</h2>

              <p>
                Datos bancarios, medios de pago y
                herramientas.
              </p>
            </div>
          </div>


          {/* CUENTA BANCARIA */}

          <div className="bloque-pregunta">

            <strong>
              ¿Tiene cuenta bancaria?
            </strong>

            <div className="opciones-si-no">

              <label>
                <input
                  type="radio"
                  name="cuenta"
                  checked={
                    formulario.tiene_cuenta_bancaria ===
                    true
                  }
                  onChange={() =>
                    cambiarBooleano(
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
                  name="cuenta"
                  checked={
                    formulario.tiene_cuenta_bancaria ===
                    false
                  }
                  onChange={() =>
                    cambiarBooleano(
                      "tiene_cuenta_bancaria",
                      false
                    )
                  }
                />
                No
              </label>

            </div>

            {formulario.tiene_cuenta_bancaria === true && (
              <div className="campo campo-condicional">

                <label>
                  Institución bancaria
                </label>

                <input
                  name="institucion_bancaria"
                  value={
                    formulario.institucion_bancaria
                  }
                  onChange={cambiarCampo}
                  placeholder="Ej. BBVA, Santander..."
                />

              </div>
            )}

          </div>


          {/* PAGOS DIGITALES */}

          <div className="bloque-pregunta">

            <strong>
              ¿Acepta pagos digitales?
            </strong>

            <div className="opciones-si-no">

              <label>
                <input
                  type="radio"
                  name="pagos"
                  checked={
                    formulario.acepta_pagos_digitales ===
                    true
                  }
                  onChange={() =>
                    cambiarBooleano(
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
                  name="pagos"
                  checked={
                    formulario.acepta_pagos_digitales ===
                    false
                  }
                  onChange={() =>
                    cambiarBooleano(
                      "acepta_pagos_digitales",
                      false
                    )
                  }
                />
                No
              </label>

            </div>


            {formulario.acepta_pagos_digitales === true && (
              <div className="opciones">

                {mediosPago.map((medio) => {

                  const id =
                    Number(medio.id_medio_pago);

                  return (
                    <label
                      className="opcion-check"
                      key={medio.id_medio_pago}
                    >
                      <input
                        type="checkbox"
                        checked={
                          mediosSeleccionados.includes(id)
                        }
                        onChange={() =>
                          cambiarMedioPago(id)
                        }
                      />

                      {medio.nombre}

                    </label>
                  );
                })}

              </div>
            )}

          </div>


          {/* HERRAMIENTAS */}

          <div className="bloque-pregunta">

            <strong>
              ¿Utiliza herramientas tecnológicas?
            </strong>

            <div className="opciones-si-no">

              <label>
                <input
                  type="radio"
                  name="herramientas"
                  checked={
                    formulario.usa_herramientas_tec ===
                    true
                  }
                  onChange={() =>
                    cambiarBooleano(
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
                  name="herramientas"
                  checked={
                    formulario.usa_herramientas_tec ===
                    false
                  }
                  onChange={() =>
                    cambiarBooleano(
                      "usa_herramientas_tec",
                      false
                    )
                  }
                />
                No
              </label>

            </div>


            {formulario.usa_herramientas_tec === true && (
              <div className="opciones">

                {equipamientos.map((equipo) => {

                  const id =
                    Number(equipo.id_equipamiento);

                  return (
                    <label
                      className="opcion-check"
                      key={equipo.id_equipamiento}
                    >
                      <input
                        type="checkbox"
                        checked={
                          equipamientosSeleccionados.includes(
                            id
                          )
                        }
                        onChange={() =>
                          cambiarEquipamiento(id)
                        }
                      />

                      {equipo.nombre}

                    </label>
                  );
                })}

              </div>
            )}

          </div>


          <div className="campo campo-observaciones">
            <label>Observaciones</label>

            <textarea
              name="observaciones_cualitativas"
              value={
                formulario.observaciones_cualitativas
              }
              onChange={cambiarCampo}
              rows="4"
              placeholder="Observaciones adicionales..."
            />
          </div>

        </section>

{mensaje && (
  <div className="mensaje-formulario">
    {mensaje}
  </div>
)}
        <div className="acciones">
          <button
  className="boton-guardar"
  onClick={guardarCenso}
  disabled={guardando}
>
  {guardando
    ? "Guardando..."
    : "Guardar censo"}
</button>
        </div>
    </>
  )}

  {vista === "registros" && (
    <Registros />
  )}

  {vista === "metricas" && (
    <Metricas />
  )}

</main>

     
    </div>
  );
}

export default App;