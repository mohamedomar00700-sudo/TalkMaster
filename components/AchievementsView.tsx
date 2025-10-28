import React, { useState, useEffect } from 'react';
import { achievementService } from '../services/achievementService';
import { Achievement } from '../types';
import { ArrowLeftIcon } from './icons';

interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  currentProgress: number;
}

const AchievementCard: React.FC<{ achievement: AchievementWithProgress }> = ({ achievement }) => {
  const { isUnlocked, title, description, emoji, currentProgress, goal } = achievement;
  const progressPercentage = goal > 0 ? (currentProgress / goal) * 100 : 0;

  return (
    <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${isUnlocked ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 grayscale'}`}>
      <div className="flex items-start space-x-4">
        <div className={`text-4xl transition-transform duration-300 ${isUnlocked ? 'transform scale-110' : ''}`}>{emoji}</div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${isUnlocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'}`}>{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          {!isUnlocked && (
            <div className="mt-4">
              <div className="flex justify-between mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span>Progress</span>
                <span>{currentProgress} / {goal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const AchievementsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);

  useEffect(() => {
    setAchievements(achievementService.getAllAchievementsWithProgress());
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md dark:bg-gray-800">
        <button onClick={onBack} className="flex items-center px-3 py-2 -ml-3 space-x-2 text-gray-600 transition-colors rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400">
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>
        <h2 className="text-xl font-bold text-center">My Achievements</h2>
        <div className="w-24"></div> {/* Spacer to keep title centered */}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {achievements.map(ach => (
          <AchievementCard key={ach.id} achievement={ach} />
        ))}
      </div>
    </div>
  );
};

export default AchievementsView;
