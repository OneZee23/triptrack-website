// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';

const mocks = vi.hoisted(() => ({
  init: vi.fn(), signIn: vi.fn(), login: vi.fn(), signedIn: vi.fn(), navigate: vi.fn(),
}));
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../i18n/useTranslation', () => ({ useTranslation: () => ({ t: (key: string) => key, href: (path: string) => path }) }));
vi.mock('./useAuth', () => ({ useAuth: () => ({ signedIn: mocks.signedIn }) }));
vi.mock('./api', async (importOriginal) => ({ ...await importOriginal<typeof import('./api')>(), login: mocks.login }));
vi.mock('./appleSdk', async (importOriginal) => ({
  ...await importOriginal<typeof import('./appleSdk')>(),
  loadAppleSdk: async () => ({ init: mocks.init, signIn: mocks.signIn }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.login.mockResolvedValue({ account: { id: 'account' } });
});
afterEach(cleanup);

describe('Apple popup response binding', () => {
  it('exchanges only a response bound to this attempt and sends the raw nonce', async () => {
    mocks.signIn.mockImplementation(async () => ({
      authorization: { id_token: 'apple-token', state: mocks.init.mock.calls[0][0].state },
    }));
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'app.login.button' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/app/trips', { replace: true }));
    const config = mocks.init.mock.calls[0][0];
    expect(config.state).toMatch(/^[0-9a-f]{32}$/);
    expect(config.nonce).toMatch(/^[0-9a-f]{64}$/);
    expect(config.redirectURI).toBe(`${window.location.origin}/app/login`);
    expect(mocks.login).toHaveBeenCalledWith('apple-token', expect.stringMatching(/^[0-9a-f]{32}$/));
    expect(mocks.login.mock.calls[0][1]).not.toBe(config.nonce);
  });

  it.each([undefined, 'another-attempt'])('rejects absent or mismatched state (%s) before creating a session', async (state) => {
    mocks.signIn.mockResolvedValue({ authorization: { id_token: 'apple-token', state } });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'app.login.button' }));
    await screen.findByText('app.error.apple');
    expect(mocks.login).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
