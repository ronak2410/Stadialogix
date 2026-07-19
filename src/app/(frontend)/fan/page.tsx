'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { I18nProvider, useI18n } from '@/i18n/I18nContext';
import { translations } from '@/i18n/translations';
import { Send, MapPin, Navigation, Loader2, Volume2, ArrowLeft, Camera, Mic, Leaf, ShoppingCart, Crown, Shirt, AlertTriangle, Globe, ScanFace, Tv2, Activity, Play, Wifi, Scan } from 'lucide-react';
import { getIoTState } from '@/utils/iotState';
import { findAStarPath } from '@/utils/pathfinding';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { ChatMessage } from '@/types';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
});

interface ISpeechRecognitionEvent {
  results: { transcript: string }[][];
}
interface ISpeechRecognitionErrorEvent {
  error: string;
}

export default function FanMode() {
  return (
    <I18nProvider>
      <FanModeInner />
    </I18nProvider>
  );
}

function FanModeInner() {
  const { language, setLanguage, t } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('ai_greeting') }]);
    }
  }, [t, messages.length]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState('');
  const [greenPoints, setGreenPoints] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showSeatView, setShowSeatView] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showAutonomousModal, setShowAutonomousModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showFanCamModal, setShowFanCamModal] = useState(false);
  const [showEcoTransitModal, setShowEcoTransitModal] = useState(false);
  const [showReplaysModal, setShowReplaysModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showParkingModal, setShowParkingModal] = useState(false);
  const [telemetry, setTelemetry] = useState({ speed_kmh: 112, spin_rpm: 420 });
  const [transitData, setTransitData] = useState([
    { line: 'NJ Transit Line 1', destination: 'Secaucus Junction', mins: 12, status: 'On Time', color: 'text-emerald-400' },
    { line: 'NJ Transit Line 2', destination: 'Hoboken Terminal', mins: 28, status: 'Delayed', color: 'text-amber-400' }
  ]);
  const [customIncident, setCustomIncident] = useState('');
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Phase 3: Text to Speech with Language
  const handleSpeak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  }, [language]);

  // Phase 3: Incident Reporting
  const handleReportIncident = useCallback(() => {
    setShowIncidentModal(true);
  }, []);

  // Phase 3: Gamified Fan Cam
  const handleFanCam = useCallback(() => {
    setShowFanCamModal(true);
  }, []);

  // Sustainability & Transit Feature
  const handleTransitInfo = useCallback(() => {
    setMessages(prev => [...prev, { role: 'user', content: 'Eco-Transit Options' }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'The NJ Transit rail from Secaucus is running on time. Taking the train instead of driving reduces your carbon footprint by ~15 lbs of CO2! 🚆🌿 [AWARD_GREEN_POINTS]' }]);
    }, 1000);
  }, []);

  // Handle AR Mode Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (isARMode) {
      setCameraError(false);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn("Camera access denied or unavailable. Using simulated AR background.", err);
            setCameraError(true);
          });
      } else {
        console.warn("navigator.mediaDevices is unavailable. Using simulated AR background.");
        setCameraError(true);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isARMode]);

  // Phase 11: Real-Time Smart Ball Telemetry
  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (isARMode && showPlayerStats) {
      eventSource = new EventSource('/api/stream/telemetry');
      eventSource.onmessage = (event) => {
        try {
          const liveData = JSON.parse(event.data);
          setTelemetry({ speed_kmh: liveData.speed_kmh, spin_rpm: liveData.spin_rpm });
        } catch (err) {
          console.error("Telemetry parse error", err);
        }
      };
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isARMode, showPlayerStats]);

  // Phase 11: Real-Time Transit Data
  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (showEcoTransitModal) {
      eventSource = new EventSource('/api/external/transit');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTransitData(data);
        } catch (err) {
          console.error("Transit parse error", err);
        }
      };
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [showEcoTransitModal]);

  // Listen to Global SSE for Flash Sales
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (event) => {
      try {
        const liveData = JSON.parse(event.data);
        if (liveData && liveData.flashSales) {
          setFlashSales(liveData.flashSales);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('stadialogix_green_points');
    if (saved) setGreenPoints(parseInt(saved, 10));
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      if (typeof chatContainerRef.current.scrollTo === 'function') {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        // Fallback for jsdom in tests
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      setActiveLocation(lastMsg.content);
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowVIPModal(false);
        setShowSeatView(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const recognitionRef = useRef<any>(null);

  const toggleListen = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition", e);
        }
      }
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const latestTranscript = event.results[event.results.length - 1][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + latestTranscript);
    };
    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting recognition", e);
      setIsListening(false);
    }
  }, [isListening]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !imagePreview) return;

    const userMessage: ChatMessage = { 
        role: 'user', 
        content: input || (imagePreview ? 'Please analyze this image and tell me where I am.' : ''),
        image: imagePreview || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], language })
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered a network error connecting to the stadium.' }]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      if (reader) {
        // Add an empty assistant message first that we will stream into
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          aiText += chunk;
          
          setMessages(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { role: 'assistant', content: aiText };
            return newHistory;
          });
        }
      }

      // Handle green points gamification
      if (aiText.includes('[AWARD_GREEN_POINTS]')) {
        setGreenPoints(prev => {
          const newPoints = prev + 50;
          localStorage.setItem('stadialogix_green_points', newPoints.toString());
          return newPoints;
        });
      }

      // Phase 4: Trigger Ops Alert dynamically
      if (aiText.includes('[TRIGGER_OPS_ALERT]')) {
        fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: {
              type: 'crowd',
              severity: 'Critical',
              title: 'AI Detected Crowd Crush Risk',
              description: 'Fan reports dangerous crowding conditions. Requires immediate ops review.',
              location: 'User Reported Location',
              time: new Date().toLocaleTimeString()
            }
          })
        }).catch(console.error);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered a network error connecting to the stadium.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, imagePreview, messages]);

  return (
    <div id="main-content" className={`flex flex-col h-[100svh] overflow-hidden ${isARMode ? 'bg-transparent' : 'bg-slate-950'} font-sans relative w-full max-w-[100vw]`}>
      
      {/* AR Camera Background Feed */}
      {isARMode && (
        <>
          {cameraError ? (
            <div className="fixed inset-0 w-full h-full z-0 filter brightness-75 bg-slate-800 bg-[url('https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center">
              <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur text-white/50 text-xs font-mono absolute bottom-20 left-1/2 -translate-x-1/2">
                Simulated Camera Feed (Hardware Unavailable)
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="fixed inset-0 w-full h-full object-cover z-0 filter brightness-75"
            />
          )}
          {/* Phase 5: AR Wayfinding Overlay */}
          <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-20">
            <div className="text-emerald-400 animate-bounce drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] mt-8">
              <p className="text-white font-extrabold text-2xl tracking-wide">{activeLocation ? 'Navigating' : 'Wayfinding Active'} <span className="text-slate-400 text-lg">{activeLocation ? `to ${activeLocation}` : ''}</span></p>
            </div>
            {/* Bottleneck Warning Overlay */}
            {activeLocation && (
              <div className="absolute top-1/3 left-1/4 bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] transform -rotate-12">
                 <p className="text-red-400 font-bold text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Rerouting around crowd</p>
              </div>
            )}
            
            {/* Phase 10: Smart Ball (SAOT) Telemetry */}
            {showPlayerStats && (
              <div className="absolute bottom-1/4 right-1/4 bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{t('smart_ball')}</span>
                </div>
                <p className="text-white font-mono text-sm flex justify-between gap-4"><span>{t('speed')}</span> <span className="font-bold text-emerald-400">{telemetry.speed_kmh} km/h</span></p>
                <p className="text-white font-mono text-sm flex justify-between gap-4"><span>{t('spin')}</span> <span className="font-bold text-emerald-400">{telemetry.spin_rpm} rpm</span></p>
                <p className="text-slate-400 font-mono text-[10px] flex justify-between gap-4"><span>{t('sensor')}</span> <span className="text-cyan-500 animate-pulse">LIVE 500Hz</span></p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Premium Dark Theme Animated Background (Hidden in AR Mode) */}
      {!isARMode && (
        <>
          <div className="absolute top-0 -left-10 w-96 h-96 bg-fuchsia-900/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob pointer-events-none z-0"></div>
          <div className="absolute top-0 -right-10 w-96 h-96 bg-cyan-900/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000 pointer-events-none z-0"></div>
          <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-blue-900/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-4000 pointer-events-none z-0"></div>
        </>
      )}

      {/* Header */}
      <header className={`flex items-center justify-between px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] ${isARMode ? 'bg-slate-900/40' : 'bg-slate-900/50'} backdrop-blur-xl border-b border-slate-800/50 shadow-md z-20 shrink-0`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
             <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">{t('app_title')}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-fuchsia-500"/> {t('location')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Phase 10: 5G Network Slicing */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/30 uppercase tracking-widest mr-2">
            <Wifi className="w-3.5 h-3.5 animate-pulse" /> 5G Slice {t('active')} • 2ms
          </div>
          
          <div className="relative flex items-center bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors mr-1">
             <Globe className="w-4 h-4 text-cyan-400 ml-2" />
             <select 
               value={language}
               onChange={(e) => {
                 setLanguage(e.target.value as any);
                 // Reset chat to apply new AI greeting
                 setMessages([{ role: 'assistant', content: translations[e.target.value as keyof typeof translations]?.ai_greeting || 'Welcome to StadiaLogix...' }]);
               }}
               className="bg-transparent text-xs text-white font-bold py-1.5 pr-6 pl-2 outline-none cursor-pointer appearance-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
             >
               <option value="ar-SA" className="bg-slate-800 text-slate-200">العربية (Arabic)</option>
               <option value="bn-IN" className="bg-slate-800 text-slate-200">বাংলা (Bengali)</option>
               <option value="zh-CN" className="bg-slate-800 text-slate-200">中文 (Chinese)</option>
               <option value="en-US" className="bg-slate-800 text-slate-200">English</option>
               <option value="fr-FR" className="bg-slate-800 text-slate-200">Français (French)</option>
               <option value="de-DE" className="bg-slate-800 text-slate-200">Deutsch (German)</option>
               <option value="gu-IN" className="bg-slate-800 text-slate-200">ગુજરાતી (Gujarati)</option>
               <option value="hi-IN" className="bg-slate-800 text-slate-200">हिन्दी (Hindi)</option>
               <option value="it-IT" className="bg-slate-800 text-slate-200">Italiano (Italian)</option>
               <option value="ja-JP" className="bg-slate-800 text-slate-200">日本語 (Japanese)</option>
               <option value="kn-IN" className="bg-slate-800 text-slate-200">ಕನ್ನಡ (Kannada)</option>
               <option value="ko-KR" className="bg-slate-800 text-slate-200">한국어 (Korean)</option>
               <option value="ml-IN" className="bg-slate-800 text-slate-200">മലയാളം (Malayalam)</option>
               <option value="mr-IN" className="bg-slate-800 text-slate-200">मराठी (Marathi)</option>
               <option value="pt-BR" className="bg-slate-800 text-slate-200">Português (Portuguese)</option>
               <option value="pa-IN" className="bg-slate-800 text-slate-200">ਪੰਜਾਬੀ (Punjabi)</option>
               <option value="ru-RU" className="bg-slate-800 text-slate-200">Русский (Russian)</option>
               <option value="es-ES" className="bg-slate-800 text-slate-200">Español (Spanish)</option>
               <option value="ta-IN" className="bg-slate-800 text-slate-200">தமிழ் (Tamil)</option>
               <option value="te-IN" className="bg-slate-800 text-slate-200">తెలుగు (Telugu)</option>
               <option value="th-TH" className="bg-slate-800 text-slate-200">ไทย (Thai)</option>
               <option value="tr-TR" className="bg-slate-800 text-slate-200">Türkçe (Turkish)</option>
               <option value="ur-PK" className="bg-slate-800 text-slate-200">اردو (Urdu)</option>
               <option value="vi-VN" className="bg-slate-800 text-slate-200">Tiếng Việt (Vietnamese)</option>
             </select>
          </div>
          
          {/* Phase 3: View From Seat */}
          <button 
            onClick={() => setShowSeatView(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-500/30"
            aria-label="3D View From Seat"
          >
            <Tv2 className="w-3.5 h-3.5" /> {t('seat_3d')}
          </button>
          
          {/* Phase 3: VIP Biometrics */}
          <button 
            onClick={() => setShowVIPModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-500/30"
            aria-label="VIP Fast-Pass"
          >
            <ScanFace className="w-3.5 h-3.5" /> {t('fast_pass')}
          </button>
          <button 
            onClick={() => setIsARMode(!isARMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isARMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            aria-label="Toggle AR Camera Mode"
          >
            <Camera className="w-3.5 h-3.5" />
            {isARMode ? t('ar_on') : t('ar_off')}
          </button>

          {/* Phase 13: Accessibility Support */}
          <button 
            onClick={() => setAccessibilityMode(!accessibilityMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${accessibilityMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            aria-label="Toggle Wheelchair Accessible Routes"
          >
            ♿ Accessible Route
          </button>
          
          {greenPoints > 0 && (
            <button 
              onClick={() => setShowRewardsModal(true)}
              className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full hover:bg-green-500/20 transition-colors"
              aria-label="Open Rewards Wallet"
            >
              <Leaf className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">{greenPoints}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col lg:flex-row w-full z-10 min-h-0 ${isARMode ? 'bg-black/20 backdrop-blur-sm' : ''}`}>
        
        {/* AR Player Stats Overlay */}
        {isARMode && showPlayerStats && (
          <div className="absolute top-1/4 right-8 z-[100] bg-slate-900/80 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-fade-in">
            <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Live Player Stats</h3>
            <div className="space-y-2 text-sm text-slate-200">
              <div className="flex justify-between gap-4"><span>#10 Messi</span><span className="font-mono text-cyan-300">32.4 km/h</span></div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-[85%] h-full bg-cyan-500"></div></div>
              <div className="flex justify-between gap-4"><span>#7 Mbappe</span><span className="font-mono text-fuchsia-300">36.1 km/h</span></div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="w-[95%] h-full bg-fuchsia-500"></div></div>
            </div>
            <button className="w-full mt-3 flex items-center justify-center gap-1 text-[10px] bg-slate-800 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
              <Play className="w-3 h-3" /> Replay Last Goal
            </button>
          </div>
        )}

        {/* Left Side: Interactive Map */}
        <div className="shrink-0 lg:shrink lg:flex-1 lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-800/50 flex flex-col h-[40vh] lg:h-full lg:min-h-0 overflow-hidden relative">
          {/* Flash Sale Banner */}
          {flashSales.length > 0 && (
            <div className="absolute top-4 left-4 right-4 z-50 bg-amber-500/90 text-slate-900 px-4 py-3 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 backdrop-blur animate-bounce">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-slate-900 shrink-0" />
                <p className="text-xs font-bold leading-tight">
                  {flashSales[0].message}
                </p>
              </div>
            </div>
          )}

          <StadiumMap activeLocation={activeLocation} accessibilityMode={accessibilityMode} />
        </div>

        {/* Right Side: Chat Interface */}
        <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 overflow-hidden relative">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" role="log" aria-live="polite" aria-atomic="false">
            {useMemo(() => messages.map((msg, index) => {
              const orderMatch = msg.content.match(/\[RENDER_ORDER_CARD:(.+?)\]/);
              const orderItem = orderMatch ? orderMatch[1] : null;
              
              let orderEta = 15; // default
              if (orderItem && activeLocation) {
                try {
                  const nodes = getIoTState().nodes;
                  const secMatch = activeLocation.match(/\d+/);
                  if (secMatch) {
                    const userNodeId = `sec-${secMatch[0]}`;
                    const path = findAStarPath(nodes, 'vendor-pizza-1', userNodeId);
                    if (path && path.length > 0) {
                      orderEta = Math.max(5, Math.floor(path.length * 1.5));
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              
              const hasMerchCard = msg.content.includes('[RENDER_MERCH_CARD]');
              const hasVipCard = msg.content.includes('[RENDER_VIP_CARD]');
              
              const finalText = msg.content
                .replace(/\[RENDER_ORDER_CARD:.+?\]/, '')
                .replace(/\[RENDER_MERCH_CARD\]/, '')
                .replace(/\[RENDER_VIP_CARD\]/, '')
                .trim();

              return (
                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`inline-block p-4 rounded-3xl max-w-[85%] relative ${
                      msg.role === 'user' 
                    ? 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-500 text-white rounded-br-none shadow-[0_5px_20px_rgba(217,70,239,0.3)] ml-auto' 
                    : isARMode 
                    ? 'bg-slate-900/60 backdrop-blur-md text-slate-200 border border-slate-700/50 rounded-bl-none shadow-lg'
                    : 'bg-slate-900/80 backdrop-blur-xl text-slate-200 border border-slate-700/80 rounded-bl-none shadow-[0_0_20px_rgba(0,0,0,0.5)]'}`}>
                    
                    {msg.image && (
                      <Image src={msg.image} alt="Uploaded surroundings for location context" width={400} height={300} className="max-w-full h-auto rounded-xl mb-3 border border-slate-700/50" />
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{finalText}</p>

                    {/* Agentic Action: Order Card Injection */}
                    {orderItem && (
                      <div className="mt-4 bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-emerald-500/20 rounded-full">
                            <ShoppingCart className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">Mobile Order</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">In-Seat Delivery • <span className="text-emerald-400 font-bold">{orderEta} min ETA</span></p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl mb-3">
                          <span className="font-medium text-sm text-slate-200">{orderItem}</span>
                          <span className="font-bold text-emerald-400">$12.50</span>
                        </div>
                        <button 
                          className="w-full py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          onClick={(e) => {
                            const btn = e.currentTarget;
                            btn.innerText = "Processing...";
                            setTimeout(() => {
                              btn.innerText = "Order Placed!";
                              btn.className = "w-full py-2 bg-slate-800 text-emerald-400 border border-emerald-500/50 rounded-xl font-bold tracking-wide text-sm cursor-default";
                            }, 1500);
                          }}
                        >
                          Confirm Order & Pay
                        </button>
                      </div>
                    )}

                    {/* Agentic Action: Merch Card Injection */}
                    {hasMerchCard && (
                      <div className="mt-4 bg-slate-950 border border-fuchsia-500/30 rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-fuchsia-500/20 rounded-full">
                            <Shirt className="w-5 h-5 text-fuchsia-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">Official Merch</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">In-Seat Delivery</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl mb-3">
                          <span className="font-medium text-sm text-slate-200">FIFA 2026 Home Jersey</span>
                          <span className="font-bold text-fuchsia-400">$120.00</span>
                        </div>
                        <button 
                          className="w-full py-2 bg-gradient-to-r from-fuchsia-700 to-purple-700 hover:from-fuchsia-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(217,70,239,0.2)]"
                        >
                          Purchase Now
                        </button>
                      </div>
                    )}

                    {/* Agentic Action: VIP Card Injection */}
                    {hasVipCard && (
                      <div className="mt-4 bg-slate-950 border border-amber-500/30 rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-amber-500/20 rounded-full">
                            <Crown className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">VIP Upgrade</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Club Access</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl mb-3">
                          <span className="font-medium text-sm text-slate-200">Suite Level Access + Open Bar</span>
                          <span className="font-bold text-amber-400">+$250.00</span>
                        </div>
                        <button 
                          className="w-full py-2 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        >
                          Upgrade Ticket
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Audio Button for Assistant Messages */}
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => handleSpeak(msg.content)}
                      className="mt-2 ml-2 flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                      aria-label="Play audio for assistant message"
                      suppressHydrationWarning
                    >
                      <Volume2 className="w-3 h-3" /> Play Audio
                    </button>
                  )}
                </div>
              );
            }), [messages, isARMode])}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-5 rounded-bl-none flex items-center gap-3 shadow-black/20">
                  <Loader2 className="w-5 h-5 animate-spin text-fuchsia-400" />
                  <span className="text-slate-300 text-sm font-medium">Analyzing environment...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <footer className={`px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] ${isARMode ? 'bg-slate-900/60' : 'bg-slate-900/80'} backdrop-blur-2xl border-t border-slate-800/50 z-20 shrink-0`}>
            {imagePreview && (
              <div className="max-w-4xl mx-auto mb-3 relative inline-block">
                <Image src={imagePreview} alt="Camera upload preview" width={64} height={64} className="h-16 w-16 object-cover rounded-lg border-2 border-fuchsia-500" />
                <button suppressHydrationWarning onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" aria-label="Remove image preview">&times;</button>
              </div>
            )}
            
            {/* Phase 3 Action Bar (Gamification & Reports) */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button 
                onClick={handleReportIncident}
                className="flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-full px-2.5 py-1 hover:bg-rose-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> {t('report_incident')}
              </button>
              <button 
                onClick={handleFanCam}
                className="flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 rounded-full px-2.5 py-1 hover:bg-fuchsia-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" /> {t('fan_cam')}
              </button>
              <button 
                onClick={handleTransitInfo}
                className="flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full px-2.5 py-1 hover:bg-green-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <Leaf className="w-3.5 h-3.5" /> {t('eco_transit')}
              </button>
              <button 
                onClick={() => setShowAutonomousModal(true)}
                className="flex items-center gap-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 rounded-full px-2.5 py-1 hover:bg-indigo-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <Scan className="w-3.5 h-3.5" /> {t('amazon_go')}
              </button>
              {isARMode && (
                <button 
                  onClick={() => setShowPlayerStats(!showPlayerStats)}
                  className={`flex items-center gap-1 border rounded-full px-2.5 py-1 transition-colors font-bold text-xs shadow-sm ${showPlayerStats ? 'bg-cyan-500/40 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                >
                  <Activity className="w-3.5 h-3.5" /> {showPlayerStats ? t('hide_ar_stats') : t('show_ar_stats')}
                </button>
              )}
              <button 
                onClick={() => setShowReplaysModal(true)}
                className="flex items-center gap-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full px-2.5 py-1 hover:bg-blue-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <Play className="w-3.5 h-3.5" /> Replays
              </button>
              <button 
                onClick={() => setShowLeaderboardModal(true)}
                className="flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full px-2.5 py-1 hover:bg-green-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <Crown className="w-3.5 h-3.5" /> Green Fan Leaderboard
              </button>
              <button 
                onClick={() => setShowParkingModal(true)}
                className="flex items-center gap-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded-full px-2.5 py-1 hover:bg-orange-500/30 transition-colors font-bold text-xs shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" /> Smart Parking
              </button>
            </div>
            
            <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                suppressHydrationWarning
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors border border-slate-700 flex-shrink-0 shadow-inner"
                title="Upload Photo (Vision AI)"
                aria-label="Upload Photo for Vision AI"
                suppressHydrationWarning
              >
                <Camera className="w-5 h-5" />
              </button>

              <button 
                onClick={toggleListen}
                className={`p-3 rounded-full transition-colors border flex-shrink-0 shadow-inner ${isListening ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                title="Speak (Voice AI)"
                aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
                suppressHydrationWarning
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('placeholder')}
                className="flex-1 bg-slate-800/80 text-white rounded-full px-4 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-slate-400 text-sm border border-slate-700/50 shadow-inner"
                disabled={isLoading || isListening}
                suppressHydrationWarning
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !imagePreview)}
                className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white p-3 rounded-full hover:shadow-lg hover:shadow-fuchsia-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                aria-label="Send message"
                suppressHydrationWarning
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>
      </div>
      
      {/* VIP Fast-Pass Modal */}
      {showVIPModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="vip-fast-pass-title">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <ScanFace className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
            <h2 id="vip-fast-pass-title" className="text-2xl font-extrabold text-amber-400 mb-2">VIP Fast-Pass</h2>
            <p className="text-sm text-slate-400 mb-6">Your biometric identity has been securely verified. Proceed directly to the Express Lane.</p>
            <div className="relative bg-slate-800 rounded-xl mx-auto w-48 h-48 mb-6 overflow-hidden flex items-center justify-center border-4 border-amber-500/30">
              {/* Fake Camera Feed Background */}
              <div className="absolute inset-0 bg-slate-700 bg-[url('https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
              
              {/* Face Guide Box */}
              <div className="w-32 h-32 border-2 border-dashed border-amber-400 rounded-lg absolute z-10"></div>
              
              {/* Scanning Laser Animation */}
              <div className="w-full h-1 bg-amber-400 absolute top-0 left-0 shadow-[0_0_15px_#fbbf24] z-20 animate-[scan_2s_ease-in-out_infinite]"></div>
              
              <div className="absolute bottom-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-amber-400 font-mono z-10 border border-amber-500/30">
                [IDENTITY_VERIFIED]
              </div>
            </div>
            <button onClick={() => setShowVIPModal(false)} className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-900 rounded-full font-extrabold transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]" aria-label="Close VIP Fast-Pass modal">
              Confirm & Enter
            </button>
          </div>
        </div>
      )}

      {/* Autonomous Checkout Modal */}
      {showAutonomousModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="auto-store-title">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <Scan className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-[spin_3s_linear_infinite]" />
            <h2 id="auto-store-title" className="text-2xl font-extrabold text-indigo-400 mb-2">Autonomous Store</h2>
            <p className="text-sm text-slate-400 mb-6">Vision AI tracking is active. Just Walk Out technology enabled.</p>
            
            <div className="bg-slate-800 rounded-xl p-4 mb-6 border-l-4 border-indigo-500 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-bold text-sm">Detected Items</span>
                <span className="text-emerald-400 font-bold text-sm text-right">Auto-Charged</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700/50 pt-2 mt-2">
                <span className="text-slate-400 text-xs">1x SmartWater</span>
                <span className="text-slate-200 font-mono text-xs">$4.00</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-slate-400 text-xs">1x Stadium Pretzel</span>
                <span className="text-slate-200 font-mono text-xs">$8.50</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700/50 pt-2 mt-2">
                <span className="text-slate-200 font-bold text-sm">Total via Apple Pay</span>
                <span className="text-indigo-400 font-bold font-mono text-sm">$12.50</span>
              </div>
            </div>

            <button onClick={() => setShowAutonomousModal(false)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full font-extrabold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              Exit Store
            </button>
          </div>
        </div>
      )}

      {/* Gamification Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog">
          <div className="bg-slate-900 border border-green-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <Leaf className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-green-400 mb-2">Eco-Rewards Wallet</h2>
            <p className="text-sm text-slate-400 mb-6">You have earned <span className="text-white font-bold">{greenPoints}</span> Green Points for sustainable choices at the stadium.</p>
            <button onClick={() => setShowRewardsModal(false)} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-extrabold transition-all">Close Wallet</button>
          </div>
        </div>
      )}

      {/* Seat 3D View Modal */}
      {showSeatView && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4" role="dialog">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl overflow-hidden max-w-3xl w-full flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.3)]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Tv2 className="w-5 h-5"/> 3D Seat View</h2>
              <button onClick={() => setShowSeatView(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <div className="relative w-full h-[50vh] bg-slate-800 flex items-center justify-center overflow-hidden">
               {/* CSS Simulated 3D Stadium Environment */}
               <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>
               <div className="w-3/4 h-3/4 rounded-full border-4 border-emerald-500/20 perspective-1000 transform rotateX-60 flex items-center justify-center absolute bottom-0 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                 <div className="w-1/2 h-1/2 bg-emerald-600/30 rounded-full blur-xl"></div>
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold tracking-widest opacity-30">PITCH</div>
               </div>
               <div className="absolute bottom-10 z-10 flex flex-col items-center animate-bounce">
                 <div className="bg-blue-500 p-3 rounded-full shadow-[0_0_20px_#3b82f6]"><MapPin className="w-6 h-6 text-white" /></div>
                 <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
               </div>
            </div>
            <div className="p-6 bg-slate-900 text-center">
              <p className="text-slate-300 font-bold mb-1">Section 124, Row 12, Seat 8</p>
              <p className="text-slate-500 text-sm">Experience your view before you arrive.</p>
            </div>
          </div>
        </div>
      )}

      {/* Incident Reporting Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(243,33,115,0.2)]">
            <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Report Incident</h2>
            <div className="space-y-3 mb-6">
              <button className="w-full p-3 text-left rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium transition-colors">Medical Emergency</button>
              <button className="w-full p-3 text-left rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium transition-colors">Security/Disruption</button>
              <button className="w-full p-3 text-left rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium transition-colors" onClick={() => {
                setShowIncidentModal(false);
                setMessages(prev => [...prev, { role: 'user', content: 'REPORT: Facility Issue (Spill/Cleanup)' }]);
                setTimeout(() => setMessages(prev => [...prev, { role: 'assistant', content: 'Issue reported to maintenance. Thank you! [AWARD_GREEN_POINTS]' }]), 1000);
              }}>Facility Issue (Spill/Cleanup)</button>
            </div>
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide font-bold">Or Describe Custom Incident</label>
              <textarea 
                value={customIncident}
                onChange={(e) => setCustomIncident(e.target.value)}
                placeholder="e.g., Escalator 4 is making a loud noise..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 resize-none h-20"
              />
              <button 
                disabled={!customIncident.trim()}
                onClick={async () => {
                  try {
                    await fetch('/api/incidents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ description: customIncident.trim(), location: 'User Reported' })
                    });
                  } catch(e) { console.error(e); }
                  
                  setShowIncidentModal(false);
                  setMessages(prev => [...prev, { role: 'user', content: `REPORT: ${customIncident.trim()}` }]);
                  setCustomIncident('');
                  setTimeout(() => setMessages(prev => [...prev, { role: 'assistant', content: 'Custom issue reported to ops center. Thank you! [AWARD_GREEN_POINTS]' }]), 1000);
                }}
                className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Submit Custom Report
              </button>
            </div>
            <button onClick={() => setShowIncidentModal(false)} className="w-full py-2 text-slate-400 hover:text-white font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Fan Cam Modal */}
      {showFanCamModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4" role="dialog">
          <div className="bg-slate-900 border border-fuchsia-500/50 rounded-3xl overflow-hidden max-w-md w-full text-center shadow-[0_0_40px_rgba(217,70,239,0.3)]">
             <div className="relative w-full aspect-square bg-slate-800 flex flex-col items-center justify-center border-b-8 border-fuchsia-600">
                <Camera className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400 font-medium">Camera Feed Active</p>
                {/* Simulated Team Frame */}
                <div className="absolute inset-0 pointer-events-none border-[16px] border-transparent border-t-fuchsia-500 border-b-cyan-500 opacity-50"></div>
                <div className="absolute bottom-4 left-4 text-white font-extrabold text-2xl italic drop-shadow-md">STADIALOGIX 2026</div>
             </div>
             <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">Ready for the Jumbotron?</h2>
                <p className="text-sm text-slate-400 mb-6">Take a photo with the exclusive match day filter.</p>
                <button onClick={() => {
                  setShowFanCamModal(false);
                  setMessages(prev => [...prev, { role: 'assistant', content: 'Awesome photo! We have queued it for the Jumbotron in the 2nd half. 📸' }]);
                }} className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white rounded-full font-extrabold transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)] mb-3">Snap & Upload</button>
                <button onClick={() => setShowFanCamModal(false)} className="text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Eco-Transit Modal */}
      {showEcoTransitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog">
          <div className="bg-slate-900 border border-green-500/50 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <h2 className="text-2xl font-extrabold text-green-400 mb-2 flex items-center gap-2"><Leaf className="w-6 h-6"/> Transit Hub</h2>
            <p className="text-sm text-slate-400 mb-6">Live schedules for MetLife Meadowlands Station.</p>
            
            <div className="space-y-3 mb-6">
              {transitData.map((train, i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white block">{train.line}</span>
                    <span className="text-xs text-slate-400">To {train.destination}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${train.color}`}>{train.mins} min</span>
                    <span className="text-[10px] text-slate-500">{train.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30 text-center mb-6">
               <p className="text-xs text-green-400 font-medium mb-1">Your Carbon Savings Today</p>
               <p className="text-xl font-bold text-white">4.2 kg CO₂</p>
            </div>

            <button onClick={() => setShowEcoTransitModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-all">Close Dashboard</button>
          </div>
        </div>
      )}      {showRewardsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="rewards-title">
          <div className="bg-slate-900 border border-green-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <Leaf className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 id="rewards-title" className="text-2xl font-extrabold text-green-400 mb-2">Rewards Wallet</h2>
            <p className="text-sm text-slate-400 mb-6">You have {greenPoints} Green Points.</p>
            
            <div className="space-y-3 mb-6">
              <button 
                disabled={greenPoints < 100}
                onClick={() => {
                  const newPoints = greenPoints - 100;
                  setGreenPoints(newPoints);
                  localStorage.setItem('stadialogix_green_points', newPoints.toString());
                  alert('Successfully redeemed 10% Off Food!');
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex justify-between px-4 items-center transition-colors"
              >
                <span>10% Off Food</span>
                <span className="text-green-400">100 pts</span>
              </button>
              <button 
                disabled={greenPoints < 500}
                onClick={() => {
                  const newPoints = greenPoints - 500;
                  setGreenPoints(newPoints);
                  localStorage.setItem('stadialogix_green_points', newPoints.toString());
                  alert('Successfully redeemed Digital AR Jersey!');
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex justify-between px-4 items-center transition-colors"
              >
                <span>Digital AR Jersey</span>
                <span className="text-green-400">500 pts</span>
              </button>
            </div>

            <button onClick={() => setShowRewardsModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-colors">
              Close Wallet
            </button>
          </div>
        </div>
      )}

      {/* 3D View From Seat Modal */}
      {showSeatView && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4" role="dialog" aria-modal="true" aria-labelledby="seat-view-title">
          <div className="bg-slate-950 border border-slate-700 rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h2 id="seat-view-title" className="text-lg font-extrabold text-blue-400 flex items-center gap-2"><Tv2 className="w-5 h-5" /> 3D View From Seat</h2>
              <button onClick={() => setShowSeatView(false)} className="text-slate-400 hover:text-white" aria-label="Close 3D seat view modal">&times; Close</button>
            </div>
            <div className="h-[60vh] bg-slate-900 relative">
              {/* Fake 3D interactive view for demo */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-950/60 backdrop-blur-md px-6 py-3 rounded-full border border-slate-800 animate-pulse">
                  <p className="text-sm font-bold text-slate-200">Simulated 3D Pitch View • Section 120, Row G</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Angle Live Replays Modal */}
      {showReplaysModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4" role="dialog">
          <div className="bg-slate-950 border border-slate-700 rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-blue-400 flex items-center gap-2"><Play className="w-5 h-5" /> Multi-Angle Replays</h2>
              <button onClick={() => setShowReplaysModal(false)} className="text-slate-400 hover:text-white">&times; Close</button>
            </div>
            <div className="h-[50vh] bg-slate-900 relative flex flex-col items-center justify-center">
              <div className="text-slate-400 flex flex-col items-center">
                <Tv2 className="w-16 h-16 mb-4 opacity-50" />
                <p>Select an angle below to view the latest highlight.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-4 overflow-x-auto">
              <button className="px-4 py-2 bg-blue-600 rounded-xl text-white font-bold whitespace-nowrap">Main Broadcast</button>
              <button className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 font-bold whitespace-nowrap hover:bg-slate-700">Goal Cam</button>
              <button className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 font-bold whitespace-nowrap hover:bg-slate-700">Tactical Cam</button>
              <button className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 font-bold whitespace-nowrap hover:bg-slate-700">Spidercam</button>
            </div>
          </div>
        </div>
      )}

      {/* Gamified Green Fan Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog">
          <div className="bg-slate-900 border border-green-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-green-400 mb-2">Green Fan Leaderboard</h2>
            <p className="text-sm text-slate-400 mb-6">Top sustainable sections competing for the halftime reward!</p>
            <div className="space-y-3 mb-6">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 flex justify-between items-center">
                <span className="font-bold text-white text-lg">1. Section 120</span>
                <span className="font-mono text-yellow-400 font-bold">12,450 pts</span>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
                <span className="font-bold text-slate-300">2. Section 325</span>
                <span className="font-mono text-slate-400">11,200 pts</span>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
                <span className="font-bold text-slate-300">3. Section 214</span>
                <span className="font-mono text-slate-400">10,800 pts</span>
              </div>
            </div>
            <button onClick={() => setShowLeaderboardModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-colors">
              Close Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* Smart Parking Auto-Rerouting Modal */}
      {showParkingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog">
          <div className="bg-slate-900 border border-orange-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(249,115,22,0.2)]">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-extrabold text-orange-400 mb-2">Parking Alert</h2>
            <p className="text-sm text-slate-300 mb-6">Lot E has reached 95% capacity. Traffic is building up.</p>
            <div className="bg-slate-800 rounded-xl p-4 mb-6 border-l-4 border-emerald-500 text-left">
              <p className="text-emerald-400 font-bold text-sm mb-1">Rerouting Available</p>
              <p className="text-slate-400 text-xs mb-3">We have reserved a spot for you in Lot G with a faster entry route.</p>
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm">Accept Reroute & Update GPS</button>
            </div>
            <button onClick={() => setShowParkingModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
