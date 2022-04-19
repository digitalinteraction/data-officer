--
-- PostgreSQL database dump
--

-- Dumped from database version 12.8
-- Dumped by pg_dump version 12.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET SESSION AUTHORIZATION 'user';

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: entries; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.entries (
    id integer NOT NULL,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    response jsonb NOT NULL,
    "user" integer NOT NULL
);


--
-- Name: entries_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.entries_id_seq OWNED BY public.entries.id;


--
-- Name: links; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.links (
    id integer NOT NULL,
    code character varying NOT NULL,
    url character varying NOT NULL,
    uses bigint DEFAULT 0 NOT NULL,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: links_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.links_id_seq OWNED BY public.links.id;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.logs (
    id integer NOT NULL,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session character varying NOT NULL,
    metric character varying NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    "fullName" character varying NOT NULL,
    email character varying NOT NULL,
    "phoneNumber" character varying,
    "reminderSchedule" character varying,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    consented timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastLogin" timestamp without time zone,
    reminders jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: entries id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.entries ALTER COLUMN id SET DEFAULT nextval('public.entries_id_seq'::regclass);


--
-- Name: links id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.links ALTER COLUMN id SET DEFAULT nextval('public.links_id_seq'::regclass);


--
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: entries entries_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.entries
    ADD CONSTRAINT entries_pkey PRIMARY KEY (id);


--
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: links_code; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX links_code ON public.links USING btree (code);


--
-- Name: logs_metric; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX logs_metric ON public.logs USING btree (metric);


--
-- Name: logs_session; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX logs_session ON public.logs USING btree (session);


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX users_email ON public.users USING btree (email);


--
-- Name: entries entries_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.entries
    ADD CONSTRAINT entries_user_fkey FOREIGN KEY ("user") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

