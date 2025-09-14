import nock from 'nock';
import { KavenegarApi, SendParams, StatusEntry } from '../../src/kavenegar';

const apikey = 'TESTKEY';
const api = new KavenegarApi({ apikey });

// Helper to build path prefix
const base = `/${'v1'}/${apikey}`;

describe('Integration (mocked HTTP)', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('Send success', async () => {
    const params: SendParams = { receptor: '09120000000', message: 'Hello' };
    const scope = nock('https://api.kavenegar.com')
      .post(`${base}/sms/send.json`)
      .reply(200, {
        entries: [{ messageid: 123, status: 1, statustext: 'InQueue'}],
        return: { status: 200, message: 'OK' }
      });
    const res = await api.Send(params);
    expect(res.return.status).toBe(200);
    expect(scope.isDone()).toBe(true);
  });

  it('Status list', async () => {
    const scope = nock('https://api.kavenegar.com')
      .post(`${base}/sms/status.json`)
      .reply(200, {
        entries: [{ messageid: 1, status: 10, statustext: 'Delivered'} as StatusEntry],
        return: { status: 200, message: 'OK' }
      });
    const res = await api.Status({ messageid: 1 });
    expect(res.entries[0].status).toBe(10);
    expect(scope.isDone()).toBe(true);
  });

  it('handles invalid JSON', async () => {
    const scope = nock('https://api.kavenegar.com')
      .post(`${base}/sms/send.json`)
      .reply(200, 'not-json');
    await expect(api.Send({ receptor: '0', message: 'x'})).rejects.toBeTruthy();
    expect(scope.isDone()).toBe(true);
  });
});
