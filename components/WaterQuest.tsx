import React, { useEffect, useState } from 'react';
import { Droplet, Trophy } from 'lucide-react';
import { DAILY_WATER_GOAL } from '../types';

interface Props {
  currentCount: number;
  onAddWater: () => void;
}

export const WaterQuest: React.FC<Props> = ({ currentCount, onAddWater }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timer);
  }, [currentCount]);

  const percentage = Math.min((currentCount / DAILY_WATER_GOAL) * 100, 100);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in p-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold game-font text-blue-600">
          물 폭탄 장전!
        </h2>
        <p className="text-gray-500 text-sm">
          몬스터를 물리치려면 물 폭탄이 필요해요!
        </p>
      </div>

      <div className="relative w-48 h-48 sm:w-64 sm:h-64">
        {/* Background Circle */}
        <div className="absolute inset-0 rounded-full border-8 border-blue-100"></div>
        
        {/* Fill SVG */}
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-end justify-center bg-white border-8 border-transparent">
          <div 
            className="w-full bg-blue-400 transition-all duration-1000 ease-out opacity-80"
            style={{ height: `${percentage}%` }}
          >
            {/* Wave animation simulation via CSS can be added here, kept simple for now */}
            <div className="w-full h-4 bg-blue-500 opacity-50 animate-pulse"></div>
          </div>
        </div>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {currentCount >= DAILY_WATER_GOAL ? (
            <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-lg animate-bounce" />
          ) : (
            <span className={`text-4xl font-bold game-font ${currentCount > 0 ? 'text-white' : 'text-blue-300'} drop-shadow-md`}>
              {currentCount} / {DAILY_WATER_GOAL}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onAddWater}
        disabled={currentCount >= DAILY_WATER_GOAL}
        className={`
          relative group overflow-hidden rounded-full px-8 py-4 
          transition-all duration-200 transform active:scale-95 shadow-xl
          ${currentCount >= DAILY_WATER_GOAL 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500'}
        `}
      >
        <div className="flex items-center gap-2 text-white font-bold text-lg">
           <Droplet className={`w-6 h-6 ${animate ? 'animate-ping' : ''}`} fill="currentColor" />
           <span>{currentCount >= DAILY_WATER_GOAL ? '장전 완료!' : '물 마시기'}</span>
        </div>
      </button>

      {currentCount >= DAILY_WATER_GOAL && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
           🌟 내일 배변 성공 확률 UP! 🌟
        </div>
      )}
    </div>
  );
};