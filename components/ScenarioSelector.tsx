import React, { useState } from 'react';
import { Scenario, UserLevel, Voice } from '../types';
import { BrainCircuitIcon, SettingsIcon, CheckIcon, PlusIcon, SpinnerIcon } from './icons';
import { VOICES } from '../constants';
import CustomScenarioModal from './CustomScenarioModal';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../services/audioService';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  onScenarioSelect: (scenario: Scenario) => void;
  userLevel: UserLevel;
  setUserLevel: (level: UserLevel) => void;
  selectedVoice: Voice;
  onSelectVoice: (voice: Voice) => void;
  onScenarioCreated: () => void;
}

const LevelButton: React.FC<{
  level: UserLevel;
  currentLevel: UserLevel;
  onClick: (level: UserLevel) => void;
  children: React.ReactNode;
}> = ({ level, currentLevel, onClick, children }) => (
  <button
    onClick={() => onClick(level)}
    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
      currentLevel === level
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-white text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);


const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, onScenarioSelect, userLevel, setUserLevel, selectedVoice, onSelectVoice, onScenarioCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoicePreviewing, setIsVoicePreviewing] = useState<string | null>(null);

  const handlePreviewVoice = async (voice: Voice) => {
    if (isVoicePreviewing) return;
    
    setIsVoicePreviewing(voice.id);
    try {
        const base64Audio = await generateSpeech(`Hello, I'm ${voice.name}.`, voice.id);
        if (base64Audio) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
            source.onended = () => audioContext.close();
        }
    } catch (error) {
        console.error("Error previewing voice:", error);
    } finally {
        setIsVoicePreviewing(null);
    }
  };

  const handleVoiceClick = (voice: Voice) => {
    onSelectVoice(voice);
    handlePreviewVoice(voice);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="p-4 space-y-4 bg-white rounded-xl shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-center space-x-2">
              <BrainCircuitIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-lg font-bold">First, select your level</h2>
          </div>
          <div className="flex justify-center space-x-2">
            <LevelButton level={UserLevel.Beginner} currentLevel={userLevel} onClick={setUserLevel}>Beginner</LevelButton>
            <LevelButton level={UserLevel.Intermediate} currentLevel={userLevel} onClick={setUserLevel}>Intermediate</LevelButton>
            <LevelButton level={UserLevel.Advanced} currentLevel={userLevel} onClick={setUserLevel}>Advanced</LevelButton>
          </div>
        </div>
        <div className="p-4 space-y-4 bg-white rounded-xl shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-center space-x-2">
              <SettingsIcon className="w-6 h-6 text-purple-500" />
              <h2 className="text-lg font-bold">Then, choose a voice</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {VOICES.map(voice => (
                <button
                    key={voice.id}
                    onClick={() => handleVoiceClick(voice)}
                    disabled={!!isVoicePreviewing}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 ${
                        selectedVoice.id === voice.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                   {isVoicePreviewing === voice.id 
                    ? <SpinnerIcon className="w-4 h-4 animate-spin"/> 
                    : selectedVoice.id === voice.id && <CheckIcon className="w-4 h-4" />}
                   <span>{voice.name}</span>
                </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => onScenarioSelect(scenario)}
            className="group relative flex flex-col justify-between p-6 overflow-hidden text-white transition-transform duration-300 bg-gray-700 rounded-xl shadow-lg cursor-pointer hover:scale-105 active:scale-100"
            style={{ 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${scenario.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
             }}
          >
            <div>
                <h3 className="text-2xl font-bold">{scenario.emoji} {scenario.title}</h3>
                <p className="mt-2 text-sm text-gray-200">{scenario.description}</p>
            </div>
            <div className="mt-4">
                <p className="text-xs font-semibold text-yellow-300">Goal:</p>
                <p className="text-sm text-yellow-100">{scenario.goal}</p>
            </div>
            <span className="absolute px-3 py-1 text-xs font-semibold text-blue-800 transition-opacity duration-300 bg-blue-200 rounded-full opacity-0 bottom-4 right-4 group-hover:opacity-100">
              Start
            </span>
             {scenario.isCustom && (
                <span className="absolute px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-200 rounded-full top-4 right-4">
                    Custom
                </span>
            )}
          </div>
        ))}
         <div
            onClick={() => setIsModalOpen(true)}
            className="group relative flex flex-col justify-center items-center p-6 text-center text-gray-500 transition-all duration-300 bg-gray-100 border-2 border-dashed rounded-xl shadow-sm cursor-pointer dark:bg-gray-800/50 hover:border-blue-500 hover:text-blue-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
          >
              <PlusIcon className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="mt-4 text-lg font-bold">Create Your Own Scenario</h3>
          </div>
      </div>
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

export default ScenarioSelector;