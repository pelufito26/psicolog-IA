export interface Identity {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
}
export interface IdentityProvider {
  register(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
  }): Promise<void>;
  confirm(hash: string): Promise<void>;
  resend(email: string): Promise<void>;
  login(email: string, password: string): Promise<Identity>;
  recover(email: string): Promise<void>;
  reset(hash: string, password: string, before: (id: string) => Promise<void>): Promise<string>;
}
export interface Mailer {
  send(email: string, code: string): Promise<void>;
}
export class AccessError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}
