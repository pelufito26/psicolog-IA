import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { AccessError, type Identity } from './contracts.js';
export class AccessStore {
  constructor(private readonly pool: Pool) {}
  async tx<T>(action: (c: PoolClient) => Promise<T>): Promise<T> {
    const c = await this.pool.connect();
    let failed = false;
    try {
      await c.query('BEGIN');
      const result = await action(c);
      await c.query('COMMIT');
      return result;
    } catch (e) {
      try {
        await c.query('ROLLBACK');
      } catch {
        failed = true;
      }
      throw e;
    } finally {
      c.release(failed);
    }
  }
  async account(identity: Identity) {
    return this.tx(async (c) => {
      await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [identity.id]);
      const existing = await c.query(
        'select profesional,bloqueada from acceso.cuentas where usuario=$1',
        [identity.id],
      );
      if (existing.rows[0]?.bloqueada) throw new AccessError(401, 'RECUPERACION_REQUERIDA');
      if (existing.rowCount) return existing.rows[0].profesional as string;
      const professional = randomUUID();
      await c.query(
        'insert into psicologia.profesionales(id,nombre,apellido,email) values($1,$2,$3,$4)',
        [professional, identity.nombre, identity.apellido, identity.email],
      );
      await c.query('insert into acceso.cuentas(usuario,profesional) values($1,$2)', [
        identity.id,
        professional,
      ]);
      return professional;
    });
  }
  async limit(key: string, now: number, max: number, spacing = 0) {
    const allowed = await this.tx(async (c) => {
      await c.query('insert into acceso.limites values($1,$2,0,0) on conflict do nothing', [
        key,
        now,
      ]);
      const row = (await c.query('select * from acceso.limites where clave=$1 for update', [key]))
        .rows[0];
      const count = now - Number(row.inicio) >= 900000 ? 0 : row.cantidad;
      if (count >= max || now - Number(row.ultimo) < spacing) return false;
      await c.query('update acceso.limites set inicio=$2,cantidad=$3,ultimo=$4 where clave=$1', [
        key,
        count === 0 ? now : Number(row.inicio),
        count + 1,
        now,
      ]);
      return true;
    });
    if (!allowed) throw new AccessError(429, 'LIMITE_ALCANZADO');
  }
  async pending(hash: string, identity: Identity, code: string, now: number) {
    await this.tx(async (c) => {
      const account = await c.query(
        'select bloqueada from acceso.cuentas where usuario=$1 for update',
        [identity.id],
      );
      if (!account.rowCount || account.rows[0].bloqueada)
        throw new AccessError(401, 'INGRESO_REQUERIDO');
      await c.query("update acceso.intentos set estado='consumido' where usuario=$1", [
        identity.id,
      ]);
      await c.query(
        "insert into acceso.intentos(hash,usuario,codigo,vence,estado,creado,email) values($1,$2,$3,$4,'pendiente',$5,$6)",
        [hash, identity.id, code, now + 300000, now, identity.email],
      );
    });
  }
  async delivered(hash: string, ok: boolean) {
    await this.pool.query(
      "update acceso.intentos set estado=$2 where hash=$1 and estado='pendiente'",
      [hash, ok ? 'enviado' : 'fallido'],
    );
  }
  async pendingIdentity(hash: string, now: number): Promise<Identity> {
    const row = (
      await this.pool.query(
        "select i.usuario as id,i.email,p.nombre,p.apellido from acceso.intentos i join acceso.cuentas a on a.usuario=i.usuario join psicologia.profesionales p on p.id=a.profesional where i.hash=$1 and i.estado in ('enviado','fallido') and i.vence>$2",
        [hash, now],
      )
    ).rows[0];
    if (!row) throw new AccessError(401, 'INGRESO_REQUERIDO');
    return row;
  }
  async verify(hash: string, code: string, sessionHash: string, now: number) {
    const accepted = await this.tx(async (c) => {
      const owner = (await c.query('select usuario from acceso.intentos where hash=$1', [hash]))
        .rows[0];
      if (!owner) return false;
      const account = (
        await c.query('select bloqueada from acceso.cuentas where usuario=$1 for update', [
          owner.usuario,
        ])
      ).rows[0];
      if (!account || account.bloqueada) return false;
      const row = (await c.query('select * from acceso.intentos where hash=$1 for update', [hash]))
        .rows[0];
      if (!row || row.estado !== 'enviado' || Number(row.vence) <= now || row.intentos >= 5)
        return false;
      // HMAC values are fixed-length and compared in PostgreSQL only within this locked row.
      if (row.codigo !== code) {
        await c.query('update acceso.intentos set intentos=intentos+1 where hash=$1', [hash]);
        return false;
      }
      await c.query("update acceso.intentos set estado='consumido' where hash=$1", [hash]);
      await c.query(
        'insert into acceso.sesiones(hash,usuario,vence,actividad,intento) values($1,$2,$3,$4,$5)',
        [sessionHash, row.usuario, now + 28800000, now, hash],
      );
      return true;
    });
    if (!accepted) throw new AccessError(401, 'CODIGO_INVALIDO');
  }
  async session(
    hash: string,
    now: number,
  ): Promise<{ usuario: string; profesional: string } | null> {
    const result = await this.pool.query(
      'update acceso.sesiones s set actividad=$2 from acceso.cuentas a where s.usuario=a.usuario and not a.bloqueada and s.hash=$1 and not s.revocada and s.vence>$2 and s.actividad>$3 returning s.usuario,a.profesional',
      [hash, now, now - 1800000],
    );
    return result.rows[0] ?? null;
  }
  async revoke(hash: string) {
    await this.tx(async (c) => {
      const row = (
        await c.query(
          'select usuario from acceso.sesiones where hash=$1 union select usuario from acceso.intentos where hash=$1',
          [hash],
        )
      ).rows[0];
      if (!row) return;
      await c.query('select usuario from acceso.cuentas where usuario=$1 for update', [
        row.usuario,
      ]);
      await c.query('update acceso.sesiones set revocada=true where hash=$1 or intento=$1', [hash]);
      await c.query("update acceso.intentos set estado='consumido' where hash=$1", [hash]);
    });
  }
  async revokeUser(id: string, blocked: boolean) {
    await this.tx(async (c) => {
      await c.query('update acceso.cuentas set bloqueada=$2 where usuario=$1', [id, blocked]);
      await c.query('update acceso.sesiones set revocada=true where usuario=$1', [id]);
      await c.query("update acceso.intentos set estado='consumido' where usuario=$1", [id]);
    });
  }
}
