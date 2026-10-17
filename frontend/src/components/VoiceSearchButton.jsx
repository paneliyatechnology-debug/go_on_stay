import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

const VoiceSearchButton = ({ onTranscript, onSearch, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // English (India) with Hindi/Hinglish recognition support

      recognition.onstart = () => {
        setIsListening(true);
        setTranscriptText('');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscriptText(currentTranscript);

        if (event.results[0].isFinal) {
          cleanAndDispatch(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('[VoiceSearch] Recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[VoiceSearch] Init error:', e);
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const cleanAndDispatch = (rawText) => {
    if (!rawText) return;
    
    // Clean conversational phrases in English and Hindi/Hinglish without destroying hotel names
    let cleaned = rawText
      .replace(/^(show\s+me|find\s+me|look\s+for|search\s+for|search|i\s+want|i\s+need|mujhe|hume|koi|bhai|please)\s+/i, '')
      .replace(/^(hotels?\s+in|stays?\s+in|rooms?\s+in|resorts?\s+in|places?\s+in|in)\s+/i, '')
      .replace(/\s+(chahiye|dikhao|dikhana|batao|karo|dekho|search\s+karo)$/i, '')
      .trim();

    // Capitalize first letter of words
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    if (onTranscript) {
      onTranscript(cleaned || rawText);
    }
    if (onSearch) {
      setTimeout(() => onSearch(cleaned || rawText), 300);
    }
  };

  const toggleListening = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!supported) {
      alert("🎙️ Voice Search is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('[VoiceSearch] Start failed:', err);
      }
    }
  };

  if (!supported) return null;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isListening
            ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 scale-105'
            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
        } ${className}`}
        title={isListening ? 'Listening... Click to stop' : 'Search by Voice'}
        aria-label="Search by voice"
      >
        {isListening ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-rose-400 opacity-75"></span>
            <Mic className="w-4 h-4 text-white relative z-10 animate-bounce" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Floating Listening Feedback Bubble */}
      {isListening && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl border border-slate-700/80 z-50 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span>{transcriptText ? `"${transcriptText}"` : 'Listening... Speak city or hotel'}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceSearchButton;
