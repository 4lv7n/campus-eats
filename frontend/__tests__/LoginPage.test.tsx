import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import { LOGIN } from '@/services/auth';

const push = jest.fn();
const login = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: jest.fn() }) }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ user: null, login }) }));

const student = { id: 'u1', name: 'Student', email: 'student@example.com', role: 'STUDENT', isActive: true, outletId: null };

function setup(mocks: MockedResponse[]) {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <LoginPage />
    </MockedProvider>,
  );
}
async function fill(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
  // wait until the request finished and the button is usable again
  await waitFor(() => expect(screen.getByRole('button', { name: /^login$/i })).toBeEnabled());
}

describe('LoginPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs in, saves the token and redirects a student to /dashboard', async () => {
    setup([
      {
        request: { query: LOGIN, variables: { input: { email: 'student@example.com', password: 'Password123!' } } },
        result: { data: { login: { accessToken: 'jwt-token', user: student } } },
      },
    ]);
    await fill('student@example.com', 'Password123!');
    await waitFor(() => expect(login).toHaveBeenCalledWith('jwt-token', student));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows a friendly message for invalid credentials', async () => {
    setup([
      {
        request: { query: LOGIN, variables: { input: { email: 'student@example.com', password: 'wrong' } } },
        result: { errors: [{ message: 'Invalid email or password.' } as never] },
      },
    ]);
    await fill('student@example.com', 'wrong');
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(login).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('sends outlet staff to the outlet dashboard', async () => {
    const staff = { ...student, role: 'OUTLET_STAFF', outletId: 'o1' };
    setup([
      {
        request: { query: LOGIN, variables: { input: { email: 'shawarma@example.com', password: 'Password123!' } } },
        result: { data: { login: { accessToken: 't', user: staff } } },
      },
    ]);
    await fill('shawarma@example.com', 'Password123!');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/outlet-dashboard'));
  });
});
