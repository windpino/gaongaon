import React, { useState } from 'react';
import { UserProfile, RewardItem, RewardTier, Reward } from '../types';
import { Gift, Sparkles, X } from 'lucide-react';
import { DEFAULT_REWARDS } from '../constants';

interface Props {
  user: UserProfile;
  wonRewards: Reward[];
  parentRewards: RewardItem[];
  onRedeemTicket: (ticketType: 'silver' | 'gold', reward: RewardItem) => void;
}

export const RewardGacha: React.FC<Props> = ({ user, wonRewards, parentRewards, onRedeemTicket }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<RewardItem | null>(null);
  const [activeTicket, setActiveTicket] = useState<'silver' | 'gold' | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const startGacha = (ticketType: 'silver' | 'gold') => {
    if ((ticketType === 'silver' && user.tickets.silver < 1) || (ticketType === 'gold' && user.tickets.gold < 1)) return;

    setActiveTicket(ticketType);
    setIsSpinning(true);
    setResult(null);
    setIsClosing(false);

    setTimeout(() => {
      // 1. Prepare Pool (Avoid Duplicates logic)
      const masterPool = parentRewards.length > 0 ? parentRewards : DEFAULT_REWARDS;
      const collectedTitles = new Set(wonRewards.map(r => r.title));
      let availablePool = masterPool.filter(r => !collectedTitles.has(r.title));
      
      // If pool is empty (all collected), reset to full pool
      if (availablePool.length === 0) {
        availablePool = [...masterPool];
      }

      // 2. Filter by Ticket Type Rules
      // Silver ticket cannot obtain Legendary items (unless no other items exist, but usually blocked)
      if (ticketType === 'silver') {
         const nonLegendary = availablePool.filter(r => r.tier !== RewardTier.LEGENDARY);
         // Only apply filter if there are actually non-legendary items available
         if (nonLegendary.length > 0) {
             availablePool = nonLegendary;
         }
      }

      // 3. Separate by Tier
      const commons = availablePool.filter(r => r.tier === RewardTier.COMMON);
      const rares = availablePool.filter(r => r.tier === RewardTier.RARE);
      const legendaries = availablePool.filter(r => r.tier === RewardTier.LEGENDARY);

      // 4. Define Weights (Common 80%, Rare 15%, Legendary 5%)
      const baseWeights = {
        [RewardTier.COMMON]: 80,
        [RewardTier.RARE]: 15,
        [RewardTier.LEGENDARY]: 5
      };

      // 5. Calculate Active Weight Total based on availability
      let totalWeight = 0;
      const activeTiers: RewardTier[] = [];

      if (commons.length > 0) {
        totalWeight += baseWeights[RewardTier.COMMON];
        activeTiers.push(RewardTier.COMMON);
      }
      if (rares.length > 0) {
        totalWeight += baseWeights[RewardTier.RARE];
        activeTiers.push(RewardTier.RARE);
      }
      if (legendaries.length > 0) {
        totalWeight += baseWeights[RewardTier.LEGENDARY];
        activeTiers.push(RewardTier.LEGENDARY);
      }

      // 6. Select Tier based on Weight
      const randomVal = Math.random() * totalWeight;
      let accumulated = 0;
      let selectedTier = activeTiers[0];

      for (const tier of activeTiers) {
        accumulated += baseWeights[tier];
        if (randomVal < accumulated) {
          selectedTier = tier;
          break;
        }
      }

      // 7. Pick Random Item from Selected Tier
      let targetList: RewardItem[] = [];
      if (selectedTier === RewardTier.COMMON) targetList = commons;
      else if (selectedTier === RewardTier.RARE) targetList = rares;
      else targetList = legendaries;

      const randomReward = targetList[Math.floor(Math.random() * targetList.length)];
      
      setResult(randomReward);
      setIsSpinning(false);
      onRedeemTicket(ticketType, randomReward);
    }, 2500);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
        setResult(null);
        setActiveTicket(null);
        setIsClosing(false);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-8 h-full animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-600 game-font mb-2">보물 상자 뽑기</h2>
        <p className="text-gray-500">열심히 모은 티켓으로 보상을 획득하세요!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
        {/* Silver Ticket */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-300 p-6 rounded-2xl shadow-xl flex flex-col items-center border-4 border-slate-400 relative overflow-hidden transform hover:scale-105 transition-transform">
          <div className="absolute top-2 right-2 bg-slate-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            x{user.tickets.silver}
          </div>
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Gift className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="font-bold text-slate-700 text-xl mb-1 game-font">실버 상자</h3>
          <p className="text-xs text-slate-500 mb-4 text-center">일반(80%) ~ 희귀(15%) 보상</p>
          <button
            onClick={() => startGacha('silver')}
            disabled={user.tickets.silver === 0 || isSpinning}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-md ${user.tickets.silver > 0 ? 'bg-slate-600 text-white hover:bg-slate-700 active:scale-95' : 'bg-gray-300 text-gray-500'}`}
          >
            뽑기 (1장)
          </button>
        </div>

        {/* Gold Ticket */}
        <div className="bg-gradient-to-br from-amber-100 to-amber-300 p-6 rounded-2xl shadow-xl flex flex-col items-center border-4 border-amber-400 relative overflow-hidden transform hover:scale-105 transition-transform">
           <div className="absolute top-2 right-2 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            x{user.tickets.gold}
          </div>
          <div className="w-20 h-20 bg-amber-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
             <Sparkles className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="font-bold text-amber-800 text-xl mb-1 game-font">골드 상자</h3>
          <p className="text-xs text-amber-700 mb-4 text-center">전설(5%) 등급 획득 가능!</p>
          <button
             onClick={() => startGacha('gold')}
             disabled={user.tickets.gold === 0 || isSpinning}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-md ${user.tickets.gold > 0 ? 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95' : 'bg-gray-300 text-gray-500'}`}
          >
            뽑기 (1장)
          </button>
        </div>
      </div>

      {/* Animation Overlay */}
      {isSpinning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
          <div className="animate-spin text-9xl mb-8 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🎁</div>
          <p className="text-white text-2xl font-bold animate-pulse game-font">두근두근... 무엇이 나올까?</p>
        </div>
      )}

      {/* Result Modal */}
      {result && (
        <div className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl border-4 ${isClosing ? 'animate-fade-out' : 'animate-bounce-in'} ${
             result.tier === RewardTier.LEGENDARY ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' :
             result.tier === RewardTier.RARE ? 'border-blue-400' : 'border-gray-300'
          }`}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-6 flex justify-center">
               <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-inner ${
                 result.tier === RewardTier.LEGENDARY ? 'bg-yellow-100 text-yellow-600 animate-pulse' :
                 result.tier === RewardTier.RARE ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
               }`}>
                  {result.tier === RewardTier.LEGENDARY ? <Sparkles className="w-16 h-16" /> : <Gift className="w-14 h-14" />}
               </div>
            </div>

            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${
                 result.tier === RewardTier.LEGENDARY ? 'bg-yellow-500 text-white shadow-lg' :
                 result.tier === RewardTier.RARE ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {result.tier === RewardTier.LEGENDARY ? '🌟 전설 🌟' : result.tier === RewardTier.RARE ? '✨ 희귀 ✨' : '일반'}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2 game-font break-keep">{result.title}</h3>
            <p className="text-gray-500 text-sm mb-6">부모님께 보여주고 보상을 받으세요!</p>
            
            <button 
              onClick={closeModal}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};