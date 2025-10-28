import React, { useState, useEffect } from 'react';
import { Quest } from '../types';
import { questService } from '../services/questService';
import { ClipboardListIcon, CheckIcon, SparklesIcon } from './icons';

interface DailyQuestsProps {
  onClaimReward: (questId: string) => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ onClaimReward }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setQuests(questService.getQuests());
  }, []);

  const handleClaim = (questId: string) => {
    onClaimReward(questId);
    setQuests(prevQuests => 
        prevQuests.map(q => q.id === questId ? { ...q, isClaimed: true } : q)
    );
  };
  
  const allClaimed = quests.every(q => q.isClaimed);

  return (
    <div className="p-6 bg-gradient-to-br from-teal-100/50 to-purple-100/50 dark:from-teal-900/30 dark:to-purple-900/30 rounded-2xl neumorph-shadow-light dark:neumorph-shadow-dark">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
            <ClipboardListIcon className="w-8 h-8 text-teal-500" />
            <h2 className="text-xl font-bold">Daily Quests</h2>
        </div>
        <div className="flex items-center space-x-2">
            {allClaimed && (
                <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full dark:bg-emerald-900/50 dark:text-emerald-300">
                    All Done!
                </span>
            )}
            <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
            {quests.length > 0 ? quests.map(quest => (
                <div key={quest.id} className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg">
                    <div className="flex-grow">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{quest.description}</p>
                        <div className="flex items-center mt-1 space-x-2">
                            <div className="w-full bg-slate-200/70 rounded-full h-2.5 dark:bg-slate-700/70 shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-teal-400 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${(quest.currentProgress / quest.goal) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-500">{Math.min(quest.currentProgress, quest.goal)}/{quest.goal}</span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <button
                            onClick={() => handleClaim(quest.id)}
                            disabled={!quest.isCompleted || quest.isClaimed}
                            className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 w-32 text-center flex items-center justify-center
                                ${quest.isClaimed ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 cursor-default' : ''}
                                ${quest.isCompleted && !quest.isClaimed ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg hover:scale-105 pulse-glow-button' : ''}
                                ${!quest.isCompleted ? 'bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300 cursor-default' : ''}
                            `}
                        >
                            {quest.isClaimed ? (
                                <><CheckIcon className="w-4 h-4 mr-1"/> Claimed</>
                            ) : quest.isCompleted ? <><SparklesIcon className="w-4 h-4 mr-1"/>{`Claim +${quest.xp} XP`}</> : `+${quest.xp} XP`}
                        </button>
                    </div>
                </div>
            )) : <p className="text-sm text-center text-slate-500">Could not load quests. Try again tomorrow!</p>}
        </div>
      )}
    </div>
  );
};

export default DailyQuests;