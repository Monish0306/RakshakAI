import { useState, useEffect, useRef } from 'react';
import { Download, PhoneCall, Loader2, Info, Mic, Square, ImageUp, UploadCloud, FileAudio, Edit3, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { recognize } from 'tesseract.js';
import VerdictCard from './VerdictCard';
import ReasoningPanel from './ReasoningPanel';
// @ts-ignore
import { generateReportPDF, generateSessionId } from '../lib/reportGenerator';
import { analyzeImage, transcribeAudio } from '../lib/api';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { TRANSLATIONS } from '../lib/translations';

interface CitizenShieldProps {
  classifier: any;
  language: string;
  user?: any;
}


interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export default function CitizenShield({ classifier, language, user }: CitizenShieldProps) {
  const [transcript, setTranscript] = useState('');
  const [coolingTimer, setCoolingTimer] = useState(0);
  const { loading, result, advisory, error, runClassification, reset } = classifier;
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [imageNotice, setImageNotice] = useState<{ type: 'warning' | 'info'; text: string } | null>(null);
  const [interimSpeech, setInterimSpeech] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const recordingBaseTranscriptRef = useRef('');
  const finalSpeechResultsRef = useRef<Map<number, string>>(new Map());
  const [moneySent, setMoneySent] = useState<boolean | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'transcribing' | 'review' | 'analyzing' | 'verdict'>('upload');
  const [evidenceChecked, setEvidenceChecked] = useState<Record<string, boolean>>({
    screenshot: false,
    phone: false,
    time: false,
    transaction: false,
    notDeleted: false,
    notTold: false
  });
  const [alertGuardianPrompt, setAlertGuardianPrompt] = useState<'pending' | 'yes' | 'no'>('pending');

  const resetState = () => {
    setMoneySent(null);
    setAlertGuardianPrompt('pending');
    setEvidenceChecked({
      screenshot: false,
      phone: false,
      time: false,
      transaction: false,
      notDeleted: false,
      notTold: false
    });
    setAudioError(null);
    setSpeechError(null);
    setOcrError(null);
    setImageNotice(null);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleCheck = () => {
    if (!transcript.trim()) return;
    resetState();
    runClassification(transcript, language);
  };

  const handleAudioFile = async (file?: File) => {
    if (!file) return;

    // 1. Format validation
    const supportedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac'];
    const isSupportedType = file.type.startsWith('audio/') || supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isSupportedType) {
      setAudioError(t["shield.invalidAudioFormat"] || "Unsupported audio format.");
      return;
    }

    // 2. Size validation (3.0 MB)
    const maxSize = 3.0 * 1024 * 1024;
    if (file.size > maxSize) {
      setAudioError(t["shield.audioSizeExceeded"] || "File size exceeds the 3MB limit.");
      return;
    }

    setAudioError(null);
    setIsTranscribing(true);
    setActiveStep('transcribing');
    setTranscript('');
    resetState();
    if (reset) reset();

    try {
      const base64Str = await fileToBase64(file);
      const res = await transcribeAudio(base64Str, file.type, language);

      if (res.success && res.transcript !== undefined) {
        setTranscript(res.transcript);
        setActiveStep('review');
      } else {
        throw new Error(res.error || 'Failed to transcribe audio.');
      }
    } catch (err: any) {
      console.error("Audio upload/transcribe error:", err);
      setAudioError(t["shield.transcriptionFailed"] || err.message || "Transcription failed.");
      setActiveStep('upload');
    } finally {
      setIsTranscribing(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleConfirmAndAnalyze = () => {
    if (!transcript.trim()) return;
    setActiveStep('analyzing');
    runClassification(transcript, language);
  };

  const handleResetAll = () => {
    resetState();
    setTranscript('');
    if (reset) reset();
    setActiveStep('upload');
  };

  useEffect(() => {
    if (loading) {
      setActiveStep('analyzing');
    } else if (result) {
      setActiveStep('verdict');
    } else if (error) {
      setActiveStep('upload');
    }
  }, [loading, result, error]);

  const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined' || !window.isSecureContext) return null;

    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setSpeechError(t["shield.voiceUnsupported"]);
      return;
    }

    setSpeechError(null);
    setInterimSpeech('');
    recordingBaseTranscriptRef.current = transcript;
    finalSpeechResultsRef.current = new Map();
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : language === 'kn' ? 'kn-IN' : language === 'te' ? 'te-IN' : 'en-IN';

    recognition.onresult = (event) => {
      const interimResults: string[] = [];

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalSpeechResultsRef.current.set(index, result[0].transcript.trim());
        } else {
          interimResults.push(result[0].transcript.trim());
        }
      }

      setInterimSpeech(interimResults.filter(Boolean).join(' '));
      const finalText = Array.from(finalSpeechResultsRef.current.entries())
        .sort(([firstIndex], [secondIndex]) => firstIndex - secondIndex)
        .map(([, text]) => text)
        .filter(Boolean)
        .join(' ');
      if (finalText) {
        const baseTranscript = recordingBaseTranscriptRef.current;
        setTranscript(`${baseTranscript}${baseTranscript.trim() ? ' ' : ''}${finalText}`);
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInterimSpeech('');
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setSpeechError(t["shield.voiceUnavailable"]);
      }
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageFile = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setOcrError(t["shield.ocrFailure"]);
      return;
    }

    setOcrError(null);
    setImageNotice(null);
    setIsProcessingImage(true);

    try {
      const base64Str = await fileToBase64(file);
      const analysis = await analyzeImage(base64Str, file.type);

      if (analysis.success && analysis.data) {
        const imgData = analysis.data;

        if (!imgData.isRelevant) {
          setImageNotice({
            type: 'warning',
            text: imgData.description || `Irrelevant image detected (${imgData.detectedType}). Please upload a screenshot of a chat, call screen, or bank notification.`
          });
          setIsProcessingImage(false);
          if (imageInputRef.current) imageInputRef.current.value = '';
          return;
        }

        if (imgData.extractedText && imgData.extractedText.trim().length > 0) {
          setTranscript(imgData.extractedText.trim());
          if (imgData.degraded) {
            setImageNotice({
              type: 'info',
              text: 'Image visual check timed out. Text was extracted via OCR and sent to classification.'
            });
          }
          setIsProcessingImage(false);
          if (imageInputRef.current) imageInputRef.current.value = '';
          return;
        }
      }

      // OCR Fallback if text wasn't extracted directly by Vision API
      const { data: { text } } = await recognize(file, 'eng');
      if (!text.trim()) {
        setOcrError(t["shield.ocrFailure"]);
        return;
      }
      setTranscript(text.trim());
    } catch (e) {
      // Graceful fallback to local Tesseract OCR on API error
      try {
        const { data: { text } } = await recognize(file, 'eng');
        if (text.trim()) {
          setTranscript(text.trim());
          setImageNotice({
            type: 'info',
            text: 'Image visual check unavailable. Text extracted via local OCR fallback.'
          });
        } else {
          setOcrError(t["shield.ocrFailure"]);
        }
      } catch {
        setOcrError(t["shield.ocrFailure"]);
      }
    } finally {
      setIsProcessingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const lastSavedSessionIdRef = useRef<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (result && !loading) {
      if (!currentSessionId) {
        setCurrentSessionId(generateSessionId());
        setCurrentTimestamp(new Date().toISOString());
      }
    } else if (!result && !loading) {
      setCurrentSessionId(null);
      setCurrentTimestamp(null);
    }
  }, [result, loading, currentSessionId]);

  useEffect(() => {
    if (result && user?.uid && !loading && currentSessionId && currentTimestamp) {
      const resultKey = `${result.verdict}-${result.confidence}-${result.ranOnDevice}-${result.verificationStatus}-${currentSessionId}`;
      if (lastSavedSessionIdRef.current === resultKey) return;
      lastSavedSessionIdRef.current = resultKey;

      const saveReport = async () => {
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          await addDoc(collection(db, "citizenReports"), {
            sessionId: currentSessionId,
            transcript: transcript,
            verdict: result.verdict,
            confidence: result.confidence,
            matches: result.matches || [],
            redFlagsDetected: result.redFlagsDetected || [],
            timestamp: currentTimestamp,
            ranOnDevice: !!result.ranOnDevice,
            userId: user.uid,
            userEmail: user.email || "",
            caseStatus: 'pending',
            assignedOfficer: '',
            recoveryPercent: null
          });
        } catch (e) {
          console.error("Failed to save report to Firestore", e);
        }
      };
      
      saveReport();
    }
  }, [result, loading, user, transcript, currentSessionId, currentTimestamp]);

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
    if (!result || !currentSessionId || !currentTimestamp) return;
    
    const session = {
      sessionId: currentSessionId,
      transcript: transcript,
      verdict: result.verdict,
      confidence: result.confidence,
      matches: result.matches || [],
      redFlagsDetected: result.redFlagsDetected || [],
      timestamp: currentTimestamp,
      evidenceStatus: evidenceChecked
    };

    const doc = await generateReportPDF(session);
    doc.save(`RakshakAI_Report_${session.sessionId}.pdf`);
  };

  const showActions = result && coolingTimer === 0;

  const steps = [
    { id: 'upload', label: t["shield.stepUpload"] || "Upload / Paste" },
    { id: 'transcribing', label: t["shield.stepTranscribing"] || "Transcribing" },
    { id: 'review', label: t["shield.stepReview"] || "Review" },
    { id: 'analyzing', label: t["shield.stepAnalyzing"] || "Analyzing" },
    { id: 'verdict', label: t["shield.stepVerdict"] || "Verdict" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm overflow-x-auto">
        {steps.map((step, idx) => {
          const isActive = activeStep === step.id;
          const isCompleted = 
            (activeStep === 'transcribing' && idx < 1) ||
            (activeStep === 'review' && idx < 2) ||
            (activeStep === 'analyzing' && idx < 3) ||
            (activeStep === 'verdict' && idx < 4);

          return (
            <div key={step.id} className="flex items-center space-x-2 shrink-0">
              <span className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                isActive ? "bg-[#1E3A8A] text-white" :
                isCompleted ? "bg-emerald-600 text-white" :
                "bg-gray-105 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
              )}>
                {idx + 1}
              </span>
              <span className={cn(
                "text-xs font-semibold font-mono",
                isActive ? "text-gray-900 dark:text-slate-100 font-bold" :
                isCompleted ? "text-emerald-700 dark:text-emerald-500" :
                "text-gray-400 dark:text-slate-500"
              )}>
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <span className="text-gray-300 dark:text-slate-850 px-2 font-black">➔</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        
        {/* STEP: TRANSCRIBING LOADING */}
        {activeStep === 'transcribing' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A]" />
            <div className="flex items-center gap-2 text-gray-700 dark:text-slate-350">
              <FileAudio className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span className="font-semibold text-lg">{t["shield.transcribing"]}</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">Gemini is transcribing and verifying speech patterns in real time.</p>
          </div>
        )}

        {/* STEP: EDITABLE TRANSCRIPT REVIEW */}
        {activeStep === 'review' && (
          <div className="animate-in fade-in duration-300">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-950 dark:text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#1E3A8A]" />
                {t["shield.reviewTranscript"]}
              </h3>
              <span className="text-[10px] bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Audio Upload Mode</span>
            </div>
            <div className="p-1">
              <textarea
                className="w-full min-h-[180px] p-5 focus:outline-none resize-none placeholder-gray-400 bg-transparent text-gray-800 dark:text-slate-200 text-lg border-b border-gray-100 dark:border-slate-800"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleResetAll}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-800 text-gray-650 dark:text-slate-350 hover:bg-gray-100 dark:hover:bg-slate-850 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Cancel / Upload New
              </button>
              <button
                onClick={handleConfirmAndAnalyze}
                disabled={loading || !transcript.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t["shield.confirmAndAnalyze"]}
              </button>
            </div>
          </div>
        )}

        {/* STEP: ANALYZING STATE */}
        {activeStep === 'analyzing' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1E3A8A]" />
            <span className="font-bold text-lg text-gray-800 dark:text-slate-200">{t["shield.analyzing"]}</span>
            <p className="text-xs text-gray-400">Classifying indicators under the digital arrest taxonomy...</p>
          </div>
        )}

        {/* STEP: DEFAULT UPLOAD / INPUT SCREEN */}
        {(activeStep === 'upload' || activeStep === 'verdict') && (
          <div className="animate-in fade-in duration-300">
            <div className="p-1">
              <textarea
                className="w-full min-h-[160px] p-5 focus:outline-none resize-none placeholder-gray-400 bg-transparent text-gray-850 dark:text-slate-200 text-lg"
                placeholder={t["shield.textareaPlaceholder"]}
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (activeStep === 'verdict') {
                    handleResetAll();
                  }
                }}
                disabled={loading || isRecording || isProcessingImage || isTranscribing}
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg, .webm, .flac"
                  className="sr-only"
                  onChange={(event) => handleAudioFile(event.target.files?.[0])}
                />
                <button
                  onClick={() => audioInputRef.current?.click()}
                  disabled={loading || isRecording || isProcessingImage || isTranscribing}
                  className="text-[#1E3A8A] font-medium text-sm flex items-center hover:bg-blue-50 dark:hover:bg-slate-850 px-3 py-2 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 mr-2 text-indigo-500" />
                  {t["shield.uploadAudio"] || "Upload Recording"}
                </button>
                <button
                  onClick={handleVoiceRecording}
                  disabled={loading || isProcessingImage || isTranscribing}
                  aria-pressed={isRecording}
                  className={cn(
                    "font-medium text-sm flex items-center px-3 py-2 rounded-md transition-colors disabled:opacity-50 cursor-pointer",
                    isRecording ? "bg-red-100 text-red-700 hover:bg-red-200" : "text-[#1E3A8A] hover:bg-blue-50 dark:hover:bg-slate-850"
                  )}
                >
                  {isRecording ? <Square className="w-4 h-4 mr-2 fill-current" /> : <Mic className="w-5 h-5 mr-2" />}
                  <span className={isRecording ? "animate-pulse" : undefined}>{isRecording ? t["shield.stopRecording"] : t["shield.recordVoice"]}</span>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => handleImageFile(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={loading || isRecording || isProcessingImage || isTranscribing}
                  className="text-[#1E3A8A] font-medium text-sm flex items-center hover:bg-blue-50 dark:hover:bg-slate-850 px-3 py-2 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingImage ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ImageUp className="w-5 h-5 mr-2" />}
                  {isProcessingImage ? t["shield.extractingText"] : t["shield.uploadScreenshot"]}
                </button>
              </div>
              
              <button
                onClick={handleCheck}
                disabled={loading || isRecording || isProcessingImage || isTranscribing || !transcript.trim()}
                className={cn(
                  "w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all shadow-sm flex items-center justify-center text-base cursor-pointer",
                  (loading || isRecording || isProcessingImage || isTranscribing || !transcript.trim())
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 hover:shadow-md"
                )}
              >
                {t["shield.checkThisNow"]}
              </button>
            </div>
            
            {isRecording && (
              <div className="px-5 pb-4 text-sm text-red-700 flex items-center gap-2" role="status">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>{t["shield.listening"]}{interimSpeech ? `: ${interimSpeech}` : ''}</span>
              </div>
            )}
            
            <div
              className="mx-4 mb-4 rounded-lg border-2 border-dashed border-blue-100 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-950 px-4 py-3 text-center text-sm text-[#1E3A8A] transition-colors hover:border-blue-300"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (!file) return;
                
                if (file.type.startsWith('image/')) {
                  if (!isProcessingImage && !loading && !isTranscribing && !isRecording) {
                    handleImageFile(file);
                  }
                } else if (file.type.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac'].some(ext => file.name.toLowerCase().endsWith(ext))) {
                  if (!isProcessingImage && !loading && !isTranscribing && !isRecording) {
                    handleAudioFile(file);
                  }
                }
              }}
            >
              {isProcessingImage ? t["shield.extractingText"] : "Drop audio recording or screenshot here, or use buttons above"}
            </div>
          </div>
        )}
        {speechError && (
          <div className="mx-4 mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800" role="alert">
            {speechError}
          </div>
        )}
        {ocrError && (
          <div className="mx-4 mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800" role="alert">
            {ocrError}
          </div>
        )}
        {audioError && (
          <div className="mx-4 mb-4 rounded-lg bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-slate-850 px-4 py-3 text-sm text-amber-800 flex items-start gap-2 animate-in slide-in-from-top-1 duration-200" role="alert">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <span>{audioError}</span>
          </div>
        )}
        {imageNotice && (
          <div className={cn(
            "mx-4 mb-4 rounded-lg border px-4 py-3 text-sm font-medium flex items-start gap-2",
            imageNotice.type === 'warning' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-blue-50 border-blue-200 text-blue-900"
          )} role="alert">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{imageNotice.text}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mt-4 shadow-sm" role="alert">
          <strong className="font-bold mr-2">{t["shield.error"]}</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex justify-end">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-850 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#1E3A8A]" />
              Check Another Call
            </button>
          </div>
          
          <VerdictCard result={result} language={language} />
          
          <ReasoningPanel result={result} language={language} />

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
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{t["shield.takeMoment"]}</h4>
              <p className="text-gray-600">{t["shield.takeMomentDesc"]}</p>
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
                      "font-semibold mb-2 text-lg",
                      result.verdict === 'SAFE' ? "text-green-900" : "text-blue-900"
                    )}>
                      {t["shield.officialAdvisory"]}
                    </h3>
                    <p className={cn(
                      "font-medium leading-relaxed text-base",
                      result.verdict === 'SAFE' ? "text-green-800" : "text-blue-800"
                    )}>
                      {advisory || result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Golden Hour Assistant - High Risk Only */}
              {result.verdict === 'HIGH_RISK' && (
                <div className="col-span-1 md:col-span-2 mt-2">
                  {moneySent === null ? (
                    <div className="bg-orange-50 border border-orange-200 p-6 lg:p-8 rounded-xl shadow-sm text-center">
                      <h3 className="text-xl lg:text-2xl font-bold text-orange-900 mb-6">{t["shield.goldenHourQuestion"]}</h3>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => setMoneySent(true)} className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.yes"]}</button>
                        <button onClick={() => setMoneySent(false)} className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.no"]}</button>
                      </div>
                    </div>
                  ) : moneySent === true ? (
                    <div className="bg-red-50 border-2 border-red-500 p-6 lg:p-8 rounded-xl shadow-sm">
                      <h3 className="text-2xl lg:text-3xl font-extrabold text-red-700 mb-3">{t["shield.goldenHourUrgentTitle"]}</h3>
                      <p className="text-red-900 font-medium text-lg mb-6 leading-relaxed">{t["shield.goldenHourUrgentDesc"]}</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <a href="tel:1930" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-4 font-bold rounded-lg flex items-center justify-center gap-2 text-lg shadow-sm transition-colors">
                          <PhoneCall className="w-5 h-5" /> {t["shield.call1930Now"]}
                        </a>
                        <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="flex-1 bg-red-800 hover:bg-red-900 text-white text-center py-4 font-bold rounded-lg text-lg shadow-sm transition-colors">
                          {t["shield.fileComplaint"]}
                        </a>
                      </div>
                      
                      <div className="bg-white/80 p-5 rounded-lg border border-red-100">
                        <ul className="space-y-3 text-red-900 font-semibold list-none">
                          <li>{t["shield.urgentStep1"]}</li>
                          <li>{t["shield.urgentStep2"]}</li>
                          <li>{t["shield.urgentStep3"]}</li>
                          <li>{t["shield.urgentStep4"]}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 p-6 lg:p-8 rounded-xl shadow-sm flex items-start gap-4">
                      <Info className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-blue-900 font-medium text-lg lg:text-xl leading-relaxed">{t["shield.goldenHourCalmMessage"]}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Find Nearest Help - Only for Uncertain */}
              {result.verdict === 'UNCERTAIN' && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                    <PhoneCall className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-bold text-red-900 text-lg mb-1">{t["shield.helplineTitle"]}</h4>
                  <p className="text-4xl font-extrabold text-red-700 my-2">{t["shield.helplineNumber"]}</p>
                  <p className="text-red-800 text-sm font-medium">{t["shield.helplineDesc"]}</p>
                </div>
              )}

              {/* Family Guardian Alert Prompt */}
              {result.verdict === 'HIGH_RISK' && user?.guardianEnabled && user?.guardianMobile && (
                <div className="col-span-1 md:col-span-2 mt-4">
                  {alertGuardianPrompt === 'pending' ? (
                    <div className="bg-indigo-50 border border-indigo-200 p-6 lg:p-8 rounded-xl shadow-sm text-center">
                      <h3 className="text-xl lg:text-2xl font-bold text-indigo-900 mb-6">
                        {t["shield.guardianAlertPrompt"] ? t["shield.guardianAlertPrompt"].replace("{name}", user.guardianName) : `Alert ${user.guardianName} about this?`}
                      </h3>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => setAlertGuardianPrompt('yes')} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.yes"]}</button>
                        <button onClick={() => setAlertGuardianPrompt('no')} className="px-8 py-3.5 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors shadow-sm">{t["common.no"]}</button>
                      </div>
                    </div>
                  ) : alertGuardianPrompt === 'yes' ? (
                    <div className="bg-indigo-50 border-2 border-indigo-500 p-6 lg:p-8 rounded-xl shadow-sm animate-in slide-in-from-top-2 fade-in duration-200">
                      <h3 className="text-xl lg:text-2xl font-bold text-indigo-900 mb-2">
                        {t["shield.guardianAlertReady"] ? t["shield.guardianAlertReady"].replace("{name}", user.guardianName) : `Alert ${user.guardianName}`}
                      </h3>
                      <p className="text-indigo-800 text-sm lg:text-base mb-6 font-medium">
                        {t["shield.guardianAlertDesc"] || "Tap the button below to send an emergency alert via SMS or WhatsApp. The message is pre-filled, but you must hit send."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a 
                          href={`sms:+91${user.guardianMobile}?body=${encodeURIComponent(t["shield.guardianAlertMessage"] || "URGENT: I'm dealing with a suspected scam call right now (possible digital arrest fraud). I have NOT sent any money. Please call me immediately if you can.")}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-4 font-bold rounded-lg shadow-sm transition-colors text-lg"
                        >
                          Send via SMS
                        </a>
                        <a 
                          href={`https://wa.me/91${user.guardianMobile}?text=${encodeURIComponent(t["shield.guardianAlertMessage"] || "URGENT: I'm dealing with a suspected scam call right now (possible digital arrest fraud). I have NOT sent any money. Please call me immediately if you can.")}`}
                          target="_blank" rel="noreferrer"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-4 font-bold rounded-lg shadow-sm transition-colors text-lg"
                        >
                          Send via WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Evidence Completeness & Generate Report - High Risk */}
              {result.verdict === 'HIGH_RISK' && (
                <div className="col-span-1 md:col-span-2 bg-white p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 text-lg lg:text-xl">{t["shield.evidenceTitle"]}</h4>
                    <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full whitespace-nowrap">
                      {Object.values(evidenceChecked).filter(Boolean).length} {t["shield.ofCompleted"]}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{t["shield.evidenceDesc"]}</p>
                  
                  <div className="space-y-4 mb-8">
                    {['screenshot', 'phone', 'time', 'transaction', 'notDeleted', 'notTold'].map((key) => (
                      <label key={key} className="flex items-start space-x-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border-2 rounded shrink-0 transition-colors border-gray-300 group-hover:border-[#1E3A8A]">
                          <input 
                            type="checkbox" 
                            className="absolute opacity-0 w-full h-full cursor-pointer"
                            checked={evidenceChecked[key]}
                            onChange={(e) => setEvidenceChecked(prev => ({ ...prev, [key]: e.target.checked }))}
                          />
                          {evidenceChecked[key] && <div className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-sm" />}
                        </div>
                        <span className="text-sm lg:text-base text-gray-700 select-none group-hover:text-gray-900 font-medium">
                          {t[`shield.evidence_${key}`]}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{t["shield.legalAction"]}</h4>
                    <p className="text-gray-600 text-sm mb-4">{t["shield.legalActionDesc"]}</p>
                    <button 
                      onClick={handleGenerateReport}
                      className="w-full flex items-center justify-center py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition-colors shadow-sm text-lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {t["shield.downloadPDF"]}
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Report - Only for Uncertain */}
              {result.verdict === 'UNCERTAIN' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-center shadow-sm">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">{t["shield.legalAction"]}</h4>
                  <p className="text-gray-600 text-sm mb-4">{t["shield.legalActionDesc"]}</p>
                  <button 
                    onClick={handleGenerateReport}
                    className="w-full flex items-center justify-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors border border-gray-300 shadow-sm"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {t["shield.downloadPDF"]}
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
