# Censo Humboldt

Sistema para la captura, consulta y análisis de información del **Censo de Comerciantes del Mercado Humboldt**.

El proyecto permite registrar información de los comerciantes y sus locales, consultar y editar los censos realizados, analizar indicadores mediante gráficas y filtros, y generar reportes estadísticos en formato PDF.

## Estado del proyecto

Versión funcional inicial.

El sistema actualmente funciona como una aplicación web local compuesta por un frontend, una API backend y una base de datos PostgreSQL.

## Funcionalidades

- Registro de nuevos censos.
- Consulta de censos registrados.
- Búsqueda de comerciantes y locales.
- Visualización detallada de registros.
- Edición de censos existentes.
- Registro de género y edad del comerciante.
- Clasificación por giro y categoría.
- Estado del local.
- Registro de cuenta e institución bancaria.
- Registro de aceptación de pagos digitales.
- Selección de medios de pago utilizados.
- Registro del uso de herramientas tecnológicas.
- Selección de equipamiento tecnológico.
- Panel de métricas.
- Gráficas estadísticas.
- Filtros combinables por:
  - categoría;
  - género;
  - rango de edad;
  - estado del local;
  - cuenta bancaria;
  - institución bancaria;
  - pagos digitales;
  - medio de pago;
  - herramientas tecnológicas;
  - equipamiento.
- Generación de reportes estadísticos en PDF.

## Tecnologías utilizadas

### Frontend

- React
- Vite
- JavaScript
- Recharts
- jsPDF
- jsPDF AutoTable
- CSS

### Backend

- Node.js
- Express
- PostgreSQL (`pg`)
- CORS
- dotenv
- Nodemon

### Base de datos

- PostgreSQL
- pgAdmin

## Estructura del proyecto

```text
censo-humboldt/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   └── schema.sql
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## Configuración del backend

Crear un archivo `.env` dentro de la carpeta `backend` tomando como referencia `.env.example`.

Ejemplo:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=censo_humboldt
DB_PASSWORD=TU_CONTRASEÑA
DB_PORT=5432
PORT=3000
```

El archivo `.env` contiene información local y credenciales, por lo que no se incluye en el repositorio.

## Base de datos

La estructura actual de PostgreSQL se encuentra respaldada en:

```text
database/schema.sql
```

Este archivo contiene el esquema necesario para reconstruir la estructura de la base de datos.

Los datos reales capturados durante los censos no se incluyen en el repositorio.

## Ejecución durante desarrollo

### Backend

Desde la carpeta raíz:

```bash
cd backend
npm install
npm run dev
```

El backend se ejecuta actualmente en:

```text
http://localhost:3000
```

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrará la dirección local correspondiente, normalmente:

```text
http://localhost:5173
```

## Arquitectura actual

```text
Frontend (React)
       │
       │ HTTP
       ▼
Backend (Node.js + Express)
       │
       ▼
PostgreSQL
```

## Distribución

La versión actual está orientada al desarrollo y ejecución local.

Como siguiente etapa se evaluará la forma de distribución más adecuada para permitir el uso del sistema en otros equipos sin requerir un entorno de desarrollo manual.

Entre las alternativas se encuentran el despliegue como aplicación web y la distribución como aplicación de escritorio, dependiendo de los requisitos de conectividad y operación.

## Seguridad

El repositorio no incluye:

- contraseñas de PostgreSQL;
- archivos `.env`;
- dependencias `node_modules`;
- datos personales capturados durante el censo.

Las variables necesarias para configurar el sistema se documentan mediante `.env.example`.

## Autor

Proyecto desarrollado como sistema de apoyo para el levantamiento y análisis del Censo de Comerciantes del Mercado Humboldt.