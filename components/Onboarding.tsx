import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, LearningGoal } from '../types';
import { BotHeadIcon } from './icons';
import { audioService } from '../services/audioService';
import { useTypingEffect } from '../hooks/useTypingEffect';

interface OnboardingProps {
    onOnboardingComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete }) => {
    const [name, setName] = useState('');
    const [animationStep, setAnimationStep] = useState(0);
    const [placeholder, setPlaceholder] = useState('Enter your name...');
    const [isInputFocused, setIsInputFocused] = useState(false);

    const welcomeText = "I'll be your AI conversation partner. What should I call you?";

    // FIX: Memoize the onComplete callback to prevent re-renders from breaking the typing effect.
    const handleTypingComplete = useCallback(() => {
        setAnimationStep(3);
    }, []);

    const { displayedText: typedWelcomeText, isTyping } = useTypingEffect(
        animationStep >= 2 ? welcomeText : '', 
        40, 
        handleTypingComplete
    );

    useEffect(() => {
        audioService.playOnboardingWelcome();
        const timers = [
            setTimeout(() => setAnimationStep(1), 500),   // Logo fades in
            setTimeout(() => setAnimationStep(2), 1500),  // Avatar and text appear
            // Step 3 is triggered by typing effect completion
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        let placeholderTimeout: ReturnType<typeof setTimeout>;
        if (animationStep >= 3) {
             placeholderTimeout = setTimeout(() => {
                setPlaceholder('Or your nickname 😉');
            }, 2000);
        }
        return () => clearTimeout(placeholderTimeout);
    }, [animationStep]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            audioService.playTransition();
            onOnboardingComplete({ name: name.trim(), goal: LearningGoal.GENERAL, avatarId: 'orion' });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        audioService.playKeypress();
        setName(e.target.value);
    }
    
    const baseTransition = 'transition-all duration-1000 ease-out';
    const getAnimationClass = (step: number) => {
        return animationStep >= step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5';
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#312e81] animate-[gradient-animation_20s_ease_infinite]" style={{backgroundSize: '200% 200%'}}></div>
            <div 
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-3xl"
                style={{ animation: 'moving-glow 30s infinite linear' }}
            />
            
            {/* Content */}
            <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-8">
                <h1 className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-purple-300 drop-shadow-lg ${baseTransition} ${getAnimationClass(1)}`}>
                    TalkMaster
                </h1>

                <div className={`flex flex-col items-center space-y-4 ${baseTransition} delay-500 ${getAnimationClass(2)}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-400/50 rounded-full blur-xl" style={{ animation: 'avatar-pulse 3s infinite ease-in-out' }} />
                        <div className="relative w-24 h-24 p-2 bg-slate-800/50 border-2 border-slate-500/50 rounded-full flex items-center justify-center">
                            <BotHeadIcon className="w-12 h-12 text-slate-200" />
                        </div>
                    </div>
                    <p className="text-xl h-14 text-slate-300 font-medium">
                        {typedWelcomeText}
                        {isTyping && <span className="inline-block w-0.5 h-5 ml-1 bg-purple-300 animate-pulse" />}
                    </p>
                </div>

                <form onSubmit={handleNameSubmit} className={`space-y-4 ${baseTransition} delay-1000 ${getAnimationClass(3)}`}>
                    <div className="relative">
                       <input
                           type="text"
                           value={name}
                           onChange={handleInputChange}
                           onFocus={() => setIsInputFocused(true)}
                           onBlur={() => setIsInputFocused(false)}
                           className="w-full max-w-sm px-5 py-4 text-xl text-center text-white bg-white/5 backdrop-blur-md rounded-full border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-400 transition-all duration-300"
                           placeholder={placeholder}
                       />
                       <div className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-300 ${isInputFocused ? 'shadow-[0_0_20px_5px_rgba(192,132,252,0.3)]' : ''}`} />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!name.trim()} 
                        onMouseEnter={() => audioService.playButtonHover()}
                        className="w-full max-w-sm px-8 py-4 text-lg font-bold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-teal-400 to-purple-500 hover:scale-105 shadow-lg hover:shadow-purple-500/30 disabled:from-slate-500 disabled:to-slate-600 disabled:hover:scale-100 disabled:shadow-none disabled:cursor-not-allowed active:scale-100"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;