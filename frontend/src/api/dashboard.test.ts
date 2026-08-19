import { getDashboardSnapshot } from './dashboard';
import { apiClient } from './client';
import { dashboardSnapshotFixture } from '../mocks/dashboard';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn() },
}));

describe('getDashboardSnapshot', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('busca o snapshot via GET /dashboard, passando por apiClient (nunca fetch direto)', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue(dashboardSnapshotFixture);

    const result = await getDashboardSnapshot();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard');
    expect(result).toEqual(dashboardSnapshotFixture);
  });
});
