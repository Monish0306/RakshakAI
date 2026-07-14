import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Quote } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReasoningPanelProps {
  result: any;
  simpleView: boolean;
}

const CATEGORY_LABELS: Record<number, string> = {
  1: "Authority impersonation",
  2: "Urgency/threat escalation",
  3: "Isolation instructions",
  4: "Payment/OTP demand",
  5: "Fake portal/document reference",
  6: "Video-hostage framing",
  7: "Identity verification pretext",
  8: "Reward/incentive lure"
};

const getSeverityStyles = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function ReasoningPanel({ result, simpleView }: ReasoningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!simpleView);
  
  if (!result) return null;

  const matches = result.matches || [];

  if (simpleView && !isExpanded) {
    return (
      <div className="mt-4 text-center">
        <button 
          onClick={() => setIsExpanded(true)}
          className="text-[#1E3A8A] font-medium text-lg flex items-center justify-center w-full py-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          View detailed reasoning <ChevronDown className="ml-2 w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div 
        className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => simpleView && setIsExpanded(false)}
      >
        <h3 className="font-semibold text-gray-900 text-lg">Detailed Analysis</h3>
        {simpleView && <ChevronUp className="w-5 h-5 text-gray-500" />}
      </div>
      
      <div className="p-6">
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <p className="text-gray-600 text-lg">No known scam patterns detected in this conversation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match: any, idx: number) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-5 border border-gray-100 rounded-lg bg-gray-50/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {CATEGORY_LABELS[match.category] || `Pattern ${match.category}`}
                  </h4>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide", getSeverityStyles(match.severity))}>
                    {match.severity || 'Medium'}
                  </span>
                </div>
                
                <div className="pl-4 border-l-2 border-[#1E3A8A]/30 my-4 relative">
                  <Quote className="absolute -left-3 -top-2 w-5 h-5 text-[#1E3A8A]/20 bg-white" />
                  <p className="text-gray-700 italic font-medium leading-relaxed">
                    "{match.evidence}"
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 mt-3">
                  <span className="font-semibold text-gray-700 mr-2">Why this matters:</span>
                  {match.reason}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
