import { generateTemporaryPassword } from './password.util';

describe('generateTemporaryPassword', () => {
  it('gera senha com tamanho padrão', () => {
    const password = generateTemporaryPassword();
    expect(password).toHaveLength(12);
  });

  it('gera senhas diferentes', () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).not.toBe(b);
  });
});
