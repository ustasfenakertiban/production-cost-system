--
-- PostgreSQL database dump
--

\restrict moN9UPhGTj58q2j4V9ZOASksI1NrixSE9u8oAguDTP1E2klzcAqZu4OaBB0sa7R

-- Dumped from database version 17.6 (Ubuntu 17.6-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6 (Debian 17.6-2.pgdg12+1)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ChainType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChainType" AS ENUM (
    'ONE_TIME',
    'PER_UNIT'
);


--
-- Name: ExpensePeriod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExpensePeriod" AS ENUM (
    'DAY',
    'WEEK',
    'MONTH',
    'QUARTER',
    'YEAR'
);


--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentType" AS ENUM (
    'HOURLY',
    'PIECE_RATE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: employee_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_roles (
    id text NOT NULL,
    name text NOT NULL,
    "paymentType" public."PaymentType" NOT NULL,
    "hourlyRate" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id text NOT NULL,
    name text NOT NULL,
    "estimatedCost" double precision NOT NULL,
    "hourlyDepreciation" double precision NOT NULL,
    "maxProductivity" double precision,
    "productivityUnits" text,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: material_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.material_categories (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL,
    unit text NOT NULL,
    cost double precision NOT NULL,
    "vatPercentage" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    comment text
);


--
-- Name: operation_chains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_chains (
    id text NOT NULL,
    "processId" text NOT NULL,
    name text NOT NULL,
    "chainType" public."ChainType" NOT NULL,
    "orderIndex" integer DEFAULT 1 NOT NULL,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "estimatedQuantity" integer
);


