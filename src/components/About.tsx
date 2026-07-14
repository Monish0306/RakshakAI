import { ArrowDown, Cpu, ShieldAlert, Brain, Calculator, FileText, Download, Target, Network, Map } from 'lucide-react';

export default function About() {
  const pipeline = [
    { name: "On-Device Privacy Filter", icon: Cpu, desc: "Xenova/all-MiniLM-L6-v2 embedding cosine similarity check." },
    { name: "Rule-Based Red Flags", icon: ShieldAlert, desc: "Deterministic matching for known scam terminology." },
    { name: "Cloud LLM Reasoning", icon: Brain, desc: "Few-shot prompting over a structured 8-point scam taxonomy." },
    { name: "Risk Scoring", icon: Calculator, desc: "Evidence-weighted severity aggregation." },
    { name: "Plain-Language Explanation", icon: FileText, desc: "Translating AI output into actionable citizen advisories." },
    { name: "NCRP Report Generation", icon: Download, desc: "Audit-ready PDF generation for law enforcement." },
  ];

  const roadmap = [
    { name: "Counterfeit Currency Detection", icon: Target, desc: "Mobile-deployable computer vision for microprint and UV feature analysis across all denominations." },
    { name: "Fraud Network Graph Intelligence", icon: Network, desc: "Clustering victim reports, scammer infrastructure, and mule networks into actionable legal intelligence." },
    { name: "Geospatial Crime Mapping", icon: Map, desc: "Mapping cybercrime hotspots for patrol prioritization and inter-district intelligence sharing." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-12">
      
      {/* Architecture Section */}
      <section>
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Architecture</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Rakshak AI utilizes a hybrid Edge-to-Cloud architecture to optimize for both citizen privacy and detection accuracy.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {pipeline.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-50 text-[#1E3A8A] rounded-lg flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{step.name}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
              
              {idx < pipeline.length - 1 && (
                <div className="py-2 text-gray-300">
                  <ArrowDown className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="border-t border-gray-200 pt-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Future Roadmap</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            The complete Digital Public Safety Intelligence Platform encompasses more than just digital arrest mitigation. These modules are planned for future phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((item, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-6 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-not-allowed">
              <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
              <div className="mt-4 inline-block px-2.5 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded uppercase tracking-wider">
                In Development
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
