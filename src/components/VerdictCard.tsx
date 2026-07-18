import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cloud, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface VerdictCardProps {
  result: any;
  simpleView: boolean;
}

export default function VerdictCard({ result, simpleView }: VerdictCardProps) {
  if (!result) return null;

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
        {result.ranOnDevice && (
          <div className="flex items-center space-x-2 text-gray-700 mt-2 text-lg font-medium">
            <Lock className="w-5 h-5" />
            <span>Checked privately on your device</span>
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
            <h2 className={cn("text-3xl font-bold tracking-tight uppercase", theme.text)}>
              {theme.label}
            </h2>
            <div className="flex items-center space-x-3 mt-1">
              <span className={cn("text-sm font-medium", theme.text, "opacity-80")}>
                Confidence: {result.confidence}%
              </span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-600 bg-white/60 px-2 py-0.5 rounded-full border border-gray-200/60 shadow-sm">
                {result.ranOnDevice ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Checked on-device — nothing was sent to any server</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Verified via secure cloud reasoning</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-5 border-t border-gray-200/50">
        <p className="text-gray-800 text-lg leading-relaxed font-medium">
          {result.explanation}
        </p>
      </div>

      {result.redFlagsDetected && result.redFlagsDetected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider self-center mr-1">Red Flags:</span>
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
            <strong className="block text-amber-950 font-bold mb-0.5">⚠️ This matches {result.campaignId}</strong>
            <span className="text-sm">{result.matchCount} similar reports detected. This is part of an active coordinated scam campaign.</span>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
