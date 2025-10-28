import React, { useState, useEffect, useMemo } from 'react';
import { Scenario, InteractionMode } from '../types';
import { MicIcon, MessageSquareIcon, UserCheck, UserCog, TargetIcon, ArrowLeftIcon } from './icons';
import { SCENARIO_THEMES } from '../constants';
import { audioService } from '../services/audioService';

interface StartConversationModalProps {
  scenario: Scenario;
  onClose: () => void;
  onStart: (mode: InteractionMode, role: 'default' | 'reversed') => void;
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({ scenario, onClose, onStart }) => {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.LIVE);
  const [role, setRole] = useState<'default' | 'reversed'>('default');
  
  const theme = useMemo(() => SCENARIO_THEMES[scenario.id] || SCENARIO_THEMES.default, [scenario.id]);

  useEffect(() => {
    switch (theme.sound) {
      case 'airport': audioService.playAirportSound(); break;
      case 'restaurant': audioService.playRestaurantSound(); break;
      case 'hotel': audioService.playHotelSound(); break;
      case 'interview': audioService.playInterviewSound(); break;
      default: audioService.playTransition(); break;
    }
  }, [theme]);

  const handleStart = () => {
    audioService.playTransition();
    onStart(mode, role);
  };

  const handleModeSelect = (selectedMode: InteractionMode) => {
    audioService.playMessagePop();
    setMode(selectedMode);
  }
  
  const currentGoal = role === 'default' ? scenario.goal : scenario.reverseGoal;

  return (
    <div 
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl text-white rounded-3xl shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto modal-scroll"
        onClick={e => e.stopPropagation()}
      >
        {/* Background Layers - forced behind with negative z-index */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 rounded-3xl -z-10"
          style={{ backgroundImage: `url(${theme.bgImage})`, filter: 'blur(10px)', transform: 'scale(1.1)' }}
        />
        <div className="absolute inset-0 bg-black/60 rounded-3xl -z-10" />
        <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-2xl border border-white/20 rounded-3xl -z-10" />

        {/* Content - renders on top of the background layers */}
        <div className="modal-content p-6 space-y-5">
            {/* 1. Header */}
            <div className="text-center p-4 bg-black/20 rounded-xl animate-fadeIn">
              <h2 className="text-5xl font-bold">{scenario.emoji}</h2>
              <h3 className="text-3xl font-bold mt-2">{scenario.title}</h3>
              <p className="mt-2 text-slate-300">{scenario.description}</p>
            </div>

            {/* 2. Goal */}
            <div className="flex items-center p-4 space-x-4 bg-black/20 rounded-xl animate-fadeIn animate-fadeIn-delay">
              <TargetIcon className="w-10 h-10 text-amber-300 flex-shrink-0" style={{ color: theme.color, filter: `drop-shadow(0 0 8px ${theme.color}99)`}} />
              <div>
                <h4 className="font-bold text-slate-200">Your Goal</h4>
                <p className="text-lg font-semibold text-white">{currentGoal}</p>
              </div>
            </div>

            {/* 3. Interaction Mode */}
            <div className="animate-fadeIn animate-fadeIn-delay-2">
                <h4 className="mb-3 text-lg font-bold text-center">Choose Interaction Mode</h4>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleModeSelect(InteractionMode.LIVE)}
                        className={`p-5 text-white rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all duration-300 shadow-lg relative border-2
                            ${mode === InteractionMode.LIVE ? 'scale-105 border-white' : 'border-transparent opacity-80 hover:opacity-100'}
                            bg-black/20 hover:bg-black/30 group`}
                    >
                        <MicIcon className="w-8 h-8"/>
                        <span className="text-lg font-semibold">Live Call</span>
                        {mode === InteractionMode.LIVE && <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 15px ${theme.color}`}}/>}
                    </button>
                    <button
                        onClick={() => handleModeSelect(InteractionMode.TEXT)}
                        className={`p-5 text-white rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all duration-300 shadow-lg relative border-2
                            ${mode === InteractionMode.TEXT ? 'scale-105 border-white' : 'border-transparent opacity-80 hover:opacity-100'}
                            bg-black/20 hover:bg-black/30 group`}
                    >
                        <MessageSquareIcon className="w-8 h-8"/>
                        <span className="text-lg font-semibold">Text Chat</span>
                        {mode === InteractionMode.TEXT && <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 15px ${theme.color}`}}/>}
                    </button>
                </div>
            </div>

            {/* 4. Select Role */}
            <div className="animate-fadeIn animate-fadeIn-delay-3">
                 <h4 className="mb-3 text-lg font-bold text-center">Select Your Role</h4>
                 <div className="flex justify-center items-center space-x-6">
                    <div className="relative group">
                        <button onClick={() => setRole('default')} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${role === 'default' ? 'bg-white text-slate-800 scale-110' : 'bg-black/20 hover:bg-black/30'}`}>
                            <UserCheck className="w-9 h-9" />
                        </button>
                        <p className="mt-2 text-sm font-semibold">Default</p>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-center text-white bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            You will start the conversation based on the goal.
                        </div>
                    </div>
                     <div className="relative group">
                        <button onClick={() => setRole('reversed')} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${role === 'reversed' ? 'bg-white text-slate-800 scale-110' : 'bg-black/20 hover:bg-black/30'}`}>
                            <UserCog className="w-9 h-9" />
                        </button>
                        <p className="mt-2 text-sm font-semibold">Reversed</p>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-center text-white bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            The AI will play the main role, and you will respond.
                        </div>
                    </div>
                 </div>
            </div>

            {/* 5. Controls */}
            <div className="flex justify-between items-center pt-4 animate-fadeIn animate-fadeIn-delay-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 font-semibold bg-black/20 rounded-full hover:bg-black/30 transition-all duration-200 active:scale-95"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleStart}
                    className="px-8 py-3 font-bold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-teal-500 to-purple-600 hover:scale-105 shadow-lg hover:shadow-purple-500/30 pulse-glow-button"
                >
                    Start Conversation
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartConversationModal;