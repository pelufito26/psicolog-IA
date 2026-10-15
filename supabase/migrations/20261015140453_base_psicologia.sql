-- Desarrollo únicamente. No contiene credenciales ni crea cuentas LOGIN.
CREATE SCHEMA psicologia;
REVOKE ALL ON SCHEMA psicologia FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'psicologia_backend') THEN
    RAISE EXCEPTION 'El rol psicologia_backend ya existe; revisar antes de migrar';
  END IF;
  CREATE ROLE psicologia_backend NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
END $$;

CREATE TABLE psicologia.profesionales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (nombre !~ '^[[:space:]]*$'),
  apellido text NOT NULL CHECK (apellido !~ '^[[:space:]]*$'),
  email text NOT NULL CHECK (email !~ '^[[:space:]]*$'),
  fecha_creacion timestamptz NOT NULL DEFAULT clock_timestamp(),
  fecha_ultima_modificacion timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX profesionales_email_normalizado
  ON psicologia.profesionales (lower(regexp_replace(email, '^[[:space:]]+|[[:space:]]+$', '', 'g')));

CREATE TABLE psicologia.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid NOT NULL REFERENCES psicologia.profesionales(id) ON DELETE RESTRICT,
  nombre text NOT NULL CHECK (nombre !~ '^[[:space:]]*$'),
  apellido text NOT NULL CHECK (apellido !~ '^[[:space:]]*$'),
  fecha_nacimiento date NOT NULL,
  telefono text NOT NULL CHECK (telefono !~ '^[[:space:]]*$'),
  fecha_creacion timestamptz NOT NULL DEFAULT clock_timestamp(),
  fecha_ultima_modificacion timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (id, profesional_id)
);
CREATE INDEX pacientes_profesional_idx ON psicologia.pacientes(profesional_id);

CREATE TABLE psicologia.fichas_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL UNIQUE REFERENCES psicologia.pacientes(id) ON DELETE RESTRICT,
  motivo_consulta text NOT NULL CHECK (motivo_consulta !~ '^[[:space:]]*$'),
  antecedentes_personales text,
  antecedentes_familiares text,
  medicacion text,
  evaluacion_clinica text,
  observaciones_generales text,
  fecha_creacion timestamptz NOT NULL DEFAULT clock_timestamp(),
  fecha_ultima_modificacion timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE psicologia.sesiones_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  profesional_id uuid NOT NULL,
  fecha_sesion date NOT NULL,
  anotaciones_clinicas text NOT NULL CHECK (anotaciones_clinicas !~ '^[[:space:]]*$'),
  fecha_creacion timestamptz NOT NULL DEFAULT clock_timestamp(),
  fecha_ultima_modificacion timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (paciente_id, profesional_id)
    REFERENCES psicologia.pacientes(id, profesional_id) ON DELETE RESTRICT
);
CREATE INDEX sesiones_paciente_fecha_idx ON psicologia.sesiones_clinicas(paciente_id, fecha_sesion DESC);
CREATE INDEX sesiones_profesional_idx ON psicologia.sesiones_clinicas(profesional_id);

CREATE FUNCTION psicologia.hoy_clinico(instante timestamptz)
RETURNS date LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT (instante AT TIME ZONE 'America/Montevideo')::date $$;

CREATE FUNCTION psicologia.proteger_registro()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  hoy date := psicologia.hoy_clinico(clock_timestamp());
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Identificador inmutable' USING ERRCODE = '23514';
    END IF;
    IF NEW.fecha_creacion IS DISTINCT FROM OLD.fecha_creacion THEN
      RAISE EXCEPTION 'Fecha de creación inmutable' USING ERRCODE = '23514';
    END IF;
    IF TG_TABLE_NAME IN ('pacientes', 'sesiones_clinicas') THEN
      IF NEW.profesional_id IS DISTINCT FROM OLD.profesional_id THEN
        RAISE EXCEPTION 'Profesional inmutable' USING ERRCODE = '23514';
      END IF;
    END IF;
    IF TG_TABLE_NAME IN ('fichas_clinicas', 'sesiones_clinicas') THEN
      IF NEW.paciente_id IS DISTINCT FROM OLD.paciente_id THEN
        RAISE EXCEPTION 'Paciente inmutable' USING ERRCODE = '23514';
      END IF;
    END IF;
  ELSE
    NEW.fecha_creacion := clock_timestamp();
  END IF;
  IF TG_TABLE_NAME = 'pacientes' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.fecha_nacimiento > hoy THEN
        RAISE EXCEPTION 'Nacimiento futuro' USING ERRCODE = '23514';
      END IF;
    ELSIF NEW.fecha_nacimiento IS DISTINCT FROM OLD.fecha_nacimiento AND NEW.fecha_nacimiento > hoy THEN
      RAISE EXCEPTION 'Nacimiento futuro' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'sesiones_clinicas' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.fecha_sesion > hoy THEN
        RAISE EXCEPTION 'Sesión futura' USING ERRCODE = '23514';
      END IF;
    ELSIF NEW.fecha_sesion IS DISTINCT FROM OLD.fecha_sesion AND NEW.fecha_sesion > hoy THEN
      RAISE EXCEPTION 'Sesión futura' USING ERRCODE = '23514';
    END IF;
  END IF;
  NEW.fecha_ultima_modificacion := clock_timestamp();
  RETURN NEW;
END $$;

DO $$
DECLARE nombre text;
BEGIN
  FOREACH nombre IN ARRAY ARRAY['profesionales', 'pacientes', 'fichas_clinicas', 'sesiones_clinicas'] LOOP
    EXECUTE format('CREATE TRIGGER proteger_registro BEFORE INSERT OR UPDATE ON psicologia.%I FOR EACH ROW EXECUTE FUNCTION psicologia.proteger_registro()', nombre);
    EXECUTE format('ALTER TABLE psicologia.%I ENABLE ROW LEVEL SECURITY', nombre);
    EXECUTE format('CREATE POLICY backend_select ON psicologia.%I FOR SELECT TO psicologia_backend USING (true)', nombre);
    EXECUTE format('CREATE POLICY backend_insert ON psicologia.%I FOR INSERT TO psicologia_backend WITH CHECK (true)', nombre);
    EXECUTE format('CREATE POLICY backend_update ON psicologia.%I FOR UPDATE TO psicologia_backend USING (true) WITH CHECK (true)', nombre);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA psicologia FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA psicologia FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA psicologia TO psicologia_backend;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA psicologia TO psicologia_backend;
GRANT EXECUTE ON FUNCTION psicologia.hoy_clinico(timestamptz) TO psicologia_backend;
-- La política técnica anterior permite ensayos ficticios; no autoriza acceso clínico por identidad.
