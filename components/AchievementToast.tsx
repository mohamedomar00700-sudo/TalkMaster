import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 4500);

        const closeTimer = setTimeout(() => {
            onClose();
        }, 5000); // 4500ms visible + 500ms exit animation

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(closeTimer);
        };
    }, [achievement, onClose]);

    return (
        <div className={`fixed bottom-5 right-5 z-50 w-full max-w-sm ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
            <div className="flex items-center p-4 text-slate-800 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-l-4 border-amber-400 rounded-lg shadow-lg dark:text-slate-200">
                <div className="flex-shrink-0 w-10 h-10 mr-3 text-3xl flex items-center justify-center">
                    {achievement.emoji}
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-amber-500">Achievement Unlocked!</p>
                    <p className="text-sm font-medium">{achievement.title}</p>
                </div>
            </div>
        </div>
    );
};

export default AchievementToast;