import React, { useState, useEffect, useCallback } from 'react';
import { createCustomScenario } from '../services/geminiService';
import { scenarioService } from '../services/scenarioService';
import { SparklesIcon, BotHeadIcon, CheckCircleIcon, SpinnerIcon } from './icons';
import { Scenario } from '../types';
import { audioService } from '../services/audioService';

interface CustomScenarioModalProps {
  onClose: () => void;
  onScenarioCreated: () => void;
}

const RANDOM_IDEAS = [
  "I want to practice returning a faulty item to a store.",
  "Create a scenario where I have to make small talk at a party.",
  "I need to discuss a project deadline with my manager.",
  "Generate a scenario for asking for directions in a new city.",
  "Practice a first date conversation at a coffee shop."
];
const MAX_CHARS = 300;


const CustomScenarioModal: React.FC<CustomScenarioModalProps> = ({ onClose, onScenarioCreated }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewScenario, setPreviewScenario] = useState<Omit<Scenario, 'id' | 'backgroundImage' | 'isCustom' | 'reverseGoal' | 'reverseSystemPrompt'> | null>(null);
  const [loadingText, setLoadingText] = useState('Thinking of your adventure…');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setPreviewScenario(null);

    const emojis = ['✈️', '☕', '🏨', '💼', '🤝'];
    let emojiIndex = 0;
    const interval = setInterval(() => {
        setLoadingText(`Thinking of your adventure… ${emojis[emojiIndex]}`);
        emojiIndex = (emojiIndex + 1) % emojis.length;
    }, 800);

    try {
      const generatedContent = await createCustomScenario(description);
      audioService.playAchievementUnlock(); // Re-used for a "sparkle" sound effect
      setPreviewScenario(generatedContent);
    } catch (err) {
      console.error(err);
      setError('Failed to generate scenario. The AI might be busy. Please try again in a moment.');
      audioService.playError();
    } finally {
      setIsGenerating(false);
      clearInterval(interval);
    }
  };

  const handleSaveScenario = () => {
    if (!previewScenario) return;
    
    const newScenario: Scenario = {
        ...previewScenario,
        id: `custom-${Date.now()}`,
        backgroundImage: `https://picsum.photos/seed/${Date.now()}/1200/800`,
        isCustom: true,
        reverseGoal: `Practice the opposite role in the "${previewScenario.title}" scenario.`,
        reverseSystemPrompt: `You are playing the opposite role in the "${previewScenario.title}" scenario. The user is practicing their English. Respond to them naturally to continue the conversation.`,
    };

    scenarioService.saveCustomScenario(newScenario);
    onScenarioCreated();
  };

  const handleTryAgain = () => {
    setPreviewScenario(null);
    setDescription('');
    setError(null);
  }

  const handleRandomIdea = () => {
    const randomIdea = RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)];
    setDescription(randomIdea);
  };

  const renderContent = () => {
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[350px] text-center animate-fadeIn">
                <SpinnerIcon className="w-16 h-16 text-white animate-spin" />
                <p className="mt-4 text-xl font-semibold">{loadingText}</p>
            </div>
        );
    }

    if (previewScenario) {
        return (
            <div className="flex flex-col items-center text-center animate-fadeIn">
                <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                <h2 className="mt-2 text-2xl font-bold">Here's Your Scenario!</h2>
                <div className="w-full p-4 mt-4 text-left bg-white/5 rounded-xl border border-white/20">
                    <p className="text-2xl font-bold">{previewScenario.emoji} {previewScenario.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{previewScenario.description}</p>
                    <p className="mt-4 text-xs font-semibold text-amber-300">Your Goal:</p>
                    <p className="text-sm">{previewScenario.goal}</p>
                </div>
                <div className="flex justify-between w-full mt-6">
                    <button type="button" onClick={handleTryAgain} className="px-6 py-2 font-bold bg-transparent rounded-full hover:bg-white/10 transition-colors">
                        Try Again
                    </button>
                    <button type="button" onClick={handleSaveScenario} className="px-6 py-2 font-bold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30">
                        Save & Continue
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <div className="flex flex-col items-center text-center">
                <span className="text-3xl" role="img" aria-label="sparkles">✨</span>
                <h2 className="mt-2 text-2xl font-bold">Let’s create your next conversation adventure!</h2>
                <div className="relative w-24 h-24 mt-4">
                    <div className="absolute inset-0 rounded-full bg-purple-400/50 blur-xl" style={{ animation: 'avatar-pulse 3s infinite ease-in-out' }} />
                    <div className="relative flex items-center justify-center w-full h-full p-2 border-2 rounded-full bg-slate-800/50 border-slate-500/50">
                        <BotHeadIcon className="w-12 h-12 text-slate-200" />
                    </div>
                </div>
            </div>

            <form onSubmit={handleGenerate} className="mt-6 space-y-4">
                <div className="relative">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your dream English scenario…"
                        maxLength={MAX_CHARS}
                        className="w-full h-32 p-4 text-white bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-400 transition-all duration-300 shadow-lg resize-none"
                        required
                    />
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                         <button type="button" onClick={handleRandomIdea} className="px-3 py-1 text-xs font-semibold text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm">
                            🎲 Random Idea
                        </button>
                        <span className="text-xs text-slate-400">
                            {description.length} / {MAX_CHARS}
                        </span>
                    </div>
                </div>

                {error && <p className="text-sm text-center text-rose-400">{error}</p>}

                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={onClose} className="px-8 py-3 font-bold bg-transparent rounded-full hover:bg-white/10 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!description.trim()}
                        className="px-8 py-3 font-bold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:from-slate-500 disabled:to-slate-600 disabled:hover:scale-100 disabled:shadow-none disabled:cursor-not-allowed active:scale-100"
                    >
                        Generate Scenario
                    </button>
                </div>
            </form>
        </>
    );
  }

  return (
    <div 
        className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
    >
      <div 
        className="modal-content relative w-full max-w-lg p-6 mx-4 bg-gradient-to-br from-slate-900 via-purple-900/80 to-blue-900 border border-white/20 rounded-3xl shadow-2xl text-white"
        onClick={e => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default CustomScenarioModal;