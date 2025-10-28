import React from 'react';
import { SunIcon, MoonIcon, VolumeUpIcon, VolumeOffIcon, BookOpenIcon, TrophyIcon, CogIcon } from './icons';

interface HeaderProps {
  userLevel: number;
  xp: number;
  theme: string;
  toggleTheme: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  onShowLearnAndReview: () => void;
  onShowSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ userLevel, xp, theme, toggleTheme, isSoundEnabled, toggleSound, onShowLearnAndReview, onShowSettings }) => {
  const xpForNextLevel = userLevel * 100;
  const currentLevelXp = xp - ((userLevel - 1) * 100);
  const progressPercentage = (currentLevelXp / 100) * 100;

  return (
    <header className="sticky top-4 z-50 flex items-center justify-between p-4 bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-2xl neumorph-shadow-light dark:neumorph-shadow-dark">
      <div
        className="flex items-center p-2 -m-2 space-x-3"
        aria-label="User level"
      >
        <TrophyIcon className="w-10 h-10 text-amber-400 drop-shadow-lg" />
        <div>
          <h1 className="text-xl font-bold text-left text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">TalkMaster</h1>
          <p className="text-sm font-semibold text-left text-slate-500 dark:text-slate-400">Level {userLevel}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 w-1/3">
        <div className="w-full bg-slate-200/70 dark:bg-slate-700/70 rounded-full h-3.5 shadow-inner">
          <div 
            className="bg-gradient-to-r from-teal-400 to-purple-500 h-3.5 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercentage}%`, boxShadow: '0 0 10px #4dd0e1, 0 0 5px #a78bfa' }}
          ></div>
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{currentLevelXp} / 100 XP</span>
      </div>
      
      <div className="flex items-center space-x-2">
         <button
          onClick={onShowLearnAndReview}
          className="p-3 text-slate-600 bg-slate-100 rounded-full dark:bg-slate-800 dark:text-slate-300 focus:outline-none transition-all duration-200 active:scale-95 neumorph-shadow-light dark:neumorph-shadow-dark hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Learn and Review"
        >
            <BookOpenIcon className="w-5 h-5" />
        </button>
         <button
          onClick={onShowSettings}
          className="p-3 text-slate-600 bg-slate-100 rounded-full dark:bg-slate-800 dark:text-slate-300 focus:outline-none transition-all duration-200 active:scale-95 neumorph-shadow-light dark:neumorph-shadow-dark hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Settings"
        >
            <CogIcon className="w-5 h-5" />
        </button>
        <button
          onClick={toggleSound}
          className="p-3 text-slate-600 bg-slate-100 rounded-full dark:bg-slate-800 dark:text-slate-300 focus:outline-none transition-all duration-200 active:scale-95 neumorph-shadow-light dark:neumorph-shadow-dark hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Toggle sound"
        >
          {isSoundEnabled ? <VolumeUpIcon className="w-5 h-5" /> : <VolumeOffIcon className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleTheme}
          className="p-3 text-slate-600 bg-slate-100 rounded-full dark:bg-slate-800 dark:text-slate-300 focus:outline-none transition-all duration-200 active:scale-95 neumorph-shadow-light dark:neumorph-shadow-dark hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;