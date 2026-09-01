--
-- PostgreSQL database dump
--

\restrict ZV94o6IZdzwZkFKnJYoFr2PghaQkB12dzmYpBJ5u7SjhOSCEhaN8ZA2ts3sWCDl

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-09-01 09:45:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 44028)
-- Name: bitacora_abordaje; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bitacora_abordaje (
    id_bitacora bigint NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    censor character varying(100),
    zona_pasillo character varying(150),
    abordados integer DEFAULT 0 NOT NULL,
    aceptaron integer DEFAULT 0 NOT NULL,
    motivo_no_participa text,
    observaciones text,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_abordados_no_negativos CHECK ((abordados >= 0)),
    CONSTRAINT chk_aceptaron_menor_igual_abordados CHECK ((aceptaron <= abordados)),
    CONSTRAINT chk_aceptaron_no_negativos CHECK ((aceptaron >= 0))
);


ALTER TABLE public.bitacora_abordaje OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 44027)
-- Name: bitacora_abordaje_id_bitacora_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.bitacora_abordaje ALTER COLUMN id_bitacora ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bitacora_abordaje_id_bitacora_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 43949)
-- Name: categorias_giro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias_giro (
    id_categoria bigint NOT NULL,
    codigo character varying(5) NOT NULL,
    nombre character varying(100) NOT NULL
);


ALTER TABLE public.categorias_giro OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 43948)
-- Name: categorias_giro_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.categorias_giro ALTER COLUMN id_categoria ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.categorias_giro_id_categoria_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 44012)
-- Name: censo_equipamiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.censo_equipamiento (
    id_censo bigint NOT NULL,
    id_equipamiento bigint NOT NULL
);


ALTER TABLE public.censo_equipamiento OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 43997)
-- Name: censo_medios_pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.censo_medios_pago (
    id_censo bigint NOT NULL,
    id_medio_pago bigint NOT NULL
);


ALTER TABLE public.censo_medios_pago OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 43975)
-- Name: censos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.censos (
    id_censo bigint NOT NULL,
    fecha_levantamiento date DEFAULT CURRENT_DATE NOT NULL,
    mercado character varying(100) NOT NULL,
    numero_local character varying(30),
    id_comerciante bigint NOT NULL,
    giro_autorizado character varying(150),
    id_categoria bigint,
    estatus_local character varying(20) NOT NULL,
    tiene_cuenta_bancaria boolean NOT NULL,
    institucion_bancaria character varying(100),
    acepta_pagos_digitales boolean NOT NULL,
    usa_herramientas_tec boolean NOT NULL,
    nivel_calculado character varying(30),
    observaciones_cualitativas text,
    id_censor character varying(50),
    firma_locatario boolean,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_banco_condicional CHECK (((tiene_cuenta_bancaria = true) OR (institucion_bancaria IS NULL))),
    CONSTRAINT chk_estatus_local CHECK (((estatus_local)::text = ANY ((ARRAY['Activo'::character varying, 'Bodega'::character varying, 'Cerrado'::character varying])::text[]))),
    CONSTRAINT chk_nivel_digital CHECK (((nivel_calculado IS NULL) OR ((nivel_calculado)::text = ANY ((ARRAY['N0 Analógico'::character varying, 'N1 Conectado'::character varying, 'N2 Presente'::character varying, 'N3 Operando'::character varying])::text[]))))
);


ALTER TABLE public.censos OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 43974)
-- Name: censos_id_censo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.censos ALTER COLUMN id_censo ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.censos_id_censo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 43939)
-- Name: comerciantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comerciantes (
    id_comerciante bigint NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    genero character varying(30),
    telefono character varying(20),
    correo character varying(150),
    consentimiento_datos boolean NOT NULL,
    consentimiento_whatsapp boolean,
    consentimiento_verbal boolean,
    fecha_consentimiento date,
    notas text,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    edad smallint,
    CONSTRAINT chk_edad CHECK (((edad IS NULL) OR ((edad >= 0) AND (edad <= 120)))),
    CONSTRAINT chk_genero CHECK (((genero IS NULL) OR ((genero)::text = ANY ((ARRAY['Masculino'::character varying, 'Femenino'::character varying, 'Otro'::character varying, 'Prefiere no decir'::character varying])::text[]))))
);


ALTER TABLE public.comerciantes OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 43938)
-- Name: comerciantes_id_comerciante_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.comerciantes ALTER COLUMN id_comerciante ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.comerciantes_id_comerciante_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 43967)
-- Name: equipamientos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipamientos (
    id_equipamiento bigint NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.equipamientos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 43966)
-- Name: equipamientos_id_equipamiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.equipamientos ALTER COLUMN id_equipamiento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.equipamientos_id_equipamiento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 43959)
-- Name: medios_pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medios_pago (
    id_medio_pago bigint NOT NULL,
    nombre character varying(80) NOT NULL
);