--
-- Name: operation_equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_equipment (
    id text NOT NULL,
    "operationId" text NOT NULL,
    "equipmentId" text NOT NULL,
    "machineTime" double precision NOT NULL,
    "machineTimeSeconds" double precision,
    "piecesPerHour" double precision,
    "hourlyRate" double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    variance double precision,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "requiresContinuousOperation" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: operation_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_materials (
    id text NOT NULL,
    "operationId" text NOT NULL,
    "materialId" text NOT NULL,
    quantity double precision NOT NULL,
    "quantityPerHour" double precision,
    "unitPrice" double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    variance double precision,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: operation_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_roles (
    id text NOT NULL,
    "operationId" text NOT NULL,
    "roleId" text NOT NULL,
    "timeSpent" double precision NOT NULL,
    "timeSpentSeconds" double precision,
    "piecesPerHour" double precision,
    "paymentType" public."PaymentType" NOT NULL,
    rate double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    variance double precision,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "requiresContinuousPresence" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: operation_template_equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_template_equipment (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "equipmentId" text NOT NULL,
    "machineTime" double precision NOT NULL,
    "machineTimeSeconds" double precision,
    "piecesPerHour" double precision,
    "hourlyRate" double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    variance double precision,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "requiresContinuousOperation" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: operation_template_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_template_materials (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "materialId" text NOT NULL,
    quantity double precision NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    variance double precision,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: operation_template_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_template_roles (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "roleId" text NOT NULL,
    "timeSpent" double precision NOT NULL,
    "timeSpentSeconds" double precision,
    "piecesPerHour" double precision,
    "paymentType" public."PaymentType" NOT NULL,
    rate double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    variance double precision,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "requiresContinuousPresence" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: operation_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    comment text,
    enabled boolean DEFAULT true NOT NULL,
    "estimatedProductivityPerHour" double precision,
    "estimatedProductivityPerHourVariance" double precision,
    "cycleHours" double precision,
    "minimumBatchSize" integer DEFAULT 1,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "productionProcessId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    name text NOT NULL,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: production_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_operations (
    id text NOT NULL,
    "chainId" text NOT NULL,
    name text NOT NULL,
    description text,
    comment text,
    "orderIndex" integer NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "estimatedProductivityPerHour" double precision,
    "estimatedProductivityPerHourVariance" double precision,
    "cycleHours" double precision,
    "operationDuration" double precision,
    "minimumBatchSize" integer DEFAULT 1,
    "cycleName" text,
    "cyclesPerHour" double precision,
    "itemsPerCycle" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: production_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_processes (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    description text,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "imagePath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id text NOT NULL,
    name text NOT NULL,
    period public."ExpensePeriod" NOT NULL,
    amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: verificationtokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificationtokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fa62f56e-95b8-459d-a90b-9d34b5281f58	e9aa378e6e10ab85aa7c55a26f5039814dbd7e84551d23118b0c5a3b738f1189	\N	20251002141359_add_continuous_resource_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251002141359_add_continuous_resource_fields\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "operation_equipment" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"operation_equipment\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(636), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251002141359_add_continuous_resource_fields"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251002141359_add_continuous_resource_fields"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:225	\N	2025-10-05 23:09:08.023817+00	0
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: employee_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_roles (id, name, "paymentType", "hourlyRate", "createdAt", "updatedAt") FROM stdin;
cmgbz5xoy0000wfg0ob19kneq	Маляр	HOURLY	500	2025-10-04 07:51:58.93	2025-10-04 07:51:58.93
cmgbz6g5f0001wfg0nxrmgsic	Эмальер	HOURLY	300	2025-10-04 07:52:22.851	2025-10-04 07:52:22.851
cmgbz6ndh0002wfg0ltqizr0g	Раскладчик	HOURLY	300	2025-10-04 07:52:32.214	2025-10-04 07:52:32.214
cmgbz7hk70003wfg03i93hkwn	Литейщик металла на центробежке	HOURLY	400	2025-10-04 07:53:11.335	2025-10-04 07:53:55.755
cmgbz8pik0005wfg067ru5xmf	Директор	HOURLY	1000	2025-10-04 07:54:08.3	2025-10-04 07:54:08.3
cmgbz97cv0006wfg039x76fxu	Менеджер по общению с клиентами	HOURLY	500	2025-10-04 07:54:31.423	2025-10-04 07:54:31.423
cmgbz9eqm0007wfg0k1tcpauf	Менеджер по закупкам	HOURLY	300	2025-10-04 07:54:40.99	2025-10-04 07:54:49.728
cmgbzacwg0008wfg0mu3jj259	Изготовитель силиконовых форм	HOURLY	500	2025-10-04 07:55:25.264	2025-10-04 07:55:25.264
cmgbzau290009wfg0ako445vn	Галтовщик	HOURLY	300	2025-10-04 07:55:47.505	2025-10-04 07:55:47.505
cmgbzb6fk000awfg0ed7353uw	Изгибальщик	HOURLY	300	2025-10-04 07:56:03.536	2025-10-04 07:56:03.536
cmgbzbsqj000bwfg0fhwxi1tl	Упаковщик	HOURLY	300	2025-10-04 07:56:32.443	2025-10-04 07:56:32.443
cmgbz859g0004wfg022ri6pqh	3д моделлер, дизайнер	HOURLY	50	2025-10-04 07:53:42.052	2025-10-05 07:52:44.767
cmgden6s10004psfw3f3baczn	Печатник 3д печати	HOURLY	500	2025-10-05 07:53:04.273	2025-10-05 07:53:04.273
cmgecqn4q000iw390vqjcpxrz	Гриндеровщик	HOURLY	300	2025-10-05 23:47:32.379	2025-10-05 23:47:32.379
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment (id, name, "estimatedCost", "hourlyDepreciation", "maxProductivity", "productivityUnits", comment, "createdAt", "updatedAt") FROM stdin;
cmgc0dk2e0006wf506dgzkzg2	Общая электрика	300000	30	\N	\N	Всю базовую структуру электрики мы провели и должны ее улучшать и чинить, поэтому нужна амортизация	2025-10-04 08:25:54.134	2025-10-04 08:26:31.199
cmgc0er3z0007wf50gdn3gav6	Лазер CO2 большой	360000	123.29	\N	\N	\N	2025-10-04 08:26:49.919	2025-10-04 08:32:06.532
cmgc0c46t0005wf50imv5kakb	Компрессор красный	50000	17.12	\N	\N	\N	2025-10-04 08:24:46.889	2025-10-04 08:32:14.615
cmgc0b5gj0004wf50yqn5zojc	Пистолет окрасочный Walcom Slim Kombat	30000	10.27	\N	\N	\N	2025-10-04 08:24:01.891	2025-10-04 08:32:21.742
cmgc09s1z0003wf50oan75j3k	Печь сушильная Abat ШЖЭ-3	100000	34.25	\N	\N	\N	2025-10-04 08:22:57.863	2025-10-04 08:32:27.671
cmgc090rz0002wf509b0jrm7d	Печь сушильная большая	80000	27.4	\N	\N	\N	2025-10-04 08:22:22.512	2025-10-04 08:32:32.846
cmgc08czl0001wf50bvx2yy82	Покрасочная камера с водяной завесой	130000	44.52	\N	\N	\N	2025-10-04 08:21:51.681	2025-10-04 08:32:38.229
cmgc07o160000wf50tpejqq12	Печь плавки металла для центробежного литья	100000	34.25	\N	\N	\N	2025-10-04 08:21:19.338	2025-10-04 08:32:43.598
cmgbzct6o000cwfg0nmbychet	Литейная машина центробежная	300000	102.74	\N	\N	\N	2025-10-04 07:57:19.68	2025-10-04 08:32:48.627
cmgc0vukd0008wf503okl02dw	Уф принтер Linkprint	1890000	647.26	4	м2/час	\N	2025-10-04 08:40:07.536	2025-10-04 08:40:07.536
cmgc0xzmv0000s1g05hlllq7r	Принтер Phrozen Sonic mini 8k	80000	27.4	\N	\N	\N	2025-10-04 08:41:47.431	2025-10-04 08:41:47.431
cmgc0yjny0001s1g0crllakhz	Уф дозасветка	25000	8.56	\N	\N	\N	2025-10-04 08:42:13.39	2025-10-04 08:42:13.39
cmgc0z3rd0002s1g0remj2txr	Чпу гриндер	60000	20.55	\N	\N	\N	2025-10-04 08:42:39.433	2025-10-04 08:42:39.433
cmgc131xz0003s1g0f3w5gc5u	Аппарат для заливки смолы	10000	3.42	\N	\N	\N	2025-10-04 08:45:43.691	2025-10-04 08:45:43.691
cmgc13gej0004s1g0j8khpskg	Пресс вулканизатор для центробежного литья	60000	20.55	\N	\N	\N	2025-10-04 08:46:02.444	2025-10-04 08:46:02.444
cmgc13xmz0005s1g0svwt5qxw	Пресс изгибатель	50000	17.12	\N	\N	\N	2025-10-04 08:46:24.779	2025-10-04 08:46:24.779
cmgc14hvk0006s1g07utmryga	Пресс "оконный" 3 тонны	80000	27.4	\N	\N	\N	2025-10-04 08:46:51.008	2025-10-04 08:46:51.008
cmgc14rsm0007s1g0ahtfudri	Кондиционер в эмальерошной	30000	10.27	\N	\N	\N	2025-10-04 08:47:03.862	2025-10-04 08:47:03.862
cmgc154xt0008s1g0ygz2et1l	Вытяжка в эмальерошной	8000	2.74	\N	\N	\N	2025-10-04 08:47:20.898	2025-10-04 08:47:20.898
cmgc15n4f0009s1g091yqnbb9	Вытяжка для пластизоля	30000	10.27	\N	\N	\N	2025-10-04 08:47:44.463	2025-10-04 08:47:44.463
cmgc165cb000as1g0q9ja9lzo	Печь для пластизоля	35000	11.99	\N	\N	\N	2025-10-04 08:48:08.075	2025-10-04 08:48:08.075
cmgc17eqi000bs1g0c6mh2yzg	Компрессор винтовой 	100000	34.25	\N	\N	\N	2025-10-04 08:49:06.906	2025-10-04 08:49:06.906
cmgc17vz1000cs1g0wlgg636r	Аппарат вакуумной металлизации	2000000	684.93	\N	\N	\N	2025-10-04 08:49:29.245	2025-10-04 09:00:06.122
cmgdel4uw0002psfwcby7mrvx	ультразвуковая ванная	10000	3.42	\N	\N	\N	2025-10-05 07:51:28.469	2025-10-05 07:51:28.469
cmgdels1i0003psfwy4bw95ag	Компьютер большой	100000	34.25	\N	\N	\N	2025-10-05 07:51:58.517	2025-10-05 07:51:58.517
cmgecv3mb000ow390amhppb90	Галтовочные камни	15000	44.52	\N	\N	\N	2025-10-05 23:51:00.37	2025-10-05 23:51:00.37
cmgecuqr7000nw390nhigqdma	Галтовка ТурбоШлиф	130000	44.52	\N	\N	\N	2025-10-05 23:50:43.698	2025-10-05 23:51:08.284
cmgecxqnz000rw390llhg8exn	Печь для галтовки	30000	10.27	\N	\N	\N	2025-10-05 23:53:03.551	2025-10-05 23:53:03.551
\.


--
-- Data for Name: material_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.material_categories (id, name, "createdAt", "updatedAt") FROM stdin;
cmgc2ojvo0000umfyu1expr5z	Металлы	2025-10-04 09:30:26.34	2025-10-04 09:30:26.34
cmgc2vowg0007umfylh2dyw35	Лаки и краски	2025-10-04 09:35:59.44	2025-10-04 09:35:59.44
cmgdeobze0005psfwqgrohfqo	Фотополимеры и пластика для 3д печати	2025-10-05 07:53:57.674	2025-10-05 07:53:57.674
cmgdeqgt20008psfw8pjcj6qb	Наборы аксессуаров	2025-10-05 07:55:37.224	2025-10-05 07:55:37.224
cmgdf9kdb001epsfwfzkassff	Коммуналка	2025-10-05 08:10:28.32	2025-10-05 08:10:28.32
cmgdgtbp20000t8tzzazmhe32	Разбавители и растворители	2025-10-05 08:53:49.814	2025-10-05 08:53:49.814
cmged991w0002smfzme099qsg	Прочее	2025-10-06 00:02:00.596	2025-10-06 00:02:00.596
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materials (id, name, "categoryId", unit, cost, "vatPercentage", "createdAt", "updatedAt", comment) FROM stdin;
cmgc2u0670006umfywzg5wq9k	Металл гарт	cmgc2ojvo0000umfyu1expr5z	кг	360	0	2025-10-04 09:34:40.735	2025-10-04 09:34:40.735	\N
cmgc2w2ui000bumfy2oymiwww	Лак автомобильный ARP	cmgc2vowg0007umfylh2dyw35	кг	2100	0	2025-10-04 09:36:17.514	2025-10-04 09:36:17.514	\N
cmgdeosbo0007psfwlupmumwp	Фотополимер Phrozen TR300	cmgdeobze0005psfwqgrohfqo	литр	10000	0	2025-10-05 07:54:18.852	2025-10-05 07:54:18.852	\N
cmgdernp1000apsfwnkdy34zy	Набор для 3д печати: перчатки, воронка, спирт 150 гр, стакан	cmgdeqgt20008psfw8pjcj6qb	1 набор	65	0	2025-10-05 07:56:32.821	2025-10-05 07:56:32.821	\N
cmgdf99h2001dpsfwb70krorh	Набор для доработки мастер моделей	cmgdeqgt20008psfw8pjcj6qb		30	0	2025-10-05 08:10:14.198	2025-10-05 08:10:14.198	смазка, наждачки
cmgdev81v000cpsfwfazkg0c0	Электроэнергия	cmgdf9kdb001epsfwfzkassff	кВт/ч	11	20	2025-10-05 07:59:19.171	2025-10-05 08:10:33.595	\N
cmgdgu22v0002t8tzri0sszng	Спирт изопропиловый	cmgdgtbp20000t8tzzazmhe32	литр	300	0	2025-10-05 08:54:24.007	2025-10-05 08:54:24.007	\N
cmgdi20cb0010t8tzir76g8q1	Набор резчика формы	cmgdeqgt20008psfw8pjcj6qb	1 набор	20	0	2025-10-05 09:28:34.604	2025-10-05 09:28:34.604	скальпель, ножи
cmgdi4rye0014t8tz7cpwaeww	Набор для подготовки к вулканизации формы	cmgdeqgt20008psfw8pjcj6qb		200	0	2025-10-05 09:30:43.718	2025-10-05 09:30:43.718	замки
cmgecq0d9000hw390ui3phj8n	Набор для чпу гриндера: лента, ролики, подшипники и т.д.	cmgdeqgt20008psfw8pjcj6qb	1 набор	40	0	2025-10-05 23:47:02.877	2025-10-05 23:47:02.877	\N
cmgecyudp000uw390jy1ca6rs	Вода холодная	cmgdf9kdb001epsfwfzkassff	куб.м.	160	20	2025-10-05 23:53:55.021	2025-10-05 23:53:55.021	\N
cmged9ctk0004smfzrrrko4ux	Набор для центробежного литья	cmged991w0002smfzme099qsg	1 набор	700	0	2025-10-06 00:02:05.48	2025-10-06 00:02:05.48	тальк перчатки
\.


--
-- Data for Name: operation_chains; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_chains (id, "processId", name, "chainType", "orderIndex", comment, enabled, "createdAt", "updatedAt", "estimatedQuantity") FROM stdin;
cmgc2ze4q000gumfyc33p7b8a	cmgc2yc04000eumfyzmbx37h1	Изготовление формы	ONE_TIME	1	\N	t	2025-10-04 09:38:52.107	2025-10-04 09:38:52.107	60000
cmgdljgp50001p6lwug7575ji	cmgc2yc04000eumfyzmbx37h1	Изготовление изделий	PER_UNIT	2	\N	t	2025-10-05 11:06:07.818	2025-10-05 11:06:07.818	\N
cmgdlk0aq0003p6lwm3xih9ez	cmgc2yc04000eumfyzmbx37h1	Подготовка	ONE_TIME	1	\N	t	2025-10-05 11:06:33.218	2025-10-05 11:06:33.218	1
\.


--
-- Data for Name: operation_equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_equipment (id, "operationId", "equipmentId", "machineTime", "machineTimeSeconds", "piecesPerHour", "hourlyRate", "totalCost", variance, comment, enabled, "requiresContinuousOperation", "createdAt", "updatedAt") FROM stdin;
cmgdhp1jy000it8tz8um7twe7	cmgdhnxs0000gt8tznxsygb6l	cmgdels1i0003psfwy4bw95ag	0.2	720	5	34.25	6.850000000000001	\N	\N	t	t	2025-10-05 09:18:29.663	2025-10-05 09:18:29.663
cmgdhpw5y000kt8tzz6qkaue4	cmgdhnxs0000gt8tznxsygb6l	cmgc0vukd0008wf503okl02dw	0.2	720	5	647.26	129.452	\N	\N	t	t	2025-10-05 09:19:09.334	2025-10-05 09:19:09.334
cmgdhwcob000ut8tzd1t7kaf5	cmgdhv3rh000qt8tz59u0sv3v	cmgc13gej0004s1g0j8khpskg	4	14400	0.25	20.55	82.2	\N	\N	t	t	2025-10-05 09:24:10.667	2025-10-05 09:26:09.408
cmgdieppn001et8tzi5uj0k51	cmgdi953k0018t8tzrfrrd73m	cmgbzct6o000cwfg0nmbychet	8	28800	0.13	102.74	821.92	\N	\N	t	t	2025-10-05 09:38:27.372	2025-10-05 09:42:59.442
cmgdifjrq001gt8tzblzarc40	cmgdi953k0018t8tzrfrrd73m	cmgc07o160000wf50tpejqq12	8	28800	0.13	34.25	274	\N	\N	t	t	2025-10-05 09:39:06.326	2025-10-05 09:43:10.612
cmgdig6y6001it8tzp27ewwk3	cmgdi953k0018t8tzrfrrd73m	cmgc0c46t0005wf50imv5kakb	8	28800	0.13	17.12	136.96	\N	\N	t	t	2025-10-05 09:39:36.365	2025-10-05 09:43:25.65
cmgdexyx2000gpsfwzq90z872	cmgdejkag0001psfwdpgrtgm9	cmgdels1i0003psfwy4bw95ag	3	10800	0.33	34.25	102.75	30	\N	t	t	2025-10-05 08:01:27.302	2025-10-05 08:01:48.632
cmgdf2198000qpsfww3p7lv8c	cmgdezfti000kpsfwfe7xv9ms	cmgc0xzmv0000s1g05hlllq7r	18	64800	0.06	27.4	493.2	\N	\N	t	t	2025-10-05 08:04:36.956	2025-10-05 08:04:36.956
cmgdf2gxp000spsfwtbnyjw14	cmgdezfti000kpsfwfe7xv9ms	cmgdel4uw0002psfwcby7mrvx	0.15	540	6.67	3.42	0.513	\N	\N	t	t	2025-10-05 08:04:57.277	2025-10-05 08:04:57.277
cmgdf41h8000upsfwce4t36ax	cmgdezfti000kpsfwfe7xv9ms	cmgc0yjny0001s1g0crllakhz	13	46800	0.08	8.56	111.28	\N	\N	t	t	2025-10-05 08:06:10.556	2025-10-05 08:06:10.556
cmgdgzvzq0006t8tzz6z7o7hi	cmgdf7dt6001bpsfww3cm2nwx	cmgdel4uw0002psfwcby7mrvx	0.03	108	33.33	3.42	0.1026	\N	\N	t	t	2025-10-05 08:58:56.055	2025-10-05 08:58:56.055
cmgdh0vav0008t8tz1a2bzhr1	cmgdf7dt6001bpsfww3cm2nwx	cmgc09s1z0003wf50oan75j3k	1.5	5400	0.67	34.25	51.375	\N	\N	t	t	2025-10-05 08:59:41.815	2025-10-05 08:59:41.815
cmgdh1f3s000at8tztgu9606l	cmgdf7dt6001bpsfww3cm2nwx	cmgc0yjny0001s1g0crllakhz	0.166667	600	6	8.56	1.42666952	\N	\N	t	t	2025-10-05 09:00:07.48	2025-10-05 09:00:07.48
cmgecg78q0005w3902nr4pg3v	cmgdlw7sl0001p651jrni9e5r	cmgbzct6o000cwfg0nmbychet	0.001667	6	600	102.74	0.17126758	20	\N	t	t	2025-10-05 23:39:25.226	2025-10-05 23:39:52.086
cmgech7w50007w390i2kfhqwi	cmgdlw7sl0001p651jrni9e5r	cmgc07o160000wf50tpejqq12	0.001667	6	600	34.25	0.05709475	20	\N	t	t	2025-10-05 23:40:12.725	2025-10-05 23:40:30.049
cmgecif730009w3900wci0isg	cmgdlw7sl0001p651jrni9e5r	cmgc0c46t0005wf50imv5kakb	0.000139	0.5	7200	17.12	0.00237968	\N	\N	t	f	2025-10-05 23:41:08.846	2025-10-05 23:41:08.846
cmgecnj7f000fw3901mdo4lcv	cmgdlwzmr0003p651x777zfgx	cmgc0z3rd0002s1g0remj2txr	0.001667	6	600	20.55	0.03425685000000001	20	\N	t	t	2025-10-05 23:45:07.323	2025-10-05 23:45:07.323
cmged1zzb000yw3903qfyfh59	cmgdmq1h40001p6vfwa9ndvf5	cmgecuqr7000nw390nhigqdma	0.000833	3	1200	44.52	0.03708516	\N	\N	t	f	2025-10-05 23:56:22.247	2025-10-05 23:56:22.247
cmged2gaj0010w390t7ob06sd	cmgdmq1h40001p6vfwa9ndvf5	cmgecxqnz000rw390llhg8exn	0.001667	6	600	10.27	0.01712009	10	\N	t	t	2025-10-05 23:56:43.385	2025-10-05 23:56:43.385
cmged33v90012w390yj35q439	cmgdmq1h40001p6vfwa9ndvf5	cmgecv3mb000ow390amhppb90	0.000833	3	1200	44.52	0.03708516	\N	\N	t	f	2025-10-05 23:57:13.941	2025-10-05 23:57:13.941
\.


--
-- Data for Name: operation_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_materials (id, "operationId", "materialId", quantity, "quantityPerHour", "unitPrice", "totalCost", variance, comment, enabled, "createdAt", "updatedAt") FROM stdin;
cmgdhqnwy000mt8tzgm4kk2df	cmgdhnxs0000gt8tznxsygb6l	cmgdev81v000cpsfwfazkg0c0	1	\N	11	11	\N	\N	t	2025-10-05 09:19:45.298	2025-10-05 09:19:45.298
cmgdhvuwa000st8tzb3j4z4np	cmgdhv3rh000qt8tz59u0sv3v	cmgdev81v000cpsfwfazkg0c0	10	\N	11	110	\N	\N	t	2025-10-05 09:23:47.627	2025-10-05 09:25:58.809
cmgdi2t4i0012t8tz9a3jv5w8	cmgdhxw0e000yt8tzpio97ner	cmgdi20cb0010t8tzir76g8q1	2	\N	20	40	\N	\N	t	2025-10-05 09:29:11.922	2025-10-05 09:29:11.922
cmgdibez3001at8tzf3q702ky	cmgdi953k0018t8tzrfrrd73m	cmgdev81v000cpsfwfazkg0c0	50	\N	11	550	\N	\N	t	2025-10-05 09:35:53.488	2025-10-05 09:42:40.551
cmgdicm8j001ct8tzw60imp51	cmgdi953k0018t8tzrfrrd73m	cmgdi20cb0010t8tzir76g8q1	2	\N	20	40	\N	\N	t	2025-10-05 09:36:49.556	2025-10-05 09:42:47.479
cmgdeytpq000ipsfwch9pclry	cmgdejkag0001psfwdpgrtgm9	cmgdev81v000cpsfwfazkg0c0	1.5	\N	11	16.5	30	\N	t	2025-10-05 08:02:07.215	2025-10-05 08:02:07.215
cmgdf06wo000mpsfw1ez92dzq	cmgdezfti000kpsfwfe7xv9ms	cmgdeosbo0007psfwlupmumwp	0.15	\N	10000	1500	\N	печатаем комплект на 2 формы (это примерно 3 печати)	t	2025-10-05 08:03:10.968	2025-10-05 08:03:10.968
cmgdf0flj000opsfw5rjik21b	cmgdezfti000kpsfwfe7xv9ms	cmgdernp1000apsfwnkdy34zy	3	\N	65	195	\N	печатаем комплект на 2 формы (это примерно 3 печати)	t	2025-10-05 08:03:22.231	2025-10-05 08:03:28.926
cmgdf51sx000wpsfw8gf0p6j0	cmgdezfti000kpsfwfe7xv9ms	cmgdev81v000cpsfwfazkg0c0	9	\N	11	99	\N	\N	t	2025-10-05 08:06:57.633	2025-10-05 08:06:57.633
cmgdgvkpn0004t8tz3p5x0k9b	cmgdf7dt6001bpsfww3cm2nwx	cmgdgu22v0002t8tzri0sszng	0.1	\N	300	30	\N	\N	t	2025-10-05 08:55:34.811	2025-10-05 08:55:34.811
cmgdgagiz0001t8440mp5tj47	cmgdf7dt6001bpsfww3cm2nwx	cmgdf99h2001dpsfwb70krorh	1	\N	30	30	\N	\N	t	2025-10-05 08:39:09.611	2025-10-05 08:56:40.394
cmgdhi3z3000et8tzm8hr6x5x	cmgdf7dt6001bpsfww3cm2nwx	cmgdev81v000cpsfwfazkg0c0	3.5	\N	11	38.5	\N	\N	t	2025-10-05 09:13:06.207	2025-10-05 09:13:06.207
cmgecdefk0001w390d4l6n7hk	cmgdlw7sl0001p651jrni9e5r	cmgc2u0670006umfywzg5wq9k	0.004	2	360	1.44	\N	\N	t	2025-10-05 23:37:14.577	2025-10-05 23:37:14.577
cmgeceg7w0003w390fe0of02h	cmgdlw7sl0001p651jrni9e5r	cmgdev81v000cpsfwfazkg0c0	0.01	5	11	0.11	10	\N	t	2025-10-05 23:38:03.548	2025-10-05 23:38:55.425
cmgeclnvk000dw39023wxuz33	cmgdlwzmr0003p651x777zfgx	cmgdev81v000cpsfwfazkg0c0	0.0007	0.4	11	0.0077	20	\N	t	2025-10-05 23:43:40.064	2025-10-05 23:43:40.064
cmgecskq6000kw390hgnnh3ed	cmgdlwzmr0003p651x777zfgx	cmgecq0d9000hw390ui3phj8n	0.001	0.6	40	0.04	\N	\N	t	2025-10-05 23:49:02.575	2025-10-05 23:49:38.062
cmged0e8q000ww390tym9f20z	cmgdmq1h40001p6vfwa9ndvf5	cmgecyudp000uw390jy1ca6rs	0	0.06	160	0	\N	\N	t	2025-10-05 23:55:07.417	2025-10-05 23:55:07.417
cmgecwyck000qw390a3tslz2c	cmgdmq1h40001p6vfwa9ndvf5	cmgdev81v000cpsfwfazkg0c0	0.0025	4	11	0.0275	\N	\N	t	2025-10-05 23:52:26.852	2025-10-05 23:55:36.311
cmgedbjqw0006smfzmo13kjy1	cmgdlw7sl0001p651jrni9e5r	cmged9ctk0004smfzrrrko4ux	0	0.01	700	0	\N	\N	t	2025-10-06 00:03:47.769	2025-10-06 00:03:47.769
\.


--
-- Data for Name: operation_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_roles (id, "operationId", "roleId", "timeSpent", "timeSpentSeconds", "piecesPerHour", "paymentType", rate, "totalCost", variance, comment, enabled, "requiresContinuousPresence", "createdAt", "updatedAt") FROM stdin;
cmgdhrvh7000ot8tzwxlkkkq7	cmgdhnxs0000gt8tznxsygb6l	cmgbzacwg0008wfg0mu3jj259	3	10800	0.33	HOURLY	500	1500	\N	\N	t	t	2025-10-05 09:20:41.755	2025-10-05 09:20:41.755
cmgdhx35s000wt8tztbya2eom	cmgdhv3rh000qt8tz59u0sv3v	cmgbzacwg0008wfg0mu3jj259	1	3600	1	HOURLY	500	500	\N	\N	t	f	2025-10-05 09:24:44.992	2025-10-05 09:50:30.144
cmgdi7dxk0016t8tzxkb4z02y	cmgdhxw0e000yt8tzpio97ner	cmgbzacwg0008wfg0mu3jj259	6	21600	0.17	HOURLY	500	3000	\N	\N	t	t	2025-10-05 09:32:45.513	2025-10-05 09:32:45.513
cmgdighpv001kt8tz4tkf1sxn	cmgdi953k0018t8tzrfrrd73m	cmgbz7hk70003wfg03i93hkwn	8	28800	0.13	HOURLY	400	3200	\N	\N	t	t	2025-10-05 09:39:50.323	2025-10-05 09:43:36.096
cmgdigzfh001mt8tz1fkgui9t	cmgdi953k0018t8tzrfrrd73m	cmgbzacwg0008wfg0mu3jj259	4	14400	0.25	HOURLY	500	2000	\N	\N	t	f	2025-10-05 09:40:13.277	2025-10-05 09:50:11.382
cmgdll5f20007p6lwk3lj9uco	cmgdlkcnz0005p6lwxm0uvg05	cmgbz97cv0006wfg039x76fxu	6	21600	0.17	HOURLY	500	3000	\N	\N	t	t	2025-10-05 11:07:26.511	2025-10-05 11:07:26.511
cmgdllkah0009p6lwx4xz8oww	cmgdlkcnz0005p6lwxm0uvg05	cmgbz8pik0005wfg067ru5xmf	2	7200	0.5	HOURLY	1000	2000	\N	\N	t	t	2025-10-05 11:07:45.785	2025-10-05 11:07:45.785
cmgdexmxq000epsfwydltkk8f	cmgdejkag0001psfwdpgrtgm9	cmgbz859g0004wfg022ri6pqh	3	10800	0.33	HOURLY	500	1500	30	\N	t	t	2025-10-05 08:01:11.775	2025-10-05 08:01:39.943
cmgdf62wo000ypsfwaclhuu2v	cmgdezfti000kpsfwfe7xv9ms	cmgden6s10004psfw3f3baczn	3	10800	0.33	HOURLY	500	1500	\N	\N	t	f	2025-10-05 08:07:45.72	2025-10-05 10:05:49.056
cmgdh60tz000ct8tz146pzjfq	cmgdf7dt6001bpsfww3cm2nwx	cmgden6s10004psfw3f3baczn	5	18000	0.2	HOURLY	500	2500	\N	\N	t	f	2025-10-05 09:03:42.264	2025-10-05 10:06:35.178
cmgecj497000bw3902sm9teio	cmgdlw7sl0001p651jrni9e5r	cmgbz7hk70003wfg03i93hkwn	0.001667	6	600	HOURLY	500	0.8335	20	\N	t	t	2025-10-05 23:41:41.324	2025-10-05 23:41:41.324
cmgectt3z000mw390vmu7m9cd	cmgdlwzmr0003p651x777zfgx	cmgecqn4q000iw390vqjcpxrz	0.001667	6	600	HOURLY	300	0.5001	20	\N	t	t	2025-10-05 23:50:00.095	2025-10-05 23:50:00.095
cmged3fkx0014w390jwml7cjt	cmgdmq1h40001p6vfwa9ndvf5	cmgbzau290009wfg0ako445vn	0.000556	2	1800	HOURLY	300	0.1668	20	\N	t	f	2025-10-05 23:57:29.121	2025-10-05 23:58:31.799
\.


--
-- Data for Name: operation_template_equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_template_equipment (id, "templateId", "equipmentId", "machineTime", "machineTimeSeconds", "piecesPerHour", "hourlyRate", "totalCost", variance, comment, enabled, "requiresContinuousOperation", "createdAt", "updatedAt") FROM stdin;
cmgdf6wi20015psfwgygvijkd	cmgdf6wi2000zpsfwgx24jh43	cmgc0xzmv0000s1g05hlllq7r	18	64800	0.06	27.4	493.2	\N	\N	t	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
cmgdf6wi20016psfwkxnk5t19	cmgdf6wi2000zpsfwgx24jh43	cmgdel4uw0002psfwcby7mrvx	0.15	540	6.67	3.42	0.513	\N	\N	t	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
cmgdf6wi20017psfw073x7uyt	cmgdf6wi2000zpsfwgx24jh43	cmgc0yjny0001s1g0crllakhz	13	46800	0.08	8.56	111.28	\N	\N	t	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
\.


--
-- Data for Name: operation_template_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_template_materials (id, "templateId", "materialId", quantity, "unitPrice", "totalCost", variance, comment, enabled, "createdAt", "updatedAt") FROM stdin;
cmgdf6wi20011psfwkzsjrbue	cmgdf6wi2000zpsfwgx24jh43	cmgdeosbo0007psfwlupmumwp	0.15	10000	1500	\N	печатаем комплект на 2 формы (это примерно 3 печати)	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
cmgdf6wi20012psfw9d9cyabi	cmgdf6wi2000zpsfwgx24jh43	cmgdernp1000apsfwnkdy34zy	3	65	195	\N	печатаем комплект на 2 формы (это примерно 3 печати)	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
cmgdf6wi20013psfw3xcrd3tp	cmgdf6wi2000zpsfwgx24jh43	cmgdev81v000cpsfwfazkg0c0	9	11	99	\N	\N	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
\.


--
-- Data for Name: operation_template_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_template_roles (id, "templateId", "roleId", "timeSpent", "timeSpentSeconds", "piecesPerHour", "paymentType", rate, "totalCost", variance, comment, enabled, "requiresContinuousPresence", "createdAt", "updatedAt") FROM stdin;
cmgdf6wi20019psfwwqz7n04o	cmgdf6wi2000zpsfwgx24jh43	cmgden6s10004psfw3f3baczn	3	10800	0.33	HOURLY	500	1500	\N	\N	t	t	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
\.


--
-- Data for Name: operation_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operation_templates (id, name, description, comment, enabled, "estimatedProductivityPerHour", "estimatedProductivityPerHourVariance", "cycleHours", "minimumBatchSize", "createdAt", "updatedAt") FROM stdin;
cmgdf6wi2000zpsfwgx24jh43	Печать мастер моделей	\N	\N	t	\N	\N	1	1	2025-10-05 08:08:24.074	2025-10-05 08:08:24.074
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, "orderId", "productId", quantity, "productionProcessId", "createdAt", "updatedAt") FROM stdin;
cmgdip7sm0002p6g10fxppzl5	cmgdiok5s0000p6g1ok5kcf9y	cmgc2xbba000cumfy27946301	50000	cmgc2yc04000eumfyzmbx37h1	2025-10-05 09:46:37.367	2025-10-05 09:46:37.367
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, name, "orderDate", "createdAt", "updatedAt") FROM stdin;
cmgdiok5s0000p6g1ok5kcf9y	Кремлин 05 вариант 1	2025-10-05 00:00:00	2025-10-05 09:46:06.736	2025-10-05 09:46:06.736
\.


--
-- Data for Name: production_operations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production_operations (id, "chainId", name, description, comment, "orderIndex", enabled, "estimatedProductivityPerHour", "estimatedProductivityPerHourVariance", "cycleHours", "operationDuration", "minimumBatchSize", "cycleName", "cyclesPerHour", "itemsPerCycle", "createdAt", "updatedAt") FROM stdin;
cmgdhnxs0000gt8tznxsygb6l	cmgc2ze4q000gumfyc33p7b8a	Подготовка формы к вулканизации	все на 2 формы: обрезка резины (30 минут), обработка тальком (10 мин), вырезание газеты 6 мин, запуск уф принтера 10 мин, печать шаблона 20 мин, запихивание мастер моделей в форму 1,5 часа, сборка формы 5 минут	\N	4	t	\N	\N	1	3	1	\N	\N	\N	2025-10-05 09:17:38.112	2025-10-05 10:07:14.539
cmgdhv3rh000qt8tz59u0sv3v	cmgc2ze4q000gumfyc33p7b8a	Вулканизация формы	нужен вулканизатор (2 часа), время на подготовку 10 мин	\N	5	t	\N	\N	1	5	1	\N	\N	\N	2025-10-05 09:23:12.461	2025-10-05 10:07:35.094
cmgdhxw0e000yt8tzpio97ner	cmgc2ze4q000gumfyc33p7b8a	Резка формы	на резку формы нужно 3 часа, на 2 формы 6 часов. из оборудования не нужно ничего, кроме ножей и скальпеля	\N	6	t	\N	\N	1	6	1	\N	\N	\N	2025-10-05 09:25:22.382	2025-10-05 10:07:53.776
cmgdi953k0018t8tzrfrrd73m	cmgc2ze4q000gumfyc33p7b8a	Приладка формы	нужно тестировать форму - лить и параллельно подпиливать, если необходимо. Участвует изготовитель форм и литейщик. мероприятие занимает 4 часа	\N	7	t	\N	\N	1	8	1	\N	\N	\N	2025-10-05 09:34:07.376	2025-10-05 10:08:06.535
cmgdlkcnz0005p6lwxm0uvg05	cmgdlk0aq0003p6lwm3xih9ez	Переговоры с клиентами	\N	\N	1	t	\N	\N	1	\N	1	\N	\N	\N	2025-10-05 11:06:49.248	2025-10-05 11:07:52.508
cmgdejkag0001psfwdpgrtgm9	cmgc2ze4q000gumfyc33p7b8a	Подготовка к печати мастер моделей	\N	\N	1	t	\N	\N	1	3	1	\N	\N	\N	2025-10-05 07:50:15.16	2025-10-05 10:05:14.29
cmgdezfti000kpsfwfe7xv9ms	cmgc2ze4q000gumfyc33p7b8a	Печать мастер моделей	\N	\N	2	t	\N	\N	1	19	1	\N	\N	\N	2025-10-05 08:02:35.862	2025-10-05 10:05:36.108
cmgdf7dt6001bpsfww3cm2nwx	cmgc2ze4q000gumfyc33p7b8a	Доработка мастер моделей	зачистка наждачкой(3 часа), доп промывка (10мин), доп сушка (15 мин), допекание в духовке 1 час (1,5 часа), обработка смазкой (20 мин)	\N	3	t	\N	\N	1	6	1	\N	\N	\N	2025-10-05 08:08:46.507	2025-10-05 10:06:55.346
cmgdlwzmr0003p651x777zfgx	cmgdljgp50001p6lwug7575ji	Зачистка на гриндере	\N	\N	2	t	600	20	0.5	\N	1	\N	2	300	2025-10-05 11:16:38.884	2025-10-05 23:50:07.234
cmgdmq1h40001p6vfwa9ndvf5	cmgdljgp50001p6lwug7575ji	Галтовка	\N	\N	3	t	2400	20	0.5	\N	1	замес	2	800	2025-10-05 11:39:14.296	2025-10-05 23:58:54.224
cmgdlw7sl0001p651jrni9e5r	cmgdljgp50001p6lwug7575ji	Литье	\N	\N	1	t	600	20	0.03	\N	1	\N	30	20	2025-10-05 11:16:02.805	2025-10-06 00:03:54.813
\.


--
-- Data for Name: production_processes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production_processes (id, "productId", name, description, comment, "createdAt", "updatedAt") FROM stdin;
cmgc2yc04000eumfyzmbx37h1	cmgc2xbba000cumfy27946301	Кремлин 05 металл - процесс 1	делаем так, как мы делаем сейчас	\N	2025-10-04 09:38:02.692	2025-10-04 09:38:09.691
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, description, "imagePath", "createdAt", "updatedAt") FROM stdin;
cmgc2xbba000cumfy27946301	Кремлин 0,5 металл	\N	\N	2025-10-04 09:37:15.142	2025-10-04 09:37:15.142
\.


--
-- Data for Name: recurring_expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recurring_expenses (id, name, period, amount, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, "emailVerified", image, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: verificationtokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verificationtokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: employee_roles employee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: material_categories material_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.material_categories
    ADD CONSTRAINT material_categories_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: operation_chains operation_chains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_chains
    ADD CONSTRAINT operation_chains_pkey PRIMARY KEY (id);


--
-- Name: operation_equipment operation_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_equipment
    ADD CONSTRAINT operation_equipment_pkey PRIMARY KEY (id);


--
-- Name: operation_materials operation_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_materials
    ADD CONSTRAINT operation_materials_pkey PRIMARY KEY (id);


--
-- Name: operation_roles operation_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_roles
    ADD CONSTRAINT operation_roles_pkey PRIMARY KEY (id);


--
-- Name: operation_template_equipment operation_template_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_equipment
    ADD CONSTRAINT operation_template_equipment_pkey PRIMARY KEY (id);


--
-- Name: operation_template_materials operation_template_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_materials
    ADD CONSTRAINT operation_template_materials_pkey PRIMARY KEY (id);


--
-- Name: operation_template_roles operation_template_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_roles
    ADD CONSTRAINT operation_template_roles_pkey PRIMARY KEY (id);


--
-- Name: operation_templates operation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_templates
    ADD CONSTRAINT operation_templates_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: production_operations production_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT production_operations_pkey PRIMARY KEY (id);


--
-- Name: production_processes production_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_processes
    ADD CONSTRAINT production_processes_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: material_categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX material_categories_name_key ON public.material_categories USING btree (name);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verificationtokens_identifier_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX verificationtokens_identifier_token_key ON public.verificationtokens USING btree (identifier, token);


--
-- Name: verificationtokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX verificationtokens_token_key ON public.verificationtokens USING btree (token);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: materials materials_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.material_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_chains operation_chains_processId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_chains
    ADD CONSTRAINT "operation_chains_processId_fkey" FOREIGN KEY ("processId") REFERENCES public.production_processes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_equipment operation_equipment_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_equipment
    ADD CONSTRAINT "operation_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_equipment operation_equipment_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_equipment
    ADD CONSTRAINT "operation_equipment_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.production_operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_materials operation_materials_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_materials
    ADD CONSTRAINT "operation_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_materials operation_materials_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_materials
    ADD CONSTRAINT "operation_materials_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.production_operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_roles operation_roles_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_roles
    ADD CONSTRAINT "operation_roles_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.production_operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_roles operation_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_roles
    ADD CONSTRAINT "operation_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.employee_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_equipment operation_template_equipment_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_equipment
    ADD CONSTRAINT "operation_template_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_equipment operation_template_equipment_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_equipment
    ADD CONSTRAINT "operation_template_equipment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.operation_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_materials operation_template_materials_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_materials
    ADD CONSTRAINT "operation_template_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_materials operation_template_materials_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_materials
    ADD CONSTRAINT "operation_template_materials_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.operation_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_roles operation_template_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_roles
    ADD CONSTRAINT "operation_template_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.employee_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_roles operation_template_roles_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_template_roles
    ADD CONSTRAINT "operation_template_roles_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.operation_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productionProcessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productionProcessId_fkey" FOREIGN KEY ("productionProcessId") REFERENCES public.production_processes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: production_operations production_operations_chainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT "production_operations_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES public.operation_chains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: production_processes production_processes_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_processes
    ADD CONSTRAINT "production_processes_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict moN9UPhGTj58q2j4V9ZOASksI1NrixSE9u8oAguDTP1E2klzcAqZu4OaBB0sa7R

