import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShieldCheck, Bell, BarChart3, Eye, EyeOff, AlertCircle, Languages } from 'lucide-react';

export function LoginPage() {
  useTranslation();
  const t = i18n.t.bind(i18n);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('login.error_required'));
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || t('login.error_invalid'));
    }
  };

  const demoAccounts = [
    { role: t('role.admin'), email: 'admin@test.fr', password: 'admin123', color: 'bg-purple-500' },
    { role: t('role.test_lead'), email: 'chef@test.fr', password: 'chef123', color: 'bg-sky-500' },
    { role: t('role.tester'), email: 'testeur@test.fr', password: 'testeur123', color: 'bg-emerald-500' },
    { role: t('role.developer'), email: 'dev@test.fr', password: 'dev123', color: 'bg-amber-500' },
  ];

  const features = [
    { icon: ShieldCheck, label: t('login.feature_anomaly'), desc: t('login.feature_anomaly_desc') },
    { icon: Bell, label: t('login.feature_notifications'), desc: t('login.feature_notifications_desc') },
    { icon: BarChart3, label: t('login.feature_reporting'), desc: t('login.feature_reporting_desc') },
  ];

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: '#0F172A' }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 50%, #4F46E5 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0EA5E9 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo.svg" alt="DHI" className="w-10 h-10 rounded-xl" />
            <div>
              <div className="font-bold text-white text-lg tracking-tight">{t('app.title')}</div>
              <div className="text-white/40 text-[10px] font-mono tracking-widest">{t('app.subtitle')}</div>
            </div>
          </div>

          <div className="mb-12">
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">
              {t('login.hero_title')}
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              {t('login.hero_desc')}
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="w-full h-px mb-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">4</div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{t('login.roles')}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">10</div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{t('login.screens')}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">∞</div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{t('login.projects')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative" style={{ background: '#F0F4F8' }}>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all"
        >
          <Languages className="w-3.5 h-3.5" />
          {i18n.language === 'fr' ? 'EN' : 'FR'}
        </button>
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.svg" alt="DHI" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-slate-800">{t('app.title')}</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{t('login.title')}</h2>
            <p className="text-slate-500 text-sm mt-1">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('login.email_label')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="h-10 bg-white border-slate-200 text-slate-900 focus:border-indigo-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('login.password_label')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.password_placeholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 bg-white border-slate-200 text-slate-900 focus:border-indigo-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('app.loading')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] text-slate-400 font-mono tracking-widest">{t('login.demo_title')}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(account => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => { setEmail(account.email); setPassword(account.password); }}
                  className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                >
                  <div className={`w-5 h-5 ${account.color} rounded-full flex-shrink-0`} />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700 truncate">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-3">
              {t('login.demo_hint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
