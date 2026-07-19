import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Cloud, Cpu, Landmark, LockKeyhole, Network, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { fetchPulseStats, type PulseStats } from '../lib/api';
import { TRANSLATIONS } from '../lib/translations';

interface BusinessImpactProps {
  language: string;
}

export default function BusinessImpact({ language }: BusinessImpactProps) {
  const [stats, setStats] = useState<PulseStats | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    fetchPulseStats().then((response) => {
      if (response.success) setStats(response.data);
    }).catch((error) => console.error(error));
  }, []);

  const onDeviceShare = stats && stats.totalChecksToday > 0
    ? Math.round((stats.onDeviceCount / stats.totalChecksToday) * 100)
    : null;
  const hasMeaningfulTelemetry = stats && stats.totalChecksToday >= 10 && onDeviceShare !== null;
  const unitEconomicsCopy = hasMeaningfulTelemetry
    ? t["about.impactUnitMeasured"].replace('{percentage}', String(onDeviceShare))
    : t["about.impactUnitStructural"];

  const businessModels = [
    [Landmark, 'impact.modelB2gTitle', 'impact.modelB2gTarget', 'impact.modelB2gDesc'],
    [Building2, 'impact.modelB2bTitle', 'impact.modelB2bTarget', 'impact.modelB2bDesc'],
    [Users, 'impact.modelFreemiumTitle', 'impact.modelFreemiumTarget', 'impact.modelFreemiumDesc'],
  ] as const;
  const proofPoints = ['impact.proofPrecision', 'impact.proofCampaigns', 'impact.proofLanguages', 'impact.proofInvestigator'] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-12">
      <section className="rounded-3xl bg-gradient-to-br from-[#102a64] via-[#1E3A8A] to-[#2855aa] px-6 py-14 text-center text-white shadow-xl sm:px-12">
        <p className="mb-4 text-xs font-mono uppercase tracking-[0.25em] text-blue-200">{t["impact.eyebrow"]}</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl">{t["impact.heroTitle"]}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-blue-100">{t["impact.heroSubtitle"]}</p>
      </section>

      <section>
        <div className="mb-7 text-center"><p className="text-xs font-mono uppercase tracking-widest text-red-700">{t["impact.problemEyebrow"]}</p><h2 className="mt-2 text-3xl font-bold text-gray-900">{t["impact.problemTitle"]}</h2></div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['₹64,447 Cr', 'impact.statLoss'], ['97%', 'impact.statRecovery'], ['12.71 Lakh', 'impact.statComplaints'], ['1 per second', 'impact.statHelpline']
          ].map(([value, label]) => <div key={label} className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"><div className="text-3xl font-extrabold text-red-700">{value}</div><p className="mt-3 text-sm leading-relaxed text-gray-600">{t[label]}</p></div>)}
        </div>
        <p className="mx-auto mt-5 max-w-3xl text-center text-base font-semibold text-gray-700">{t["impact.problemClose"]}</p>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3"><TrendingUp className="h-6 w-6 text-amber-700" /><div><p className="text-xs font-mono uppercase tracking-widest text-amber-700">{t["impact.whyNowEyebrow"]}</p><h2 className="text-2xl font-bold text-gray-900">{t["impact.whyNowTitle"]}</h2></div></div>
        <div className="grid gap-4 md:grid-cols-3">{['impact.whyNowPayments', 'impact.whyNowAi', 'impact.whyNowCrossBorder'].map((key) => <p key={key} className="rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">{t[key]}</p>)}</div>
      </section>

      <section>
        <div className="mb-7 text-center"><p className="text-xs font-mono uppercase tracking-widest text-[#1E3A8A]">{t["impact.modelEyebrow"]}</p><h2 className="mt-2 text-3xl font-bold text-gray-900">{t["impact.modelTitle"]}</h2></div>
        <div className="grid gap-5 md:grid-cols-3">{businessModels.map(([Icon, title, target, description]) => <article key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><Icon className="mb-5 h-7 w-7 text-[#1E3A8A]" /><h3 className="text-lg font-bold text-gray-900">{t[title]}</h3><p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">{t[target]}</p><p className="mt-3 text-sm leading-relaxed text-gray-600">{t[description]}</p></article>)}</div>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4"><div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Cpu className="h-7 w-7" /></div><div><p className="text-xs font-mono uppercase tracking-widest text-emerald-700">{t["about.impactUnitEyebrow"]}</p><h2 className="mt-1 text-3xl font-bold text-gray-900">{t["impact.unitTitle"]}</h2><p className="mt-4 max-w-4xl text-sm leading-relaxed text-gray-700">{unitEconomicsCopy}</p></div></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-white p-4"><div className="flex justify-between text-sm font-bold text-gray-800"><span>{t["impact.cloudOnly"]}</span><Cloud className="h-4 w-4" /></div><div className="mt-3 h-3 w-full rounded-full bg-red-200"><div className="h-3 w-full rounded-full bg-red-500" /></div><p className="mt-2 text-xs text-gray-500">{t["impact.cloudOnlyDesc"]}</p></div><div className="rounded-xl bg-white p-4"><div className="flex justify-between text-sm font-bold text-gray-800"><span>{t["impact.rakshakCurve"]}</span><Cpu className="h-4 w-4" /></div><div className="mt-3 h-3 w-full rounded-full bg-emerald-100"><div className="h-3 rounded-full bg-emerald-500" style={{ width: `${hasMeaningfulTelemetry ? Math.max(5, 100 - (onDeviceShare || 0)) : 35}%` }} /></div><p className="mt-2 text-xs text-gray-500">{t["impact.rakshakCurveDesc"]}</p></div></div>
      </section>

      <section>
        <div className="mb-7 text-center"><p className="text-xs font-mono uppercase tracking-widest text-violet-700">{t["impact.moatEyebrow"]}</p><h2 className="mt-2 text-3xl font-bold text-gray-900">{t["impact.moatTitle"]}</h2></div>
        <div className="grid gap-5 md:grid-cols-2"><article className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"><Network className="mb-4 h-7 w-7 text-violet-700" /><h3 className="font-bold text-gray-900">{t["impact.moatNetworkTitle"]}</h3><p className="mt-3 text-sm leading-relaxed text-gray-600">{t["about.impactCampaignLinking"]}</p></article><article className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"><LockKeyhole className="mb-4 h-7 w-7 text-violet-700" /><h3 className="font-bold text-gray-900">{t["impact.moatTrustTitle"]}</h3><p className="mt-3 text-sm leading-relaxed text-gray-600">{t["impact.moatTrustDesc"]}</p></article></div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-[#1E3A8A]" /><div><p className="text-xs font-mono uppercase tracking-widest text-[#1E3A8A]">{t["impact.proofEyebrow"]}</p><h2 className="text-2xl font-bold text-gray-900">{t["impact.proofTitle"]}</h2></div></div><div className="grid gap-3 md:grid-cols-2">{proofPoints.map((key) => <div key={key} className="flex gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />{t[key]}</div>)}</div></section>

      <section className="rounded-3xl bg-gray-900 px-7 py-12 text-center text-white shadow-lg"><h2 className="mx-auto max-w-4xl text-2xl font-bold leading-relaxed sm:text-3xl">{t["impact.closing"]}</h2></section>
    </div>
  );
}
