import { Shield, Brain, Lock, BellRing } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Shield,
      title: "1. Paste or Describe",
      description: "If you receive a suspicious call, message, or video request demanding money or threatening legal action, paste the transcript or describe what happened into the Rakshak AI interface."
    },
    {
      icon: Lock,
      title: "2. Privacy-First Edge Check",
      description: "Before sending any data to the cloud, our on-device AI scans the text against known scam signatures locally on your browser. If it's completely safe, your data never leaves your device."
    },
    {
      icon: Brain,
      title: "3. Advanced Reasoning",
      description: "If the interaction matches scam patterns, it is securely evaluated by an advanced Large Language Model trained specifically on the 8-point digital arrest taxonomy to determine the exact threat vector."
    },
    {
      icon: BellRing,
      title: "4. Verdict & Next Steps",
      description: "You receive an instant, explainable verdict (SAFE, UNCERTAIN, or HIGH RISK) in your preferred language, along with a printable cybercrime report and helpline information."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">How Rakshak AI Protects You</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          A proactive intelligence tool designed to break the psychological grip of digital arrest scams and financial fraud before money changes hands.
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
          <h3 className="text-xl font-bold text-blue-900 mb-2">Designed for Public Safety</h3>
          <p className="text-blue-800 max-w-2xl">
            Rakshak AI does not just tell you if something is a scam; it tells you exactly *why*, quoting the attacker's own words back to you to break the illusion of authority.
          </p>
        </div>
      </div>
    </div>
  );
}
