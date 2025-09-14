import { KavenegarApi } from '../../src/kavenegar';

const api = new KavenegarApi({ apikey: 'TESTKEY' });

describe('Validation: SendArray', () => {
  it('rejects non-arrays', () => {
    // @ts-expect-error
    expect(() => api.SendArray({ receptor: 'x', sender: [], message: []})).toThrow('receptor, sender and message must be arrays');
  });
  it('rejects length mismatch', () => {
    expect(() => api.SendArray({ receptor: ['a'], sender: ['b','c'], message: ['m'] })).toThrow('LengthMismatch');
  });
});

describe('Validation: Select', () => {
  it('requires messageid', () => {
    // @ts-expect-error
    expect(() => api.Select({})).toThrow('messageid is required');
  });
});

describe('Validation: Receive', () => {
  it('requires linenumber', () => {
    // The following line should compile fine
    expect(() => api.Receive({ isread: 1})).toThrow('linenumber is required');
  });
  it('requires isread', () => {
    // The following line should compile fine
    expect(() => api.Receive({ linenumber: '3000'})).toThrow('isread is required');
  });
});

describe('Validation: CallMakeTTS', () => {
  it('requires receptor', () => {
    // @ts-expect-error
    expect(() => api.CallMakeTTS({ message: 'hello'})).toThrow('receptor is required');
  });
  it('requires message', () => {
    // @ts-expect-error
    expect(() => api.CallMakeTTS({ receptor: '0912'})).toThrow('message is required');
  });
});
