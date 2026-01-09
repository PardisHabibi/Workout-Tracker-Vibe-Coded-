import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react';

interface TimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Timer: React.FC<TimerProps> = ({ isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(60); // Default 60s
  
  // Custom input state
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished
      setIsActive(false);
      playAlert();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playAlert = () => {
    // Simple beep using AudioContext or fallback
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880; 
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => osc.stop(), 500);
        }
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  const startTimer = () => {
    if (timeLeft === 0) {
        // Recalculate based on inputs if 0
        const totalSeconds = (customMinutes * 60) + customSeconds;
        setTimeLeft(totalSeconds);
        setInitialTime(totalSeconds);
    }
    setIsActive(true);
  };

  const pauseTimer = () => setIsActive(false);

  const resetTimer = () => {
    setIsActive(false);
    const totalSeconds = (customMinutes * 60) + customSeconds;
    setTimeLeft(totalSeconds);
    setInitialTime(totalSeconds);
  };

  const handleSetTime = (mins: number, secs: number) => {
    setCustomMinutes(mins);
    setCustomSeconds(secs);
    const total = (mins * 60) + secs;
    setInitialTime(total);
    setTimeLeft(total);
    setIsActive(false);
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <Bell size={20} className="text-emerald-500" />
            Rest Timer
          </h2>
        </div>

        {/* Circular Progress / Time Display */}
        <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="6" />
                <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="6"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * progress) / 100}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            <div className="text-4xl font-mono font-bold text-white tabular-nums z-10">
                {formatTime(timeLeft)}
            </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
            {!isActive ? (
                <button 
                    onClick={startTimer}
                    className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <Play fill="currentColor" size={24} className="ml-1" />
                </button>
            ) : (
                <button 
                    onClick={pauseTimer}
                    className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <Pause fill="currentColor" size={24} />
                </button>
            )}
            <button 
                onClick={resetTimer}
                className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                <RotateCcw size={24} />
            </button>
        </div>

        {/* Presets / Custom Input */}
        <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800">
            <div className="flex gap-2 justify-center mb-4">
                {[30, 60, 90, 120].map(secs => (
                    <button
                        key={secs}
                        onClick={() => handleSetTime(0, secs)}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700"
                    >
                        {secs}s
                    </button>
                ))}
            </div>
            
            <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                    <label className="text-[10px] text-zinc-500 uppercase mb-1">Min</label>
                    <input 
                        type="number" 
                        min="0" max="59"
                        value={customMinutes}
                        onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCustomMinutes(val);
                            handleSetTime(val, customSeconds);
                        }}
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center text-white focus:border-emerald-500 focus:outline-none"
                    />
                </div>
                <span className="text-zinc-500 mt-4">:</span>
                <div className="flex flex-col items-center">
                    <label className="text-[10px] text-zinc-500 uppercase mb-1">Sec</label>
                    <input 
                        type="number" 
                        min="0" max="59"
                        value={customSeconds}
                        onChange={(e) => {
                             const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCustomSeconds(val);
                            handleSetTime(customMinutes, val);
                        }}
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center text-white focus:border-emerald-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};