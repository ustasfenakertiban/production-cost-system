--
-- PostgreSQL database dump
--

\restrict fTq58PXJ7A7jMRsXiC7ZONMuHbmlvJn88aGb7thMba9Gcn9NZNtNqwjmaz1QRd7

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: role_62b2c59fa
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO role_62b2c59fa;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: role_62b2c59fa
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ChainType; Type: TYPE; Schema: public; Owner: role_62b2c59fa
--

CREATE TYPE public."ChainType" AS ENUM (
    'ONE_TIME',
    'PER_UNIT'
);


ALTER TYPE public."ChainType" OWNER TO role_62b2c59fa;

--
-- Name: ExpensePeriod; Type: TYPE; Schema: public; Owner: role_62b2c59fa
--

CREATE TYPE public."ExpensePeriod" AS ENUM (
    'DAY',
    'WEEK',
    'MONTH',
    'QUARTER',
    'YEAR'
);


ALTER TYPE public."ExpensePeriod" OWNER TO role_62b2c59fa;

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: role_62b2c59fa
--

CREATE TYPE public."PaymentType" AS ENUM (
    'HOURLY',
    'PIECE_RATE'
);


ALTER TYPE public."PaymentType" OWNER TO role_62b2c59fa;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public._prisma_migrations OWNER TO role_62b2c59fa;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.accounts OWNER TO role_62b2c59fa;

