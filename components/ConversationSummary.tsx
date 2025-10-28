import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ConversationResult, Speaker, VocabularyItem, QuestType } from '../types';
import { CheckBadgeIcon, SparklesIcon, XCircleIcon, MicIcon, UserIcon, LightbulbIcon, BookmarkIcon, CheckIcon } from './icons';
import { audioService } from '../services/audioService';
import { extractKeyVocabulary, getConversationTip } from '../services/geminiService';
import { vocabularyService } from '../services/vocabularyService';
import { questService } from '../services/questService';


interface ConversationSummaryProps {
  result: ConversationResult;
  onClose: () => void;
}

const FILLER_WORDS = new Set(['um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean', 'so', 'actually', 'basically', 'literally']);

const getPaceInfo = (wpm: number): { label: string, color: string } => {
    if (wpm === 0) return { label: 'Not enough data', color: 'text-slate-500 dark:text-slate-400' };
    if (wpm < 100) return { label: 'A bit slow', color: 'text-amber-600 dark:text-amber-400' };
    if (wpm > 160) return { label: 'A bit fast', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Great pace!', color: 'text-emerald-600 dark:text-emerald-400' };
};

const getFillerInfo = (count: number): { label: string, color: string } => {
    if (count === 0) return { label: 'Excellent!', color: 'text-emerald-600 dark:text-emerald-400' };
    if (count <= 3) return { label: 'Good job', color: 'text-emerald-600 dark:text-emerald-400' };
    return { label: 'Try to reduce', color: 'text-amber-600 dark:text-amber-400' };
};

const ConversationSummary: React.FC<ConversationSummaryProps> = ({ result, onClose }) => {
    
    const [keyVocabulary, setKeyVocabulary] = useState<VocabularyItem[] | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [isLoadingVocab, setIsLoadingVocab] = useState(true);
    const [aiTip, setAiTip] = useState<string | null>(null);
    const [isLoadingTip, setIsLoadingTip] = useState(true);

    useEffect(() => {
        audioService.playSummaryOpen();
        
        const fetchExtraData = async () => {
            if (result.messages.length > 0) {
                setIsLoadingVocab(true);
                setIsLoadingTip(true);
                
                const vocabPromise = extractKeyVocabulary(result.messages);
                const tipPromise = getConversationTip(result.messages);
                const [vocab, tip] = await Promise.all([vocabPromise, tipPromise]);
                
                if (vocab) {
                    setKeyVocabulary(vocab);
                    const initiallySaved = new Set<string>();
                    vocab.forEach(item => {
                        if (vocabularyService.isWordSaved(item.word)) {
                            initiallySaved.add(item.word.toLowerCase());
                        }
                    });
                    setSavedWords(initiallySaved);
                }
                setAiTip(tip);
            }
            setIsLoadingVocab(false);
            setIsLoadingTip(false);
        };
        fetchExtraData();
    }, [result.messages]);

    const handleSaveWord = useCallback((item: VocabularyItem) => {
        if (savedWords.has(item.word.toLowerCase())) return;

        vocabularyService.saveVocabularyItem(item);
        questService.updateQuestProgress(QuestType.SAVE_VOCAB_WORDS, 1);
        audioService.playSuccess();
        setSavedWords(prev => new Set(prev).add(item.word.toLowerCase()));
    }, [savedWords]);

    const { earnedXp, messages, scenario, duration } = result;

    const analytics = useMemo(() => {
        const userMessages = messages.filter(m => m.speaker === Speaker.User);
        const botMessages = messages.filter(m => m.speaker === Speaker.Bot);
        const totalUserMessages = userMessages.length;
        if (totalUserMessages === 0) {
            return {
                correctedMessages: [],
                pace: 0,
                fillerWordCount: 0,
                talkBalance: { user: 0, bot: 100 }
            }
        }
        
        const correctedMessages = userMessages.filter(m => m.feedback && m.feedback !== 'Great job!');
        const allUserText = userMessages.map(m => m.text.toLowerCase()).join(' ');
        const words = allUserText.split(/\s+/);
        const pace = duration > 0 ? Math.round((words.length / duration) * 60) : 0;

        const fillerWordCount = words.filter(word => FILLER_WORDS.has(word.replace(/[^a-zA-Z]/g, ''))).length;

        const totalMessages = messages.length > 0 ? messages.length : 1;
        const talkBalance = {
            user: Math.round((totalUserMessages / totalMessages) * 100),
            bot: Math.round((botMessages.length / totalMessages) * 100),
        }

        return { correctedMessages, pace, fillerWordCount, talkBalance };
    }, [messages, duration]);

    const { correctedMessages, pace, fillerWordCount, talkBalance } = analytics;
    const paceInfo = getPaceInfo(pace);
    const fillerInfo = getFillerInfo(fillerWordCount);

    return (
        <div className="p-6 space-y-6 bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-2xl neumorph-shadow-light dark:neumorph-shadow-dark animate-fadeIn">
            <div className="text-center">
                <CheckBadgeIcon className="w-16 h-16 mx-auto text-emerald-500 drop-shadow-lg" />
                <h1 className="mt-4 text-3xl font-bold">Session Complete!</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">You practiced: <span className="font-semibold text-teal-600 dark:text-teal-400">{scenario.title}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                 <div className="p-4 text-center bg-slate-100/70 dark:bg-slate-800/50 rounded-xl neumorph-shadow-light dark:neumorph-shadow-dark">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">XP Earned</p>
                    <p className="flex items-center justify-center mt-1 space-x-1 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-500">
                        <SparklesIcon className="w-6 h-6 text-amber-400 animate-glowing-star" />
                        <span>+{earnedXp}</span>
                    </p>
                </div>
                 <div className="p-4 text-center bg-slate-100/70 dark:bg-slate-800/50 rounded-xl neumorph-shadow-light dark:neumorph-shadow-dark">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Talk Balance</p>
                    <div className="flex items-end justify-center mt-1 space-x-2">
                        <UserIcon className="w-5 h-5 mb-1 text-teal-500"/>
                        <p className="text-3xl font-bold">{talkBalance.user}%</p>
                    </div>
                </div>
                <div className="p-4 text-center bg-slate-100/70 dark:bg-slate-800/50 rounded-xl neumorph-shadow-light dark:neumorph-shadow-dark">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Pace (WPM)</p>
                    <p className="text-3xl font-bold">{pace}</p>
                    <p className={`text-xs font-semibold ${paceInfo.color}`}>{paceInfo.label}</p>
                </div>
                 <div className="p-4 text-center bg-slate-100/70 dark:bg-slate-800/50 rounded-xl neumorph-shadow-light dark:neumorph-shadow-dark">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Filler Words</p>
                    <p className="text-3xl font-bold">{fillerWordCount}</p>
                    <p className={`text-xs font-semibold ${fillerInfo.color}`}>{fillerInfo.label}</p>
                </div>
            </div>

            {(isLoadingTip || aiTip) && (
                <div className="p-4 space-y-2 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-xl border-l-4 border-amber-400 neumorph-shadow-light-inset dark:neumorph-shadow-dark-inset">
                     <div className="flex items-center space-x-2">
                        <LightbulbIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        <h2 className="font-bold text-lg text-amber-800 dark:text-amber-200">Tip of the Day</h2>
                     </div>
                     {isLoadingTip ? (
                         <p className="text-sm text-center text-amber-700 dark:text-amber-300">Generating your personal tip...</p>
                     ) : (
                         <p className="font-medium text-amber-800 dark:text-amber-200">{aiTip}</p>
                     )}
                </div>
            )}
            
            {(isLoadingVocab || (keyVocabulary && keyVocabulary.length > 0)) && (
                <div className="space-y-3">
                    <h2 className="font-bold text-lg">Key Vocabulary</h2>
                    <div className="p-4 space-y-3 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl neumorph-shadow-light-inset dark:neumorph-shadow-dark-inset">
                        {isLoadingVocab ? (
                            <p className="text-sm text-center text-slate-500">Extracting key words...</p>
                        ) : (
                            keyVocabulary?.map((item, index) => (
                                <div key={index} className="pb-3 border-b last:border-b-0 border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-grow pr-4">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{item.word}</p>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.definition}</p>
                                            <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-500">"{item.example}"</p>
                                        </div>
                                        <button 
                                            onClick={() => handleSaveWord(item)} 
                                            disabled={savedWords.has(item.word.toLowerCase())}
                                            className={`flex-shrink-0 flex items-center px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 disabled:cursor-default
                                                ${savedWords.has(item.word.toLowerCase())
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:hover:bg-teal-900'
                                                }`
                                            }
                                        >
                                        {savedWords.has(item.word.toLowerCase())
                                            ? <><CheckIcon className="w-3 h-3 mr-1"/> Saved</>
                                            : <><BookmarkIcon className="w-3 h-3 mr-1"/> Save</>
                                        }
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        {!isLoadingVocab && (!keyVocabulary || keyVocabulary.length === 0) && (
                            <p className="text-sm text-center text-slate-500">No key vocabulary was identified in this conversation.</p>
                        )}
                    </div>
                </div>
            )}

            {correctedMessages.length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-bold text-lg">Areas for Improvement</h2>
                    <div className="p-4 space-y-4 overflow-y-auto bg-slate-100/70 dark:bg-slate-800/50 rounded-xl max-h-48 neumorph-shadow-light-inset dark:neumorph-shadow-dark-inset">
                        {correctedMessages.map(msg => (
                            <div key={msg.id} className="pb-3 border-b last:border-b-0 border-slate-200 dark:border-slate-700">
                                <div className="flex items-start space-x-3">
                                    <XCircleIcon className="flex-shrink-0 w-5 h-5 mt-1 text-rose-500" />
                                    <div>
                                        <p className="text-sm text-slate-500">You said: <span className="italic text-slate-700 dark:text-slate-300">"{msg.text}"</span></p>
                                        <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{msg.feedback}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 text-center">
                <button
                    onClick={onClose}
                    className="w-full px-8 py-3 font-bold text-white transition-all duration-300 transform rounded-full md:w-auto bg-gradient-to-r from-teal-500 to-purple-600 hover:scale-105 shadow-lg hover:shadow-purple-500/30"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default ConversationSummary;