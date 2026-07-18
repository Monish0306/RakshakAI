import { Shield, Brain, Lock, BellRing } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';

interface HowItWorksProps {
  language: string;
}

export default function HowItWorks({ language }: HowItWorksProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const steps = [
    {
      icon: Shield,
      title: t["how.step1Title"],
      description: t["how.step1Desc"]
    },
    {
      icon: Lock,
      title: t["how.step2Title"],
      description: t["how.step2Desc"]
    },
    {
      icon: Brain,
      title: t["how.step3Title"],
      description: t["how.step3Desc"]
    },
    {
      icon: BellRing,
      title: t["how.step4Title"],
      description: t["how.step4Desc"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t["how.title"]}</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          {t["how.subtitle"]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
              <step.icon className="w-32 h-32 text-[#1E3A8A]" />
            </div>
            
            <div className="w-12 h-12 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center mb-6">
              <step.icon className="w-6 h-6 text-[#1E3A8A]" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{step.title}</h3>
            <p className="text-gray-600 leading-relaxed relative z-10">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">{t["how.footerTitle"]}</h3>
          <p className="text-blue-800 max-w-2xl">
            {t["how.footerDesc"]}
          </p>
        </div>
      </div>
    </div>
  );
}
