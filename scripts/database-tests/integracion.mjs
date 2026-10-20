import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Runs inside the existing HTTP/AUTH matrix: real repositories and disposable PostgreSQL.
// Each professional creates a new patient here; no prior clinical fixture is reused.
export async function testRecorridoIntegrado(admin, request, one, two) {
  const snapshot = async () =>
    (
      await admin.query(`select jsonb_build_object(
      'pacientes',(select coalesce(jsonb_agg(to_jsonb(p) order by id),'[]') from psicologia.pacientes p),
      'fichas',(select coalesce(jsonb_agg(to_jsonb(f) order by id),'[]') from psicologia.fichas_clinicas f),
      'sesiones',(select coalesce(jsonb_agg(to_jsonb(s) order by id),'[]') from psicologia.sesiones_clinicas s)
    ) as data`)
    ).rows[0].data;
  function onlyChanged(before, after, table, id, fields = []) {
    for (const key of ['pacientes', 'fichas', 'sesiones']) {
      if (key !== table) assert.deepEqual(after[key], before[key], `No modificar ${key}`);
      else {
        assert.deepEqual(
          after[key].filter((r) => r.id !== id),
          before[key].filter((r) => r.id !== id),
        );
        const old = before[key].find((r) => r.id === id),
          current = after[key].find((r) => r.id === id);
        assert.ok(current);
        assert.equal(after[key].length, before[key].length + (old ? 0 : 1));
        if (old) {
          const immutable = (row) =>
            Object.fromEntries(Object.entries(row).filter(([k]) => !fields.includes(k)));
          assert.deepEqual(immutable(current), immutable(old));
          assert.notEqual(current.fecha_ultima_modificacion, old.fecha_ultima_modificacion);
        }
      }
    }
  }
  async function call(jar, path, data, status = 200) {
    const result = await request(jar, path, data);
    assert.equal(result.response.status, status, `${path}: ${result.body.codigo ?? 'contrato'}`);
    return result.body;
  }
  const owners = [];
  for (const jar of [one, two]) {
    const marker = randomUUID().replaceAll('-', ''),
      patient = {
        nombre: 'Recorrido ' + marker,
        apellido: 'Ficticio',
        fechaNacimiento: '2000-02-29',
        telefono: '0000000',
      };
    let before = await snapshot();
    const created = await call(jar, '/api/pacientes', patient, 201),
      id = created.id;
    onlyChanged(before, await snapshot(), 'pacientes', id);
    const list = await call(jar, '/api/pacientes/consulta', { busqueda: marker, pagina: 1 });
    assert.deepEqual(
      list.pacientes.map((p) => p.id),
      [id],
    );
    assert.equal((await call(jar, '/api/pacientes/perfil', { id })).telefono, patient.telefono);
    assert.equal(
      (await call(jar, '/api/fichas-clinicas/consultar', { pacienteId: id })).ficha,
      null,
    );
    const original = {
      pacienteId: id,
      operacionId: randomUUID(),
      fechaSesion: '2000-01-01',
      anotacionesClinicas: 'Nota ficticia\n  ' + marker,
    };
    before = await snapshot();
    const first = await call(jar, '/api/sesiones-clinicas/registrar', original, 201);
    onlyChanged(before, await snapshot(), 'sesiones', first.id);
    assert.equal(
      (await call(jar, '/api/fichas-clinicas/estado', { pacienteId: id })).existe,
      false,
    );
    assert.equal(
      (await call(jar, '/api/sesiones-clinicas/detalle', { pacienteId: id, sesionId: first.id }))
        .sesion.anotacionesClinicas,
      original.anotacionesClinicas,
    );
    before = await snapshot();
    const ficha = await call(
      jar,
      '/api/fichas-clinicas/crear',
      { pacienteId: id, motivoConsulta: 'Motivo ficticio ' + marker },
      201,
    );
    onlyChanged(before, await snapshot(), 'fichas', ficha.id);
    const fields = {
      motivoConsulta: 'Motivo actualizado ' + marker,
      antecedentesPersonales: '',
      antecedentesFamiliares: '',
      medicacion: '',
      evaluacionClinica: '',
      observacionesGenerales: '<b>Texto literal ficticio</b>\n  Línea',
    };
    const editFicha = await call(jar, '/api/fichas-clinicas/edicion', { pacienteId: id });
    before = await snapshot();
    await call(jar, '/api/fichas-clinicas/actualizar', {
      pacienteId: id,
      version: editFicha.ficha.version,
      ...fields,
    });
    onlyChanged(before, await snapshot(), 'fichas', ficha.id, [
      'motivo_consulta',
      'antecedentes_personales',
      'antecedentes_familiares',
      'medicacion',
      'evaluacion_clinica',
      'observaciones_generales',
      'fecha_ultima_modificacion',
    ]);
    const readFicha = await call(jar, '/api/fichas-clinicas/consultar', { pacienteId: id });
    assert.equal(readFicha.ficha.id, ficha.id);
    for (const [key, value] of Object.entries(fields))
      assert.equal(readFicha.ficha[key], value || null);
    const editPatient = await call(jar, '/api/pacientes/edicion', { id });
    before = await snapshot();
    await call(jar, '/api/pacientes/actualizar', {
      ...editPatient,
      nombre: 'Actualizado ' + marker,
      telefono: '1111111',
    });
    onlyChanged(before, await snapshot(), 'pacientes', id, [
      'nombre',
      'telefono',
      'fecha_ultima_modificacion',
    ]);
    const profile = await call(jar, '/api/pacientes/perfil', { id });
    assert.equal(profile.nombre, 'Actualizado ' + marker);
    assert.equal(profile.telefono, '1111111');
    assert.equal(
      (await call(jar, '/api/fichas-clinicas/consultar', { pacienteId: id })).nombre,
      profile.nombre,
    );
    before = await snapshot();
    const second = await call(
      jar,
      '/api/sesiones-clinicas/registrar',
      { ...original, operacionId: randomUUID() },
      201,
    );
    assert.notEqual(first.id, second.id);
    onlyChanged(before, await snapshot(), 'sesiones', second.id);
    const editSession = await call(jar, '/api/sesiones-clinicas/edicion', {
      pacienteId: id,
      sesionId: first.id,
    });
    assert.equal(editSession.nombre, profile.nombre);
    before = await snapshot();
    const replacement = {
      pacienteId: id,
      sesionId: first.id,
      version: editSession.sesion.version,
      fechaSesion: '2001-01-01',
      anotacionesClinicas: 'Sesión editada ' + marker,
    };
    await call(jar, '/api/sesiones-clinicas/actualizar', replacement);
    onlyChanged(before, await snapshot(), 'sesiones', first.id, [
      'fecha_sesion',
      'anotaciones_clinicas',
      'fecha_ultima_modificacion',
    ]);
    const detail = await call(jar, '/api/sesiones-clinicas/detalle', {
      pacienteId: id,
      sesionId: first.id,
    });
    assert.equal(detail.sesion.id, first.id);
    assert.equal(detail.sesion.fechaSesion, replacement.fechaSesion);
    assert.equal(detail.sesion.anotacionesClinicas, replacement.anotacionesClinicas);
    const history = await call(jar, '/api/sesiones-clinicas/historial', {
      pacienteId: id,
      pagina: 1,
    });
    assert.equal(history.nombre, profile.nombre);
    assert.deepEqual(
      history.sesiones.map((s) => s.id),
      [first.id, second.id],
    );
    assert.equal(history.haySiguiente, false);
    before = await snapshot();
    await call(jar, '/api/sesiones-clinicas/registrar', original, 409);
    await call(jar, '/api/sesiones-clinicas/actualizar', replacement, 409);
    await call(jar, '/api/sesiones-clinicas/comprobar', {
      pacienteId: id,
      operacionId: original.operacionId,
    });
    assert.deepEqual(await snapshot(), before);
    owners.push({ jar, id, marker, editPatient, fields, editFicha, first, replacement });
  }
  const stored = await snapshot();
  for (const [owner, foreign] of [
    [owners[0], owners[1]],
    [owners[1], owners[0]],
  ]) {
    const jar = foreign.jar,
      id = owner.id;
    const routes = [
      ['/api/pacientes/perfil', { id }],
      ['/api/pacientes/edicion', { id }],
      ['/api/pacientes/actualizar', owner.editPatient],
      ['/api/fichas-clinicas/consultar', { pacienteId: id }],
      ['/api/fichas-clinicas/edicion', { pacienteId: id }],
      [
        '/api/fichas-clinicas/actualizar',
        { pacienteId: id, version: owner.editFicha.ficha.version, ...owner.fields },
      ],
      ['/api/sesiones-clinicas/historial', { pacienteId: id, pagina: 1 }],
      ['/api/sesiones-clinicas/detalle', { pacienteId: id, sesionId: owner.first.id }],
      ['/api/sesiones-clinicas/edicion', { pacienteId: id, sesionId: owner.first.id }],
      ['/api/sesiones-clinicas/actualizar', owner.replacement],
    ];
    for (const [path, payload] of routes) await call(jar, path, payload, 404);
    assert.deepEqual(
      (await call(jar, '/api/pacientes/consulta', { busqueda: owner.marker, pagina: 1 })).pacientes,
      [],
    );
  }
  assert.deepEqual(await snapshot(), stored);
  console.log(
    'Integración MVP: dos recorridos HTTP nuevos, persistencia tras cada guardado, recursos vecinos intactos, orden y aislamiento bidireccional aprobados. Identidad/correo ficticios; PostgreSQL real.',
  );
}
