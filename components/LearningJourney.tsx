import React, { useState } from 'react';
import { Scenario } from '../types';
import { LockIcon, PlusIcon, StarIcon } from './icons';
import CustomScenarioModal from './CustomScenarioModal';
import { achievementService } from '../services/achievementService';
import { SCENARIOS } from '../constants'; // Import default scenarios for the journey map

interface LearningJourneyProps {
  scenarios: Scenario[]; // All scenarios including custom
  onScenarioSelect: (scenario: Scenario) => void;
  onScenarioCreated: () => void;
  nextScenarioId: string | null | undefined;
}

const LearningJourney: React.FC<LearningJourneyProps> = ({ scenarios, onScenarioSelect, onScenarioCreated, nextScenarioId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const completedScenarioIds = new Set(achievementService.getStats().uniqueScenarios);

  const journeyScenarios = SCENARIOS; // The journey is based on default scenarios
  const customScenarios = scenarios.filter(s => s.isCustom);
  
  const getStatus = (scenarioId: string) => {
    if (completedScenarioIds.has(scenarioId)) return 'completed';
    if (scenarioId === nextScenarioId) return 'next';

    // Special case for the very first scenario if nothing is completed yet
    if (completedScenarioIds.size === 0 && journeyScenarios[0]?.id === scenarioId) {
      return 'next';
    }
    
    // Determine if it's locked based on the order in the default SCENARIOS array
    const scenarioIndex = journeyScenarios.findIndex(s => s.id === scenarioId);
    const nextScenarioIndex = journeyScenarios.findIndex(s => s.id === nextScenarioId);

    if (nextScenarioId === null && completedScenarioIds.size === journeyScenarios.length) return 'completed'; // All done
    if (nextScenarioId === null && completedScenarioIds.size === 0) return 'locked'; // Not started yet, all but first are locked
    
    if (scenarioIndex > nextScenarioIndex) return 'locked';
    
    return 'locked';
  }

  const handleScenarioClick = (e: React.MouseEvent, scenario: Scenario, isLocked: boolean) => {
    e.stopPropagation();
    if (!isLocked) {
      onScenarioSelect(scenario);
    }
  };

  return (
    <div className="p-6 bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-2xl neumorph-shadow-light dark:neumorph-shadow-dark">
      <h2 className="text-2xl font-bold">Your Learning Journey</h2>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Follow the path to master new conversations.</p>

      <div className="relative mt-8 journey-line">
        <div className="relative flex justify-between">
          {journeyScenarios.map((scenario) => {
             const status = getStatus(scenario.id);
             const isLocked = status === 'locked';
             const isNext = status === 'next';
             const isCompleted = status === 'completed';

             return (
                 <div
                    key={scenario.id}
                    onClick={(e) => handleScenarioClick(e, scenario, isLocked)}
                    className={`relative flex flex-col items-center group ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                 >
                    {/* Node */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 z-10
                        ${isCompleted ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : ''}
                        ${isNext ? 'bg-gradient-to-r from-teal-400 to-purple-500 pulse-glow' : ''}
                        ${isLocked ? 'bg-slate-300 dark:bg-slate-600' : 'bg-white dark:bg-slate-800'}
                        border-4 
                        ${isCompleted ? 'border-amber-200 dark:border-amber-700' : isNext ? 'border-purple-300 dark:border-purple-700' : 'border-slate-200 dark:border-slate-700'}
                        ${!isLocked ? 'group-hover:scale-110' : ''}
                    `}>
                        {isCompleted && <StarIcon className="w-8 h-8 text-white"/>}
                        {isNext && <span className="text-3xl">{scenario.emoji}</span>}
                        {isLocked && <LockIcon className="w-8 h-8 text-slate-500 dark:text-slate-400"/>}
                    </div>
                    {/* Label */}
                    <p className={`mt-3 text-sm font-semibold text-center w-24
                        ${isNext ? 'text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-purple-500' : 'text-slate-600 dark:text-slate-400'}
                    `}>{scenario.title}</p>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 w-48 p-2 text-xs text-white bg-slate-900/80 backdrop-blur-sm rounded-md text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {scenario.description}
                        {isLocked && <span className="block mt-1 font-bold text-amber-300">Complete previous step to unlock!</span>}
                    </div>
                 </div>
             )
          })}
        </div>
      </div>

      {(customScenarios.length > 0 || onScenarioCreated) && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold">Your Custom Scenarios</h3>
            <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                 {customScenarios.map((scenario) => (
                    <div
                        key={scenario.id}
                        onClick={(e) => handleScenarioClick(e, scenario, false)}
                        className="group flex items-center p-4 space-x-3 bg-slate-100/70 rounded-lg cursor-pointer dark:bg-slate-800/50 transition-all duration-200 hover:shadow-lg hover:scale-105 hover:bg-teal-100/50 dark:hover:bg-teal-900/50 border border-transparent hover:border-teal-300 dark:hover:border-teal-600"
                    >
                        <span className="text-2xl">{scenario.emoji}</span>
                        <div>
                            <p className="font-semibold">{scenario.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{scenario.description}</p>
                        </div>
                    </div>
                 ))}
                 <div
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                    className="group relative flex flex-col justify-center items-center p-4 text-center text-slate-500 transition-all duration-300 bg-gradient-to-br from-slate-200 to-slate-100 border-2 border-dashed rounded-lg shadow-sm cursor-pointer dark:from-slate-800/80 dark:to-slate-800/50 hover:border-purple-500 hover:text-purple-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-purple-400 dark:hover:text-purple-400 pulse-glow-button"
                >
                    <PlusIcon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="mt-2 text-sm font-bold">Create New</h3>
                </div>
            </div>
        </div>
      )}
      {isModalOpen && (
        <CustomScenarioModal 
            onClose={() => setIsModalOpen(false)}
            onScenarioCreated={() => {
                onScenarioCreated();
                setIsModalOpen(false);
            }}
        />
      )}
    </div>
  );
};

export default LearningJourney;