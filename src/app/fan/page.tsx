'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Navigation, Loader2, Volume2, ArrowLeft, Camera, Image as ImageIcon, Mic, Leaf, ShoppingCart, Crown, Shirt } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
});

export default function FanMode() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Welcome to StadiaLogix, your 2026 World Cup Smart Assistant. How can I help you navigate MetLife Stadium today? You can also upload a photo of your surroundings if you are lost!' }
  ]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState('');
  const [greenPoints, setGreenPoints] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('stadialogix_green_points');
    if (saved) setGreenPoints(parseInt(saved, 10));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      setActiveLocation(lastMsg.content);
    }
  }, [messages]);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const startListening = () => {
    // @ts-expect-error - SpeechRecognition is not fully typed in standard TS lib
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US'; // Uses browser native speech to text model
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

    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;

    const userMessage = { 
        role: 'user', 
        content: input || (imagePreview ? 'Please analyze this image and tell me where I am.' : ''),
        image: imagePreview 
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
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 font-sans relative overflow-hidden w-full max-w-[100vw]">
      {/* Premium Dark Theme Animated Background */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-fuchsia-900/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-cyan-900/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-blue-900/30 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 shadow-md z-20 shrink-0">
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
        
        {/* Gamification Badge */}
        {greenPoints > 0 && (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{greenPoints} pts</span>
          </div>
        )}
      </header>

      {/* Main Split View - Side-by-side */}
      <div className="grid grid-cols-2 flex-1 h-0 overflow-hidden z-10 w-full">
        
        {/* Left Side: Interactive Map */}
        <div className="p-4 lg:p-6 border-r border-slate-800/50 flex flex-col h-full min-h-0 overflow-hidden">
          <StadiumMap activeLocation={activeLocation} />
        </div>

        {/* Right Side: Chat Interface */}
        <div className="flex flex-col h-full min-h-0 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
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
                  <div className={`max-w-[90%] md:max-w-[80%] rounded-3xl p-5 shadow-lg ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-cyan-900 to-blue-900 text-white rounded-br-none shadow-[0_0_20px_rgba(8,145,178,0.3)] backdrop-blur-md border border-cyan-500/30' 
                    : 'bg-slate-900/80 backdrop-blur-xl text-slate-200 border border-slate-700/80 rounded-bl-none shadow-[0_0_20px_rgba(0,0,0,0.5)]'}`}>
                    
                    {msg.image && (
                      <img src={msg.image} alt="Uploaded surroundings" className="max-w-full h-auto rounded-xl mb-3 border border-slate-700/50" />
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
          <footer className="p-4 bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800/50 z-20 shrink-0">
            {imagePreview && (
              <div className="max-w-4xl mx-auto mb-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border-2 border-fuchsia-500" />
                <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">&times;</button>
              </div>
            )}
            
            <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors border border-slate-700 flex-shrink-0 shadow-inner"
                title="Upload Photo (Vision AI)"
              >
                <Camera className="w-5 h-5" />
              </button>

              <button 
                onClick={startListening}
                className={`p-3 rounded-full transition-colors border flex-shrink-0 shadow-inner ${isListening ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                title="Speak (Voice AI)"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message or upload a photo of your surroundings..."
                className="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-full px-4 md:px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all placeholder:text-slate-500 text-slate-200 shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !imagePreview)}
                className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white p-3 rounded-full hover:shadow-lg hover:shadow-fuchsia-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
