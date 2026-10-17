import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  KeyRound,
  Shield,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useAuth } from '../../app/AuthContext';
import { changePasswordSchema, type ChangePasswordInput } from '../../lib/schemas';

const roleLabels: Record<string, string> = {
  ADMIN: 'System Administrator',
  USER: 'Normal User',
  OWNER: 'Store Owner',
};

export default function SettingsPage() {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const watchedNewPassword = watch('newPassword', '');
  const pwdChecks = {
    length: watchedNewPassword.length >= 8 && watchedNewPassword.length <= 16,
    uppercase: /[A-Z]/.test(watchedNewPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(watchedNewPassword),
  };

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) => api.patch('/auth/password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: (err: any) => {
      const msg = err.data?.error?.message || err.message || 'Failed to change password';
      toast.error(msg);
    },
  });

  const onSubmit = (formData: ChangePasswordInput) => {
    changePasswordMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent" />
          Account & Security Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your account profile details and update your security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs space-y-4 h-fit">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-400" /> Profile Information
          </h3>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg mx-auto mb-2.5">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-sm text-zinc-900 leading-tight">{user?.name}</p>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-accent/10 text-accent">
              {user?.role ? roleLabels[user.role] : 'Authenticated User'}
            </span>
          </div>

          <div className="space-y-3 pt-2 text-xs text-zinc-600">
            <div className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-medium">Email</span>
                <span className="font-mono text-zinc-800 break-all">{user?.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-medium">Role Access</span>
                <span className="text-zinc-800">{user?.role ? roleLabels[user.role] : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs">
          <div className="border-b border-zinc-100 pb-4 mb-5">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" /> Change Password
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Update your password to keep your account secure.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('currentPassword')}
                type="password"
                placeholder="Enter current password"
                className={`w-full h-9 px-3 text-xs rounded-lg border ${
                  errors.currentPassword ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
                } focus:border-accent focus:outline-none`}
              />
              {errors.currentPassword && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('newPassword')}
                type="password"
                placeholder="Enter new strong password"
                className={`w-full h-9 px-3 text-xs rounded-lg border ${
                  errors.newPassword ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
                } focus:border-accent focus:outline-none`}
              />

              {/* Requirements checklist */}
              <div className="mt-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${pwdChecks.length ? 'text-emerald-700 font-medium' : 'text-zinc-500'}`}>
                  {pwdChecks.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-300" />}
                  8 to 16 characters
                </div>
                <div className={`flex items-center gap-1.5 ${pwdChecks.uppercase ? 'text-emerald-700 font-medium' : 'text-zinc-500'}`}>
                  {pwdChecks.uppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-300" />}
                  At least one uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${pwdChecks.special ? 'text-emerald-700 font-medium' : 'text-zinc-500'}`}>
                  {pwdChecks.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-300" />}
                  At least one special character (!@#$%^&*...)
                </div>
              </div>

              {errors.newPassword && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Re-type new password"
                className={`w-full h-9 px-3 text-xs rounded-lg border ${
                  errors.confirmPassword ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-300'
                } focus:border-accent focus:outline-none`}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="px-3.5 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {changePasswordMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
