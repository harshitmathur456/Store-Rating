import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { signupSchema, type SignupInput } from '../../lib/schemas';
import { Eye, EyeOff, Star, Loader2, Check, X } from 'lucide-react';

function PasswordChecklist({ value }: { value: string }) {
  const checks = [
    { label: '8–16 characters', met: value.length >= 8 && value.length <= 16 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(value) },
    { label: 'One special character', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value) },
  ];

  return (
    <div className="mt-1.5 space-y-0.5">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5 text-[11px]">
          {c.met ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <X className="w-3 h-3 text-zinc-300" />
          )}
          <span className={c.met ? 'text-emerald-600' : 'text-zinc-400'}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: SignupInput) => {
    setServerError('');
    try {
      await signup(data);
      navigate('/login?registered=1');
    } catch (err: any) {
      const details = err.data?.error?.details;
      if (details) {
        setServerError(details.map((d: any) => d.message).join(' '));
      } else {
        setServerError(err.message || 'Signup failed.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[420px] bg-zinc-900 items-center justify-center p-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">StoreRating</span>
          </div>
          <p className="text-zinc-400 text-[15px] leading-relaxed max-w-[280px]">
            Create your account to start rating stores and discovering the best businesses near you.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <Star className="w-5 h-5 text-accent" />
            <span className="font-semibold text-[15px] text-zinc-900">StoreRating</span>
          </div>

          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Create your account</h1>
          <p className="text-[13px] text-zinc-500 mb-6">
            Fill in your details to get started
          </p>

          {serverError && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name')}
                className={`w-full h-9 px-3 text-[13px] rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.name ? 'border-red-300' : 'border-zinc-300 hover:border-zinc-400'
                }`}
                placeholder="Your full name (20-60 characters)"
              />
              {errors.name && (
                <p className="mt-1 text-[12px] text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full h-9 px-3 text-[13px] rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.email ? 'border-red-300' : 'border-zinc-300 hover:border-zinc-400'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Address
              </label>
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                {...register('address')}
                className={`w-full h-9 px-3 text-[13px] rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.address ? 'border-red-300' : 'border-zinc-300 hover:border-zinc-400'
                }`}
                placeholder="Your address"
              />
              {errors.address && (
                <p className="mt-1 text-[12px] text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={`w-full h-9 px-3 pr-9 text-[13px] rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                    errors.password ? 'border-red-300' : 'border-zinc-300 hover:border-zinc-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[12px] text-red-600">{errors.password.message}</p>
              )}
              <PasswordChecklist value={passwordValue} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
