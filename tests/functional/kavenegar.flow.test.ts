import nock from 'nock';
import { KavenegarApi } from '../../src/kavenegar';

describe('Functional scenario', () => {
  const apikey = 'FLOWKEY';
  const api = new KavenegarApi({ apikey });
  const base = `/v1/${apikey}`;

  afterEach(() => nock.cleanAll());

  it('sends and then checks status (happy path)', async () => {
    // 1. Send
    nock('https://api.kavenegar.com')
      .post(`${base}/sms/send.json`)
      .reply(200, {
        entries: [{ messageid: 555, status: 1, statustext: 'InQueue' }],
        return: { status: 200, message: 'OK' }
      });

    const sendRes = await api.Send({ receptor: '09120000000', message: 'Code 1234' });
    const id = (sendRes.entries as any)[0].messageid;

    // 2. Poll status
    nock('https://api.kavenegar.com')
      .post(`${base}/sms/status.json`)
      .reply(200, {
        entries: [{ messageid: id, status: 10, statustext: 'Delivered' }],
        return: { status: 200, message: 'OK' }
      });

    const statusRes = await api.Status({ messageid: id });
    expect(statusRes.entries[0].statustext).toMatch(/Delivered/i);
  });
});
