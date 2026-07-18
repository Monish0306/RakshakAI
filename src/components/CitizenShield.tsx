import { useState, useEffect } from 'react';
import { Download, PhoneCall, Loader2, PlayCircle, Info } from 'lucide-react';
import VerdictCard from './VerdictCard';
import ReasoningPanel from './ReasoningPanel';
// @ts-ignore
import { generateReportPDF, generateSessionId } from '../lib/reportGenerator';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface CitizenShieldProps {
  classifier: any;
  language: string;
  simpleView: boolean;
}

const SAMPLE_SCAM_TRANSCRIPT = 
  "Hello, this is Inspector Sharma from the CBI. We have intercepted a package in your name containing illegal passports. You are under digital arrest and must remain on this video call. Do not disconnect or a warrant will be issued immediately. For verification of your innocence, transfer a refundable deposit of Rs. 50,000 to the RBI secure account.";

export default function CitizenShield({ classifier, language, simpleView }: CitizenShieldProps) {
  const [transcript, setTranscript] = useState('');
  const [coolingTimer, setCoolingTimer] = useState(0);
  const { loading, result, advisory, error, runClassification } = classifier;
  const [isSimulating, setIsSimulating] = useState(false);

  const handleCheck = () => {
    if (!transcript.trim()) return;
    runClassification(transcript, language);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setTranscript('');
    let currentText = '';
    const words = SAMPLE_SCAM_TRANSCRIPT.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setTranscript(currentText);
      await new Promise(r => setTimeout(r, 80)); // Typewriter effect
    }
    
    setIsSimulating(false);
    runClassification(SAMPLE_SCAM_TRANSCRIPT, language);
  };

  useEffect(() => {
    if (result && result.verdict === 'HIGH_RISK') {
      setCoolingTimer(15);
    } else {
      setCoolingTimer(0);
    }
  }, [result]);

  useEffect(() => {
    if (coolingTimer > 0) {
      const timer = setTimeout(() => setCoolingTimer(coolingTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [coolingTimer]);

  const handleGenerateReport = async () => {
    if (!result) return;
    
    const session = {
      sessionId: generateSessionId(),
      transcript: transcript,
      verdict: result.verdict,
      confidence: result.confidence,
      matches: result.matches || [],
      redFlagsDetected: result.redFlagsDetected || [],
      timestamp: new Date().toISOString()
    };

    const doc = await generateReportPDF(session);
    doc.save(`RakshakAI_Report_${session.sessionId}.pdf`);
  };

  const showActions = result && coolingTimer === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-1">
          <textarea
            className={cn(
              "w-full min-h-[160px] p-5 focus:outline-none resize-none placeholder-gray-400 bg-transparent text-gray-800",
              simpleView ? "text-2xl" : "text-lg"
            )}
            placeholder="Paste a suspicious call transcript, or describe what happened..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={loading || isSimulating}
          />
        </div>
        <div className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleSimulate}
            disabled={loading || isSimulating}
            className="text-[#1E3A8A] font-medium text-sm flex items-center hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Live Simulated Call
          </button>
          
          <button
            onClick={handleCheck}
            disabled={loading || isSimulating || !transcript.trim()}
            className={cn(
              "w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all shadow-sm flex items-center justify-center",
              (loading || isSimulating || !transcript.trim()) 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 hover:shadow-md",
              simpleView ? "text-xl py-4" : "text-base"
            )}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              'Check This Now'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mt-4 shadow-sm" role="alert">
          <strong className="font-bold mr-2">Error:</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          <VerdictCard result={result} simpleView={simpleView} />
          
          {!simpleView && <ReasoningPanel result={result} simpleView={simpleView} />}

          {/* Cooling Off Timer */}
          {result.verdict === 'HIGH_RISK' && coolingTimer > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-gray-200" strokeWidth="4" fill="none" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    className="stroke-[#1E3A8A]" 
                    strokeWidth="4" fill="none" 
                    strokeDasharray={28 * 2 * Math.PI}
                    strokeDashoffset={(28 * 2 * Math.PI) * (1 - coolingTimer / 15)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="absolute text-xl font-bold text-[#1E3A8A]">{coolingTimer}</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Take a moment.</h4>
              <p className="text-gray-600">Read the reasoning above before deciding what to do next. Do not panic.</p>
            </motion.div>
          )}

          {/* Post-Verdict Actions */}
          {showActions && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
            >
              {/* Advisory Box */}
              <div className={cn(
                "col-span-1 md:col-span-2 p-6 rounded-xl border shadow-sm",
                result.verdict === 'SAFE' ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-start space-x-3">
                  <Info className={cn("w-6 h-6 shrink-0 mt-0.5", result.verdict === 'SAFE' ? "text-green-600" : "text-blue-600")} />
                  <div>
                    <h3 className={cn(
                      "font-semibold mb-2",
                      result.verdict === 'SAFE' ? "text-green-900" : "text-blue-900",
                      simpleView ? "text-2xl" : "text-lg"
                    )}>
                      Official Advisory
                    </h3>
                    <p className={cn(
                      "font-medium leading-relaxed",
                      result.verdict === 'SAFE' ? "text-green-800" : "text-blue-800",
                      simpleView ? "text-xl" : "text-base"
                    )}>
                      {advisory || result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Find Nearest Help - Only for Risk/Uncertain */}
              {result.verdict !== 'SAFE' && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <PhoneCall className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-bold text-red-900 text-lg mb-1">National Cybercrime Helpline</h4>
                  <p className="text-4xl font-extrabold text-red-700 my-2">1930</p>
                  <p className="text-red-800 text-sm font-medium">Available 24/7. Call immediately if you shared banking details.</p>
                </div>
              )}

              {/* Generate Report - Only for Risk/Uncertain */}
              {result.verdict !== 'SAFE' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-center shadow-sm">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Legal Action</h4>
                  <p className="text-gray-600 text-sm mb-4">Generate an official audit report to submit alongside your complaint on cybercrime.gov.in</p>
                  <button 
                    onClick={handleGenerateReport}
                    className="w-full flex items-center justify-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors border border-gray-300 shadow-sm"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF Report
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
