import { KavenegarApi } from '../../src/kavenegar';

const api = new KavenegarApi({ apikey: 'KEY' });

// Utility to shift current time secs
const nowSec = () => Math.floor(Date.now() / 1000);

describe('SelectOutbox validation', () => {
  it('rejects missing startdate', () => {
    // @ts-ignore
    expect(() => api.SelectOutbox({})).toThrow('startdate');
  });
  it('rejects startdate older than 4 days', () => {
    const startdate = nowSec() - (5 * 86400);
    expect(() => api.SelectOutbox({ startdate })).toThrow('older than 4 days');
  });
  it('rejects enddate < startdate', () => {
    const startdate = nowSec() - 1000;
    expect(() => api.SelectOutbox({ startdate, enddate: startdate - 10})).toThrow('enddate cannot be less');
  });
});

describe('CountOutbox validation', () => {
  it('rejects startdate older than 4 days', () => {
    const startdate = nowSec() - (5 * 86400);
    expect(() => api.CountOutbox({ startdate })).toThrow('older than 4 days');
  });
  it('rejects span > 1 day when end provided', () => {
    const startdate = nowSec() - 1000;
    expect(() => api.CountOutbox({ startdate, enddate: startdate + 90000})).toThrow('Maximum allowed range');
  });
});

describe('InboxPaged validation', () => {
  it('rejects missing linenumber', () => {
    // @ts-ignore
    expect(() => api.InboxPaged({ isread: 1 })).toThrow('linenumber is required');
  });
  it('rejects enddate < startdate', () => {
    const start = nowSec() - 1000;
    expect(() => api.InboxPaged({ linenumber: '3000', isread: 0, startdate: start, enddate: start - 1})).toThrow('enddate cannot be less');
  });
});

describe('CountInbox validation', () => {
  it('rejects startdate older than 60 days', () => {
    const startdate = nowSec() - (61 * 86400);
    expect(() => api.CountInbox({ startdate })).toThrow('older than 60 days');
  });
});

describe('StatusByReceptor validation', () => {
  it('requires receptor', () => {
    // @ts-ignore
    expect(() => api.StatusByReceptor({ startdate: nowSec() })).toThrow('receptor is required');
  });
  it('rejects range > 1 day', () => {
    const startdate = nowSec() - 1000;
    expect(() => api.StatusByReceptor({ receptor: '0912', startdate, enddate: startdate + 90000})).toThrow('Maximum allowed range');
  });
});

describe('LineBlockedList validation', () => {
  it('requires linenumber', () => {
    // @ts-ignore
    expect(() => api.LineBlockedList({})).toThrow('linenumber is required');
  });
});

describe('AccountConfig normalization', () => {
  it('normalizes booleans to enabled/disabled', async () => {
    // Mock request using jest spy to avoid network - monkey patch private request
    const spy = jest.spyOn<any, any>(api as any, 'request').mockResolvedValue({ entries: { debugmode: 'enabled' }, return: { status: 200, message: 'OK' }});
    await api.AccountConfig({ debugmode: true });
    expect(spy).toHaveBeenCalled();
  const payload: any = spy.mock.calls[0][2];
  expect(payload.debugmode).toBe('enabled');
    spy.mockRestore();
  });
});
