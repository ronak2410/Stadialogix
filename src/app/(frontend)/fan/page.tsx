'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MapPin, Navigation, Loader2, Volume2, ArrowLeft, Camera, Mic, Leaf, ShoppingCart, Crown, Shirt, AlertTriangle, Globe, ScanFace, Tv2, Activity, Play } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { ChatMessage } from '@/types';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
});

export default function FanMode() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Welcome to StadiaLogix, your 2026 World Cup Smart Assistant. How can I help you navigate MetLife Stadium today? You can also upload a photo of your surroundings if you are lost!' }
  ]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState('');
  const [greenPoints, setGreenPoints] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showSeatView, setShowSeatView] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    setMessages(prev => [...prev, { role: 'user', content: 'REPORT INCIDENT: There is a spill near Section 120.' }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Your incident report has been securely transmitted to Staff Ops. Thank you for keeping the stadium safe! [AWARD_GREEN_POINTS]' }]);
    }, 1000);
  }, []);

  // Phase 3: Gamified Fan Cam
  const handleFanCam = useCallback(() => {
    setMessages(prev => [...prev, { role: 'user', content: 'SUBMIT FAN CAM' }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Your AR selfie has been submitted to the Jumbotron queue! Keep an eye on the big screens. [AWARD_GREEN_POINTS]' }]);
    }, 1000);
  }, []);

  // Handle AR Mode Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (isARMode) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access denied or unavailable", err);
          setIsARMode(false);
        });
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

  useEffect(() => {
    const saved = localStorage.getItem('stadialogix_green_points');
    if (saved) setGreenPoints(parseInt(saved, 10));
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const toggleListen = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await response.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        let finalMessage = data.message;
        if (finalMessage.includes('[AWARD_GREEN_POINTS]')) {
          finalMessage = finalMessage.replace('[AWARD_GREEN_POINTS]', '').trim();
          setGreenPoints(prev => {
            const newPoints = prev + 50;
            localStorage.setItem('stadialogix_green_points', newPoints.toString());
            return newPoints;
          });
        }
        setMessages(prev => [...prev, { role: 'assistant', content: finalMessage }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered a network error connecting to the stadium.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, imagePreview, messages]);

  return (
    <div id="main-content" className={`flex flex-col min-h-[100svh] ${isARMode ? 'bg-transparent' : 'bg-slate-950'} font-sans relative overflow-x-hidden w-full max-w-[100vw]`}>
      
      {/* AR Camera Background Feed */}
      {isARMode && (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="fixed inset-0 w-full h-full object-cover z-0 filter brightness-75"
        />
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
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">StadiaLogix Fan</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-fuchsia-500"/> NY/NJ Stadium (2026)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Phase 3: View From Seat */}
          <button 
            onClick={() => setShowSeatView(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-500/30"
            aria-label="3D View From Seat"
          >
            <Tv2 className="w-3.5 h-3.5" /> Seat 3D
          </button>
          
          {/* Phase 3: VIP Biometrics */}
          <button 
            onClick={() => setShowVIPModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-500/30"
            aria-label="VIP Fast-Pass"
          >
            <ScanFace className="w-3.5 h-3.5" /> Fast-Pass
          </button>
          <button 
            onClick={() => setIsARMode(!isARMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isARMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            aria-label="Toggle AR Camera Mode"
          >
            <Camera className="w-3.5 h-3.5" />
            {isARMode ? 'AR ON' : 'AR OFF'}
          </button>
          
          {greenPoints > 0 && (
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
              <Leaf className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">{greenPoints}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`flex flex-col lg:flex-row w-full z-10 lg:min-h-[calc(100svh-96px)] ${isARMode ? 'bg-black/20 backdrop-blur-sm' : ''}`}>
        
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
        <div className="lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-800/50 flex flex-col h-[42svh] min-h-[300px] lg:h-[calc(100svh-96px)] lg:min-h-[560px] overflow-hidden">
          <StadiumMap activeLocation={activeLocation} />
        </div>

        {/* Right Side: Chat Interface */}
        <div className="lg:w-1/2 flex flex-col min-h-[520px] lg:h-[calc(100svh-96px)] lg:min-h-[560px] overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth" role="log" aria-live="polite" aria-atomic="false">
            {messages.map((msg, index) => {
              const orderMatch = msg.content.match(/\[RENDER_ORDER_CARD:(.+?)\]/);
              const orderItem = orderMatch ? orderMatch[1] : null;
              
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
                      <img src={msg.image} alt="Uploaded surroundings for location context" className="max-w-full h-auto rounded-xl mb-3 border border-slate-700/50" />
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
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Skip the line</p>
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
            })}
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
                <img src={imagePreview} alt="Camera upload preview" className="h-16 w-16 object-cover rounded-lg border-2 border-fuchsia-500" />
                <button suppressHydrationWarning onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" aria-label="Remove image preview">&times;</button>
              </div>
            )}
            
            {/* Phase 3 Action Bar */}
            <div className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-2 items-center text-xs">
              <div className="flex items-center gap-1 bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <select 
                  className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  aria-label="Select Navigation Audio Language"
                >
                  <option value="en-US" className="bg-slate-800 text-slate-200">English</option>
                  <option value="es-ES" className="bg-slate-800 text-slate-200">Español</option>
                  <option value="fr-FR" className="bg-slate-800 text-slate-200">Français</option>
                  <option value="de-DE" className="bg-slate-800 text-slate-200">Deutsch</option>
                </select>
              </div>
              <button 
                onClick={handleReportIncident}
                className="flex items-center gap-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-full px-3 py-1 hover:bg-rose-500/30 transition-colors font-bold"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Report Incident
              </button>
              <button 
                onClick={handleFanCam}
                className="flex items-center gap-1.5 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 rounded-full px-3 py-1 hover:bg-fuchsia-500/30 transition-colors font-bold"
              >
                <Camera className="w-3.5 h-3.5" /> Submit to Fan Cam
              </button>
              {isARMode && (
                <button 
                  onClick={() => setShowPlayerStats(!showPlayerStats)}
                  className={`flex items-center gap-1.5 border rounded-full px-3 py-1 transition-colors font-bold ${showPlayerStats ? 'bg-cyan-500/40 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                >
                  <Activity className="w-3.5 h-3.5" /> {showPlayerStats ? 'Hide AR Stats' : 'Show AR Stats'}
                </button>
              )}
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
                placeholder="Message or upload a photo of your surroundings..."
                aria-label="Chat message input"
                className="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-full px-4 md:px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all placeholder:text-slate-500 text-slate-200 shadow-inner"
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
            <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 mb-6 flex items-center justify-center">
              <div className="w-full h-full border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-mono text-xs">
                [SECURE_QR_CODE]
              </div>
            </div>
            <button onClick={() => setShowVIPModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold transition-colors" aria-label="Close VIP Fast-Pass modal">
              Close
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

    </div>
  );
}
