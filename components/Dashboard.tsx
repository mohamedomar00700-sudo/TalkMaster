import React, { useState, useEffect } from 'react';
import { Scenario, UserLevel, Voice } from '../types';
import { achievementService } from '../services/achievementService';
import { scenarioService } from '../services/scenarioService';
import { questService } from '../services/questService';
import { FlameIcon, SparklesIcon, TrophyIcon, ClipboardListIcon, CheckIcon } from './icons';
import LearningJourney from './LearningJourney';
import DailyQuests from './DailyQuests';
import { BOT_AVATARS } from '../constants';

interface DashboardProps {
  userName: string;
  scenarios: Scenario[];
  onScenarioSelect: (scenario: Scenario) => void;
  onScenarioCreated: () => void;
  onClaimQuestReward: (questId: string) => void;
  selectedAvatarId: string;
  onSelectAvatar: (id: string) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; iconBg: string }> = ({ icon, value, label, iconBg }) => (
    <div className="flex items-center p-4 space-x-4 bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-2xl neumorph-shadow-light dark:neumorph-shadow-dark transition-all duration-300 hover:scale-105 hover:-translate-y-1">
        <div className={`p-3 rounded-xl shadow-lg ${iconBg}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    </div>
);

const getWelcomeMessage = (userName: string): { title: string, subtitle: string } => {
    const stats = achievementService.getStats();
    if (stats.conversationsCompleted === 0) {
        return {
            title: `Welcome, ${userName}!`,
            subtitle: "Your journey to fluency starts now. Let's begin!"
        };
    }
    if (stats.streak > 1) {
        return {
            title: `You're on a ${stats.streak}-day streak!`,
            subtitle: `Incredible work, ${userName}. Keep that momentum blazing.`
        };
    }
    const lastScenarioId = stats.uniqueScenarios[stats.uniqueScenarios.length - 1];
    if (lastScenarioId) {
        const lastScenario = scenarioService.getAllScenarios().find(s => s.id === lastScenarioId);
         if (lastScenario) {
            return {
                title: `Welcome back, ${userName}!`,
                subtitle: `Great job with the "${lastScenario.title}" scenario. Ready for the next challenge?`
            }
        }
    }
    return {
        title: `Welcome back, ${userName}!`,
        subtitle: "Another day, another step towards mastering English."
    };
};


const Dashboard: React.FC<DashboardProps> = ({
    onScenarioSelect,
    scenarios,
    userName,
    selectedAvatarId,
    onSelectAvatar,
    onClaimQuestReward,
    onScenarioCreated
}) => {
    const [stats, setStats] = useState(achievementService.getStats());
    const [quests, setQuests] = useState(questService.getQuests());
    const [nextScenario, setNextScenario] = useState<Scenario | null>(null);

    useEffect(() => {
        setStats(achievementService.getStats());
        setNextScenario(scenarioService.getNextScenarioInJourney());
        setQuests(questService.getQuests());
    }, [scenarios]);

    const { title, subtitle } = getWelcomeMessage(userName);

    return (
        <div className="space-y-8">
            <div className="animate-fadeIn">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{title}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">{subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="animate-fadeIn animate-fadeIn-delay">
                    <StatCard 
                        icon={<FlameIcon className="w-6 h-6 text-white"/>}
                        value={`${stats.streak} Days`}
                        label="Current Streak"
                        iconBg="bg-gradient-to-br from-rose-400 to-rose-600"
                    />
                </div>
                 <div className="animate-fadeIn animate-fadeIn-delay-2">
                    <StatCard 
                        icon={<SparklesIcon className="w-6 h-6 text-white"/>}
                        value={stats.conversationsCompleted}
                        label="Sessions Done"
                        iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600"
                    />
                </div>
                 <div className="animate-fadeIn animate-fadeIn-delay-3">
                     <StatCard 
                        icon={<TrophyIcon className="w-6 h-6 text-white"/>}
                        value={achievementService.getUnlockedAchievementIds().size}
                        label="Achievements"
                        iconBg="bg-gradient-to-br from-amber-400 to-amber-600"
                    />
                </div>
                <div className="animate-fadeIn animate-fadeIn-delay-3">
                     <StatCard 
                        icon={<ClipboardListIcon className="w-6 h-6 text-white"/>}
                        value={`${quests.filter(q => q.isClaimed).length}/${quests.length}`}
                        label="Quests Done"
                        iconBg="bg-gradient-to-br from-teal-400 to-teal-600"
                    />
                </div>
            </div>

            <div className="p-6 bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-2xl neumorph-shadow-light dark:neumorph-shadow-dark animate-fadeIn animate-fadeIn-delay-2">
                <h2 className="text-xl font-bold">AI Avatar</h2>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Choose your conversation partner.</p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {BOT_AVATARS.map((avatar) => {
                        const Icon = avatar.icon;
                        const isSelected = selectedAvatarId === avatar.id;
                        return (
                            <div
                                key={avatar.id}
                                onClick={() => onSelectAvatar(avatar.id)}
                                className={`relative p-4 text-center rounded-2xl cursor-pointer transition-all duration-300
                                    ${ isSelected ? 'bg-white/50 dark:bg-slate-800/50 scale-105' : 'bg-slate-200/50 dark:bg-slate-800/30 hover:bg-slate-200/80 dark:hover:bg-slate-800/60'}`
                                }
                            >
                                <div className={`relative flex items-center justify-center w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full transition-all duration-300 ring-4 ${isSelected ? 'ring-purple-500' : 'ring-transparent'}`}>
                                    <Icon className="w-11 h-11 text-slate-800 dark:text-slate-200" />
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center w-7 h-7 text-white bg-gradient-to-br from-teal-400 to-purple-500 rounded-full shadow-lg">
                                            <CheckIcon className="w-4 h-4"/>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">{avatar.name}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="animate-fadeIn animate-fadeIn-delay-3">
                <DailyQuests onClaimReward={onClaimQuestReward} />
            </div>

            <div className="animate-fadeIn animate-fadeIn-delay-3">
                <LearningJourney 
                    scenarios={scenarios}
                    onScenarioSelect={onScenarioSelect}
                    onScenarioCreated={onScenarioCreated}
                    nextScenarioId={nextScenario?.id}
                />
            </div>
        </div>
    );
};

export default Dashboard;