ALTER TABLE public.medios_pago OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 43958)
-- Name: medios_pago_id_medio_pago_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.medios_pago ALTER COLUMN id_medio_pago ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.medios_pago_id_medio_pago_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4766 (class 2606 OID 44041)
-- Name: bitacora_abordaje bitacora_abordaje_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bitacora_abordaje
    ADD CONSTRAINT bitacora_abordaje_pkey PRIMARY KEY (id_bitacora);


--
-- TOC entry 4746 (class 2606 OID 43955)
-- Name: categorias_giro categorias_giro_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_giro
    ADD CONSTRAINT categorias_giro_codigo_key UNIQUE (codigo);


--
-- TOC entry 4748 (class 2606 OID 43957)
-- Name: categorias_giro categorias_giro_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_giro
    ADD CONSTRAINT categorias_giro_nombre_key UNIQUE (nombre);


--
-- TOC entry 4750 (class 2606 OID 43953)
-- Name: categorias_giro categorias_giro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_giro
    ADD CONSTRAINT categorias_giro_pkey PRIMARY KEY (id_categoria);


--
-- TOC entry 4760 (class 2606 OID 43986)
-- Name: censos censos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censos
    ADD CONSTRAINT censos_pkey PRIMARY KEY (id_censo);


--
-- TOC entry 4744 (class 2606 OID 43947)
-- Name: comerciantes comerciantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciantes
    ADD CONSTRAINT comerciantes_pkey PRIMARY KEY (id_comerciante);


--
-- TOC entry 4756 (class 2606 OID 43973)
-- Name: equipamientos equipamientos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipamientos
    ADD CONSTRAINT equipamientos_nombre_key UNIQUE (nombre);


--
-- TOC entry 4758 (class 2606 OID 43971)
-- Name: equipamientos equipamientos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipamientos
    ADD CONSTRAINT equipamientos_pkey PRIMARY KEY (id_equipamiento);


--
-- TOC entry 4752 (class 2606 OID 43965)
-- Name: medios_pago medios_pago_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medios_pago
    ADD CONSTRAINT medios_pago_nombre_key UNIQUE (nombre);


--
-- TOC entry 4754 (class 2606 OID 43963)
-- Name: medios_pago medios_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medios_pago
    ADD CONSTRAINT medios_pago_pkey PRIMARY KEY (id_medio_pago);


--
-- TOC entry 4764 (class 2606 OID 44016)
-- Name: censo_equipamiento pk_censo_equipamiento; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censo_equipamiento
    ADD CONSTRAINT pk_censo_equipamiento PRIMARY KEY (id_censo, id_equipamiento);


--
-- TOC entry 4762 (class 2606 OID 44001)
-- Name: censo_medios_pago pk_censo_medios_pago; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censo_medios_pago
    ADD CONSTRAINT pk_censo_medios_pago PRIMARY KEY (id_censo, id_medio_pago);


--
-- TOC entry 4771 (class 2606 OID 44017)
-- Name: censo_equipamiento fk_ce_censo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censo_equipamiento
    ADD CONSTRAINT fk_ce_censo FOREIGN KEY (id_censo) REFERENCES public.censos(id_censo) ON DELETE CASCADE;


--
-- TOC entry 4772 (class 2606 OID 44022)
-- Name: censo_equipamiento fk_ce_equipamiento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censo_equipamiento
    ADD CONSTRAINT fk_ce_equipamiento FOREIGN KEY (id_equipamiento) REFERENCES public.equipamientos(id_equipamiento);


--
-- TOC entry 4767 (class 2606 OID 43992)
-- Name: censos fk_censo_categoria; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censos
    ADD CONSTRAINT fk_censo_categoria FOREIGN KEY (id_categoria) REFERENCES public.categorias_giro(id_categoria);


--
-- TOC entry 4768 (class 2606 OID 43987)
-- Name: censos fk_censo_comerciante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censos
    ADD CONSTRAINT fk_censo_comerciante FOREIGN KEY (id_comerciante) REFERENCES public.comerciantes(id_comerciante);


--
-- TOC entry 4769 (class 2606 OID 44002)
-- Name: censo_medios_pago fk_cmp_censo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censo_medios_pago
    ADD CONSTRAINT fk_cmp_censo FOREIGN KEY (id_censo) REFERENCES public.censos(id_censo) ON DELETE CASCADE;


--
-- TOC entry 4770 (class 2606 OID 44007)
-- Name: censo_medios_pago fk_cmp_medio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.censo_medios_pago
    ADD CONSTRAINT fk_cmp_medio FOREIGN KEY (id_medio_pago) REFERENCES public.medios_pago(id_medio_pago);


-- Completed on 2026-09-01 09:45:16

--
-- PostgreSQL database dump complete
--

\unrestrict ZV94o6IZdzwZkFKnJYoFr2PghaQkB12dzmYpBJ5u7SjhOSCEhaN8ZA2ts3sWCDl

