import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/core/api/request';
import { downloadReportCsv, getReportOverview, getTransactions, isExpense } from '@/core/api/finance-api';

type FetchArguments = [input: string, init?: RequestInit];

function respondWith(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as unknown as Response;
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<(...args: FetchArguments) => Promise<Response>>(async () => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('downloadReportCsv', () => {
  // Regression guard: this used to throw a plain Error, which bypassed the
  // ApiError-based token refresh inside authorizedRequest.
  it('reports an expired session as a 401 ApiError so callers can refresh', async () => {
    stubFetch(respondWith(401, '{"title":"Unauthorized"}'));

    const error = await downloadReportCsv('expired-token', '2026-04', '2026-09').catch(
      (failure: unknown) => failure,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it('sends the bearer token and returns the csv body on success', async () => {
    const csv = 'Secao;Referencia\nResumo;2026-09\n';
    const fetchMock = stubFetch(respondWith(200, csv));

    await expect(downloadReportCsv('token', '2026-04', '2026-09')).resolves.toBe(csv);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/api/v1/reports/export.csv?from=2026-04&to=2026-09');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token');
  });
});

describe('getReportOverview', () => {
  it('requests the selected period', async () => {
    const fetchMock = stubFetch(respondWith(200, '{"monthCount":6}'));

    await getReportOverview('token', '2026-04', '2026-09');

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/api/v1/reports/overview?from=2026-04&to=2026-09');
  });
});

describe('getTransactions', () => {
  it('bounds both endpoints to the selected month and sorts newest first', async () => {
    const incomes = [{ id: 'i1', description: 'Salário', amount: 100, transactionDate: '2026-09-05' }];
    const expenses = [
      { id: 'e1', description: 'Mercado', amount: 40, transactionDate: '2026-09-20', category: 'FOOD' },
      { id: 'e2', description: 'Ônibus', amount: 10, transactionDate: '2026-09-10', category: 'TRANSPORT' },
    ];
    const fetchMock = vi.fn<(...args: FetchArguments) => Promise<Response>>(async (url: string) =>
      respondWith(200, JSON.stringify(url.includes('/incomes') ? incomes : expenses)),
    );
    vi.stubGlobal('fetch', fetchMock);

    const entries = await getTransactions('token', '2026-09');

    const requested = fetchMock.mock.calls.map(call => call[0]);
    expect(requested).toHaveLength(2);
    expect(requested.every(url => url.includes('from=2026-09-01') && url.includes('to=2026-09-31'))).toBe(true);
    expect(entries.map(entry => entry.id)).toEqual(['e1', 'e2', 'i1']);
    expect(entries.filter(isExpense)).toHaveLength(2);
  });
});
