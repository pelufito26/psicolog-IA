import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto';
import { AccessError, type IdentityProvider, type Mailer, type Identity } from './contracts.js';
import { AccessStore } from './store.js';
export const opaque = () => randomBytes(32).toString('base64url');
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export class AccessService {
  constructor(
    public readonly store: AccessStore,
    public readonly identity: IdentityProvider,
    private readonly mail: Mailer,
    private readonly secret: string,
    private readonly clock = () => Date.now(),
    private readonly allowedEmail?: string,
  ) {}
  csrf(token: string) {
    return createHmac('sha256', this.secret)
      .update('csrf:' + token)
      .digest('hex');
  }
  private digest(purpose: string, value: string) {
    return createHmac('sha256', this.secret)
      .update(purpose + ':' + value)
      .digest('hex');
  }
  async throttle(origin: string) {
    await this.store.limit(this.digest('origen', origin), this.clock(), 30);
  }
  private async send(identity: Identity) {
    if (this.allowedEmail && identity.email.trim().toLowerCase() !== this.allowedEmail)
      throw new AccessError(401, 'INGRESO_REQUERIDO');
    await this.store.limit(
      this.digest('cuenta', identity.email.trim().toLowerCase()),
      this.clock(),
      5,
      60000,
    );
    const token = opaque(),
      code = String(randomInt(1000000)).padStart(6, '0');
    await this.store.pending(
      hash(token),
      identity,
      this.digest('codigo', token + ':' + code),
      this.clock(),
    );
    try {
      await this.mail.send(identity.email, code);
      await this.store.delivered(hash(token), true);
    } catch {
      await this.store.delivered(hash(token), false);
      throw new AccessError(503, 'CORREO_NO_DISPONIBLE');
    }
    return token;
  }
  async login(email: string, password: string) {
    const identity = await this.identity.login(email, password);
    await this.store.account(identity);
    return this.send(identity);
  }
  async resend(token: string) {
    const identity = await this.store.pendingIdentity(hash(token), this.clock());
    return this.send(identity);
  }
  async verify(token: string, code: string) {
    if (this.allowedEmail) {
      const identity = await this.store.pendingIdentity(hash(token), this.clock());
      if (identity.email.trim().toLowerCase() !== this.allowedEmail)
        throw new AccessError(401, 'INGRESO_REQUERIDO');
    }
    const session = opaque();
    await this.store.verify(
      hash(token),
      this.digest('codigo', token + ':' + code),
      hash(session),
      this.clock(),
    );
    return session;
  }
  async session(token: string) {
    return this.store.session(hash(token), this.clock(), this.allowedEmail);
  }
  async logout(token: string) {
    await this.store.revoke(hash(token));
  }
  async reset(tokenHash: string, password: string) {
    const id = await this.identity.reset(tokenHash, password, (id) =>
      this.store.revokeUser(id, true),
    );
    await this.store.revokeUser(id, false);
  }
}
