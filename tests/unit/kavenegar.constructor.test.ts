import { KavenegarApi } from '../../src/kavenegar';

describe('KavenegarApi constructor', () => {
  it('throws without apikey', () => {
    // @ts-expect-error intentionally missing apikey
    expect(() => new KavenegarApi({})).toThrow('apikey is required');
  });
  it('sets defaults', () => {
    const api = new KavenegarApi({ apikey: 'TEST' });
    // @ts-ignore private access for test via casting
    expect((api as any).host).toBe('api.kavenegar.com');
    // @ts-ignore
    expect((api as any).version).toBe('v1');
  });
  it('accepts custom host/version', () => {
    const api = new KavenegarApi({ apikey: 'X', host: 'h.example', version: 'v2' });
    // @ts-ignore
    expect((api as any).host).toBe('h.example');
    // @ts-ignore
    expect((api as any).version).toBe('v2');
  });
});
