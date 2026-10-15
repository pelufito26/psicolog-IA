-- Preparación local: no aplicar remotamente sin revisión/autorización.
CREATE SCHEMA acceso;
REVOKE ALL ON SCHEMA acceso FROM PUBLIC, anon, authenticated;
CREATE TABLE acceso.cuentas (
  usuario uuid PRIMARY KEY,
  profesional uuid NOT NULL UNIQUE REFERENCES psicologia.profesionales(id),
  bloqueada boolean NOT NULL DEFAULT false
);
CREATE TABLE acceso.intentos (
  hash text PRIMARY KEY,
  usuario uuid NOT NULL REFERENCES acceso.cuentas(usuario),
  codigo text NOT NULL,
  vence bigint NOT NULL,
  intentos integer NOT NULL DEFAULT 0 CHECK(intentos BETWEEN 0 AND 5),
  estado text NOT NULL CHECK(estado IN ('pendiente','enviado','fallido','consumido')),
  creado bigint NOT NULL,
  email text NOT NULL
);
CREATE INDEX intentos_usuario ON acceso.intentos(usuario);
CREATE TABLE acceso.sesiones (
  hash text PRIMARY KEY,
  intento text NOT NULL UNIQUE REFERENCES acceso.intentos(hash),
  usuario uuid NOT NULL REFERENCES acceso.cuentas(usuario),
  vence bigint NOT NULL,
  actividad bigint NOT NULL,
  revocada boolean NOT NULL DEFAULT false
);
CREATE INDEX sesiones_usuario ON acceso.sesiones(usuario);
CREATE TABLE acceso.limites (
  clave text PRIMARY KEY,
  inicio bigint NOT NULL,
  cantidad integer NOT NULL,
  ultimo bigint NOT NULL
);
DO $$ DECLARE tabla text; BEGIN
  FOREACH tabla IN ARRAY ARRAY['cuentas','intentos','sesiones','limites'] LOOP
    EXECUTE format('ALTER TABLE acceso.%I ENABLE ROW LEVEL SECURITY', tabla);
    EXECUTE format('CREATE POLICY backend ON acceso.%I TO psicologia_backend USING (true) WITH CHECK (true)',tabla);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA acceso FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA acceso TO psicologia_backend;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA acceso TO psicologia_backend;
-- Contexto fijado por transacción por el backend tras comprobar su sesión.
-- La credencial SQL sigue siendo de confianza: esto no resiste su robo.
DROP POLICY backend_select ON psicologia.pacientes;
DROP POLICY backend_insert ON psicologia.pacientes;
DROP POLICY backend_update ON psicologia.pacientes;
CREATE POLICY propietario ON psicologia.pacientes TO psicologia_backend
  USING (profesional_id::text = current_setting('app.profesional',true))
  WITH CHECK (profesional_id::text = current_setting('app.profesional',true));
DROP POLICY backend_select ON psicologia.sesiones_clinicas;
DROP POLICY backend_insert ON psicologia.sesiones_clinicas;
DROP POLICY backend_update ON psicologia.sesiones_clinicas;
CREATE POLICY propietario ON psicologia.sesiones_clinicas TO psicologia_backend
  USING (profesional_id::text = current_setting('app.profesional',true))
  WITH CHECK (profesional_id::text = current_setting('app.profesional',true));
DROP POLICY backend_select ON psicologia.fichas_clinicas;
DROP POLICY backend_insert ON psicologia.fichas_clinicas;
DROP POLICY backend_update ON psicologia.fichas_clinicas;
CREATE POLICY propietario ON psicologia.fichas_clinicas TO psicologia_backend
  USING (EXISTS (SELECT 1 FROM psicologia.pacientes p WHERE p.id=paciente_id))
  WITH CHECK (EXISTS (SELECT 1 FROM psicologia.pacientes p WHERE p.id=paciente_id));