--
-- Name: employee_roles; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.employee_roles (
    id text NOT NULL,
    name text NOT NULL,
    "paymentType" public."PaymentType" NOT NULL,
    "hourlyRate" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employee_roles OWNER TO role_62b2c59fa;

--
-- Name: equipment; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.equipment OWNER TO role_62b2c59fa;

--
-- Name: material_categories; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.material_categories (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.material_categories OWNER TO role_62b2c59fa;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.materials OWNER TO role_62b2c59fa;

--
-- Name: operation_chains; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_chains OWNER TO role_62b2c59fa;

--
-- Name: operation_equipment; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_equipment OWNER TO role_62b2c59fa;

--
-- Name: operation_materials; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_materials OWNER TO role_62b2c59fa;

--
-- Name: operation_roles; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_roles OWNER TO role_62b2c59fa;

--
-- Name: operation_template_equipment; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_template_equipment OWNER TO role_62b2c59fa;

--
-- Name: operation_template_materials; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_template_materials OWNER TO role_62b2c59fa;

--
-- Name: operation_template_roles; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_template_roles OWNER TO role_62b2c59fa;

--
-- Name: operation_templates; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.operation_templates OWNER TO role_62b2c59fa;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.order_items OWNER TO role_62b2c59fa;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.orders (
    id text NOT NULL,
    name text NOT NULL,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO role_62b2c59fa;

--
-- Name: production_operations; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.production_operations OWNER TO role_62b2c59fa;

--
-- Name: production_processes; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.production_processes OWNER TO role_62b2c59fa;

--
-- Name: products; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "imagePath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO role_62b2c59fa;

--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.recurring_expenses (
    id text NOT NULL,
    name text NOT NULL,
    period public."ExpensePeriod" NOT NULL,
    amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.recurring_expenses OWNER TO role_62b2c59fa;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO role_62b2c59fa;

--
-- Name: users; Type: TABLE; Schema: public; Owner: role_62b2c59fa
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


ALTER TABLE public.users OWNER TO role_62b2c59fa;

--
-- Name: verificationtokens; Type: TABLE; Schema: public; Owner: role_62b2c59fa
--

CREATE TABLE public.verificationtokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verificationtokens OWNER TO role_62b2c59fa;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fa62f56e-95b8-459d-a90b-9d34b5281f58	e9aa378e6e10ab85aa7c55a26f5039814dbd7e84551d23118b0c5a3b738f1189	\N	20251002141359_add_continuous_resource_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251002141359_add_continuous_resource_fields\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "operation_equipment" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"operation_equipment\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(636), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251002141359_add_continuous_resource_fields"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251002141359_add_continuous_resource_fields"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:225	\N	2025-10-05 23:09:08.023817+00	0
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: employee_roles; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.employee_roles (id, name, "paymentType", "hourlyRate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.equipment (id, name, "estimatedCost", "hourlyDepreciation", "maxProductivity", "productivityUnits", comment, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: material_categories; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.material_categories (id, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.materials (id, name, "categoryId", unit, cost, "vatPercentage", "createdAt", "updatedAt", comment) FROM stdin;
\.


--
-- Data for Name: operation_chains; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_chains (id, "processId", name, "chainType", "orderIndex", comment, enabled, "createdAt", "updatedAt", "estimatedQuantity") FROM stdin;
\.


--
-- Data for Name: operation_equipment; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_equipment (id, "operationId", "equipmentId", "machineTime", "machineTimeSeconds", "piecesPerHour", "hourlyRate", "totalCost", variance, comment, enabled, "requiresContinuousOperation", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_materials; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_materials (id, "operationId", "materialId", quantity, "quantityPerHour", "unitPrice", "totalCost", variance, comment, enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_roles; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_roles (id, "operationId", "roleId", "timeSpent", "timeSpentSeconds", "piecesPerHour", "paymentType", rate, "totalCost", variance, comment, enabled, "requiresContinuousPresence", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_template_equipment; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_template_equipment (id, "templateId", "equipmentId", "machineTime", "machineTimeSeconds", "piecesPerHour", "hourlyRate", "totalCost", variance, comment, enabled, "requiresContinuousOperation", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_template_materials; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_template_materials (id, "templateId", "materialId", quantity, "unitPrice", "totalCost", variance, comment, enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_template_roles; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_template_roles (id, "templateId", "roleId", "timeSpent", "timeSpentSeconds", "piecesPerHour", "paymentType", rate, "totalCost", variance, comment, enabled, "requiresContinuousPresence", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: operation_templates; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.operation_templates (id, name, description, comment, enabled, "estimatedProductivityPerHour", "estimatedProductivityPerHourVariance", "cycleHours", "minimumBatchSize", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.order_items (id, "orderId", "productId", quantity, "productionProcessId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.orders (id, name, "orderDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: production_operations; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.production_operations (id, "chainId", name, description, comment, "orderIndex", enabled, "estimatedProductivityPerHour", "estimatedProductivityPerHourVariance", "cycleHours", "operationDuration", "minimumBatchSize", "cycleName", "cyclesPerHour", "itemsPerCycle", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: production_processes; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.production_processes (id, "productId", name, description, comment, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.products (id, name, description, "imagePath", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: recurring_expenses; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.recurring_expenses (id, name, period, amount, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.users (id, name, email, "emailVerified", image, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: verificationtokens; Type: TABLE DATA; Schema: public; Owner: role_62b2c59fa
--

COPY public.verificationtokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: employee_roles employee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: material_categories material_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.material_categories
    ADD CONSTRAINT material_categories_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: operation_chains operation_chains_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_chains
    ADD CONSTRAINT operation_chains_pkey PRIMARY KEY (id);


--
-- Name: operation_equipment operation_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_equipment
    ADD CONSTRAINT operation_equipment_pkey PRIMARY KEY (id);


--
-- Name: operation_materials operation_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_materials
    ADD CONSTRAINT operation_materials_pkey PRIMARY KEY (id);


--
-- Name: operation_roles operation_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_roles
    ADD CONSTRAINT operation_roles_pkey PRIMARY KEY (id);


--
-- Name: operation_template_equipment operation_template_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_equipment
    ADD CONSTRAINT operation_template_equipment_pkey PRIMARY KEY (id);


--
-- Name: operation_template_materials operation_template_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_materials
    ADD CONSTRAINT operation_template_materials_pkey PRIMARY KEY (id);


--
-- Name: operation_template_roles operation_template_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_roles
    ADD CONSTRAINT operation_template_roles_pkey PRIMARY KEY (id);


--
-- Name: operation_templates operation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_templates
    ADD CONSTRAINT operation_templates_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: production_operations production_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT production_operations_pkey PRIMARY KEY (id);


--
-- Name: production_processes production_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.production_processes
    ADD CONSTRAINT production_processes_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: role_62b2c59fa
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: material_categories_name_key; Type: INDEX; Schema: public; Owner: role_62b2c59fa
--

CREATE UNIQUE INDEX material_categories_name_key ON public.material_categories USING btree (name);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: role_62b2c59fa
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: role_62b2c59fa
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verificationtokens_identifier_token_key; Type: INDEX; Schema: public; Owner: role_62b2c59fa
--

CREATE UNIQUE INDEX verificationtokens_identifier_token_key ON public.verificationtokens USING btree (identifier, token);


--
-- Name: verificationtokens_token_key; Type: INDEX; Schema: public; Owner: role_62b2c59fa
--

CREATE UNIQUE INDEX verificationtokens_token_key ON public.verificationtokens USING btree (token);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: materials materials_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.material_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_chains operation_chains_processId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_chains
    ADD CONSTRAINT "operation_chains_processId_fkey" FOREIGN KEY ("processId") REFERENCES public.production_processes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_equipment operation_equipment_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_equipment
    ADD CONSTRAINT "operation_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_equipment operation_equipment_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_equipment
    ADD CONSTRAINT "operation_equipment_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.production_operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_materials operation_materials_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_materials
    ADD CONSTRAINT "operation_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_materials operation_materials_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_materials
    ADD CONSTRAINT "operation_materials_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.production_operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_roles operation_roles_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_roles
    ADD CONSTRAINT "operation_roles_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.production_operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_roles operation_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_roles
    ADD CONSTRAINT "operation_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.employee_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_equipment operation_template_equipment_equipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_equipment
    ADD CONSTRAINT "operation_template_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_equipment operation_template_equipment_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_equipment
    ADD CONSTRAINT "operation_template_equipment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.operation_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_materials operation_template_materials_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_materials
    ADD CONSTRAINT "operation_template_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_materials operation_template_materials_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_materials
    ADD CONSTRAINT "operation_template_materials_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.operation_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_roles operation_template_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_roles
    ADD CONSTRAINT "operation_template_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.employee_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operation_template_roles operation_template_roles_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.operation_template_roles
    ADD CONSTRAINT "operation_template_roles_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.operation_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productionProcessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productionProcessId_fkey" FOREIGN KEY ("productionProcessId") REFERENCES public.production_processes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: production_operations production_operations_chainId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.production_operations
    ADD CONSTRAINT "production_operations_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES public.operation_chains(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: production_processes production_processes_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.production_processes
    ADD CONSTRAINT "production_processes_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: role_62b2c59fa
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: role_62b2c59fa
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict fTq58PXJ7A7jMRsXiC7ZONMuHbmlvJn88aGb7thMba9Gcn9NZNtNqwjmaz1QRd7

