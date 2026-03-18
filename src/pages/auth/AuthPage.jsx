import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithEmail, signInWithOAuth, authLoading } = useAuth({ skipSession: true });
  const errorMessage = searchParams.get('error');

  const schema = useMemo(
    () =>
      z.object({
        fullName: mode === 'signup' ? z.string().min(2, 'Enter your name.') : z.string().optional(),
        email: z.string().email('Enter a valid email.'),
        password: z.string().min(8, 'Use at least 8 characters.'),
      }),
    [mode],
  );

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  return (
    <PageWrapper className="flex min-h-screen items-center">
      <Card className="w-full p-6">
        <div className="section-label mb-2">FORGE access</div>
        <h1 className="display-title text-5xl">{mode === 'signup' ? 'Create your forge' : 'Welcome back'}</h1>
        <p className="mt-3 text-sm leading-6 text-forge-muted2">
          {mode === 'signup'
            ? 'Start the full 60-day self-mastery protocol with your personalized onboarding.'
            : 'Pick up the protocol where you left it.'}
        </p>
        {errorMessage ? <p className="mt-3 border border-forge-red/30 bg-forge-red/10 px-3 py-3 text-sm text-forge-red">{errorMessage}</p> : null}

        <div className="mt-6 grid gap-3">
          <Button type="button" className="w-full" onClick={() => signInWithOAuth('google')} disabled={authLoading}>
            Continue with Google
          </Button>
          <Button type="button" className="w-full" variant="secondary" onClick={() => signInWithOAuth('apple')} disabled={authLoading}>
            Continue with Apple
          </Button>
        </div>

        <div className="my-5 text-center font-condensed text-[0.7rem] font-bold uppercase tracking-[0.2em] text-forge-muted2">or use email</div>

        <form
          className="grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            const result = await signInWithEmail({
              mode,
              email: values.email,
              password: values.password,
              fullName: values.fullName,
            });

            if (result?.redirectTo) {
              navigate(result.redirectTo, { replace: true });
            }
          })}
        >
          {mode === 'signup' ? (
            <div>
              <Input placeholder="Full name" {...register('fullName')} />
              {errors.fullName ? <p className="mt-1 text-xs text-forge-red">{errors.fullName.message}</p> : null}
            </div>
          ) : null}
          <div>
            <Input type="email" placeholder="Email" {...register('email')} />
            {errors.email ? <p className="mt-1 text-xs text-forge-red">{errors.email.message}</p> : null}
          </div>
          <div>
            <Input type="password" placeholder="Password" {...register('password')} />
            {errors.password ? <p className="mt-1 text-xs text-forge-red">{errors.password.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={authLoading}>
            {mode === 'signup' ? 'Start Onboarding' : 'Enter FORGE'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-forge-muted2">
          {mode === 'signup' ? 'Already have an account?' : 'New to FORGE?'}{' '}
          <Link className="text-forge-gold" to={mode === 'signup' ? '/login' : '/signup'}>
            {mode === 'signup' ? 'Log in' : 'Create one'}
          </Link>
        </div>
      </Card>
    </PageWrapper>
  );
}
