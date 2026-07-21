import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cloud, Lock, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { TRANSLATIONS } from '../lib/translations';

interface VerdictCardProps {
  result: any;
  simpleView: boolean;
  language: string;
}

export default function VerdictCard({ result, simpleView, language }: VerdictCardProps) {
  if (!result) return null;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const getTheme = (verdict: string) => {
    switch (verdict) {
      case 'SAFE':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: ShieldCheck,
          iconColor: 'text-green-700',
          label: 'SAFE'
        };
      case 'UNCERTAIN':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          label: 'UNCERTAIN'
        };
      case 'HIGH_RISK':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: ShieldAlert,
          iconColor: 'text-red-700',
          label: 'HIGH RISK'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: ShieldCheck,
          iconColor: 'text-gray-700',
          label: verdict
        };
    }
  };

  const theme = getTheme(result.verdict);
  const Icon = theme.icon;
  const isRanOnDevice = !!result.ranOnDevice;

  if (simpleView) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={cn("w-full rounded-2xl p-8 border-2 flex flex-col items-center text-center shadow-sm", theme.bg, theme.border)}
      >
        <Icon className={cn("w-32 h-32 mb-6", theme.iconColor)} />
        <h2 className={cn("text-5xl font-extrabold tracking-tight mb-4", theme.text)}>
          {theme.label}
        </h2>
        {result.category && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-gray-300 text-sm font-semibold text-gray-800 mb-4">
            <Tag className="w-4 h-4 text-slate-700" />
            <span>{result.category}</span>
          </div>
        )}
        {isRanOnDevice && (
          <div className="flex items-center space-x-2 text-gray-700 mt-2 text-lg font-medium">
            <Lock className="w-5 h-5" />
            <span>{t["verdict.checkedPrivately"]}</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full rounded-xl p-6 border shadow-sm relative overflow-hidden", theme.bg, theme.border)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className={cn("p-3 rounded-full bg-white shadow-sm border", theme.border)}>
            <Icon className={cn("w-10 h-10", theme.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={cn("text-3xl font-bold tracking-tight uppercase", theme.text)}>
                {theme.label}
              </h2>

              {/* Status Badges */}
              {result.verificationStatus === "quick_check" && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                  Quick On-Device Verdict (Verifying...)
                </span>
              )}
              {result.verificationStatus === "ai_verified" && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                  AI Verified
                </span>
              )}
              {result.degraded && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Degraded / Quick Check
                </span>
              )}
            </div>

            {/* Category Tag Badge */}
            {result.category && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/90 border border-gray-300/80 text-xs font-semibold text-gray-900 shadow-xs">
                  <Tag className="w-3.5 h-3.5 text-slate-700" />
                  <span>Category: {result.category}</span>
                </span>
              </div>
            )}

            <div className="flex items-center space-x-3 mt-1.5">
              <span className={cn("text-sm font-medium", theme.text, "opacity-80")}>
                {t["verdict.confidence"]} {result.confidence}%
              </span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-600 bg-white/60 px-2 py-0.5 rounded-full border border-gray-200/60 shadow-sm">
                {isRanOnDevice ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t["verdict.checkedOnDeviceAssure"]}</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{t["verdict.verifiedCloudAssure"]}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Degraded Alert Banner */}
      {result.degraded && (
        <div className="mt-4 bg-amber-100/90 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-amber-950">
              Quick On-Device Verdict Only — Server AI Verification Timed Out
            </strong>
            Please treat this call with caution — do not share personal information, OTPs, or make any payment until you can confirm independently through official numbers.
          </div>
        </div>
      )}

      {/* Reasoning Block */}
      {result.reasoning && (
        <div className="mt-4 bg-white/70 border border-gray-200/80 rounded-lg p-3.5 text-sm text-gray-800 space-y-1">
          <strong className="block text-xs uppercase tracking-wider text-gray-500 font-bold">
            Analysis & Reasoning
          </strong>
          <p className="leading-relaxed font-medium">
            {result.reasoning}
          </p>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <p className="text-gray-800 text-lg leading-relaxed font-medium">
          {result.explanation}
        </p>
      </div>

      {result.redFlagsDetected && result.redFlagsDetected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider self-center mr-1">
            {t["verdict.redFlags"]}
          </span>
          {result.redFlagsDetected.map((flag: string, idx: number) => (
            <span key={idx} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200 font-medium">
              {flag}
            </span>
          ))}
        </div>
      )}

      {result.matchCount && result.matchCount > 0 ? (
        <div className="mt-4 bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg shadow-sm font-medium flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 text-amber-700 shrink-0" />
          <div>
            <strong className="block text-amber-950 font-bold mb-0.5">
              {t["verdict.campaignMatch"].replace('{campaignId}', result.campaignId || '')}
            </strong>
            <span className="text-sm">
              {t["verdict.campaignMatchDesc"].replace('{matchCount}', String(result.matchCount))}
            </span>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
