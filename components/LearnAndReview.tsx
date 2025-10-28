import React, { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/reviewService';
import { ReviewItem, Achievement, VocabularyItem } from '../types';
import { ArrowLeftIcon, BookOpenIcon, TrophyIcon, BookmarkIcon, HelpCircleIcon, RotateCcwIcon, LanguagesIcon, SpinnerIcon } from './icons';
import { achievementService } from '../services/achievementService';
import { audioService } from '../services/audioService';
import { vocabularyService } from '../services/vocabularyService';
import QuizView from './QuizView';
import { translateVocabItem } from '../services/geminiService';


interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  currentProgress: number;
}

const AchievementCard: React.FC<{ achievement: AchievementWithProgress }> = ({ achievement }) => {
  const { isUnlocked, title, description, emoji, currentProgress, goal } = achievement;
  const progressPercentage = goal > 0 ? (currentProgress / goal) * 100 : 0;

  return (
    <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${isUnlocked ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 grayscale'}`}>
      <div className="flex items-start space-x-4">
        <div className={`text-4xl transition-transform duration-300 ${isUnlocked ? 'transform scale-110' : ''}`}>{emoji}</div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${isUnlocked ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          {!isUnlocked && (
            <div className="mt-4">
              <div className="flex justify-between mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>Progress</span>
                <span>{currentProgress} / {goal}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-600">
                <div className="bg-gradient-to-r from-teal-400 to-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const CorrectionFlashcard: React.FC<{ item: ReviewItem }> = ({ item }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        audioService.playCardFlip();
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="flashcard-container h-48" onClick={handleFlip}>
            <div className={`flashcard relative w-full h-full cursor-pointer ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="flashcard-face absolute w-full h-full p-4 flex flex-col justify-center items-center text-center bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">You said:</p>
                    <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">"{item.original}"</p>
                </div>
                <div className="flashcard-face flashcard-back absolute w-full h-full p-4 flex flex-col justify-center items-center text-center bg-emerald-100 dark:bg-emerald-900/50 rounded-lg shadow-md border border-emerald-200 dark:border-emerald-700">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Correction:</p>
                    <p className="mt-2 font-semibold text-emerald-800 dark:text-emerald-200">{item.correction}</p>
                </div>
            </div>
        </div>
    );
};

const VocabularyFlashcard: React.FC<{ item: VocabularyItem }> = ({ item }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [translation, setTranslation] = useState<{ translatedDefinition: string; translatedExample: string } | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFlip = () => {
        if (isTranslating) return;
        audioService.playCardFlip();
        setIsFlipped(!isFlipped);
    };

    const handleTranslate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isTranslating || translation) return;

        setIsTranslating(true);
        setError(null);
        try {
            const result = await translateVocabItem(item.definition, item.example);
            if (result) {
                setTranslation(result);
            } else {
                setError('Translation failed.');
            }
        } catch (err) {
            setError('Translation failed.');
            console.error(err);
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="flashcard-container h-72" onClick={handleFlip}>
            <div className={`flashcard relative w-full h-full cursor-pointer ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="flashcard-face absolute w-full h-full p-4 flex flex-col justify-center items-center text-center bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <RotateCcwIcon className="absolute w-4 h-4 top-3 right-3 text-slate-400" />
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 capitalize">{item.word}</p>
                </div>
                <div className="flashcard-face flashcard-back absolute w-full h-full p-4 flex flex-col justify-between text-center bg-teal-100 dark:bg-teal-900/50 rounded-lg shadow-md border border-teal-200 dark:border-teal-700">
                    <div className="flex-grow space-y-2 overflow-y-auto text-left">
                        <div>
                            <p className="text-sm text-teal-700 dark:text-teal-300">Definition:</p>
                            <p className="font-semibold text-teal-800 dark:text-teal-200">{item.definition}</p>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm text-teal-700 dark:text-teal-300">Example:</p>
                            <p className="italic font-semibold text-teal-800 dark:text-teal-200">"{item.example}"</p>
                        </div>
                        {translation && (
                            <div className="pt-2 mt-2 border-t border-teal-200 dark:border-teal-700" style={{direction: 'rtl'}}>
                                <div>
                                    <p className="text-sm text-teal-700 dark:text-teal-300">التعريف:</p>
                                    <p className="font-semibold text-teal-800 dark:text-teal-200">{translation.translatedDefinition}</p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-sm text-teal-700 dark:text-teal-300">مثال:</p>
                                    <p className="italic font-semibold text-teal-800 dark:text-teal-200">"{translation.translatedExample}"</p>
                                </div>
                            </div>
                        )}
                        {error && <p className="mt-2 text-xs text-center text-rose-500">{error}</p>}
                    </div>
                    <div className="flex-shrink-0 pt-2 mt-auto">
                        <button 
                            onClick={handleTranslate} 
                            disabled={isTranslating || !!translation}
                            className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full transition-colors bg-white/50 dark:bg-black/20 text-teal-800 dark:text-teal-200 hover:bg-white/80 dark:hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTranslating ? (
                                <SpinnerIcon className="w-4 h-4 animate-spin" /> 
                            ) : (
                                <>
                                    <LanguagesIcon className="w-4 h-4 mr-2" />
                                    <span>{translation ? 'Translated' : 'Translate to Arabic'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const LearnAndReview: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'corrections' | 'vocabulary' | 'achievements'>('corrections');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [isQuizMode, setIsQuizMode] = useState(false);

  useEffect(() => {
    setReviewItems(reviewService.getReviewItems());
    setAchievements(achievementService.getAllAchievementsWithProgress());
    setVocabularyItems(vocabularyService.getVocabularyItems());
  }, []);

  const handleClearCorrections = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all review items? This cannot be undone.')) {
        reviewService.clearReviewItems();
        setReviewItems([]);
    }
  }, []);

  const handleClearVocabulary = useCallback(() => {
    if (window.confirm('Are you sure you want to clear your saved vocabulary? This cannot be undone.')) {
        vocabularyService.clearVocabularyItems();
        setVocabularyItems([]);
    }
  }, []);

  const renderContent = () => {
    if (isQuizMode) {
        const items = activeTab === 'corrections' ? reviewItems : vocabularyItems;
        return <QuizView items={items} type={activeTab} onBack={() => setIsQuizMode(false)} />;
    }

    switch (activeTab) {
        case 'corrections':
            return (
                <div className="space-y-4">
                    {reviewItems.length > 0 ? (
                        <>
                            <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => setIsQuizMode(true)} className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-purple-600 rounded-full hover:opacity-90 transition-transform duration-150 active:scale-95 disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-100 disabled:cursor-not-allowed" disabled={reviewItems.length < 3}>
                                    <HelpCircleIcon className="w-4 h-4 mr-2"/>
                                    <span>Start Quiz</span>
                                </button>
                                <button onClick={handleClearCorrections} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-full hover:bg-rose-700 transition-transform duration-150 active:scale-95">Clear All</button>
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {reviewItems.map(item => <CorrectionFlashcard key={item.id} item={item} />)}
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl">
                            <BookOpenIcon className="w-12 h-12 mx-auto mb-4"/>
                            <h3 className="text-lg font-semibold">No Corrections Yet!</h3>
                            <p className="mt-1">Mistakes you make in conversations will appear here as flashcards.</p>
                        </div>
                    )}
                </div>
            );
        case 'vocabulary':
            return (
                <div className="space-y-4">
                    {vocabularyItems.length > 0 ? (
                        <>
                            <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => setIsQuizMode(true)} className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-purple-600 rounded-full hover:opacity-90 transition-transform duration-150 active:scale-95 disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-100 disabled:cursor-not-allowed" disabled={vocabularyItems.length < 3}>
                                    <HelpCircleIcon className="w-4 h-4 mr-2"/>
                                    <span>Start Quiz</span>
                                </button>
                                <button onClick={handleClearVocabulary} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-full hover:bg-rose-700 transition-transform duration-150 active:scale-95">Clear All</button>
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {vocabularyItems.map(item => <VocabularyFlashcard key={item.word} item={item} />)}
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl">
                            <BookmarkIcon className="w-12 h-12 mx-auto mb-4"/>
                            <h3 className="text-lg font-semibold">No Saved Words Yet!</h3>
                            <p className="mt-1">Click on a word during a conversation and save it to review here.</p>
                        </div>
                    )}
                </div>
            );
        case 'achievements':
            return (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {achievements.map(ach => (
                        <AchievementCard key={ach.id} achievement={ach} />
                    ))}
                </div>
            );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md dark:bg-slate-800">
        <button onClick={isQuizMode ? () => setIsQuizMode(false) : onBack} className="flex items-center px-3 py-2 -ml-3 space-x-2 text-slate-600 transition-all duration-150 rounded-lg dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400 active:scale-95">
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>
        <h2 className="text-xl font-bold text-center">Learn & Review</h2>
        <div className="w-24"></div> {/* Spacer to keep title centered */}
      </div>

      {!isQuizMode && (
          <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl">
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => setActiveTab('corrections')}
                    className={`w-full flex justify-center items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95 ${activeTab === 'corrections' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow' : 'text-slate-600 dark:text-slate-300'}`}
                >
                    <BookOpenIcon className="w-5 h-5"/>
                    <span>Corrections</span>
                </button>
                <button
                    onClick={() => setActiveTab('vocabulary')}
                    className={`w-full flex justify-center items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95 ${activeTab === 'vocabulary' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow' : 'text-slate-600 dark:text-slate-300'}`}
                >
                    <BookmarkIcon className="w-5 h-5"/>
                    <span>Vocabulary</span>
                </button>
                <button
                    onClick={() => setActiveTab('achievements')}
                    className={`w-full flex justify-center items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95 ${activeTab === 'achievements' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow' : 'text-slate-600 dark:text-slate-300'}`}
                >
                    <TrophyIcon className="w-5 h-5"/>
                    <span>Achievements</span>
                </button>
            </div>
          </div>
      )}
      
      {renderContent()}

    </div>
  );
};

export default LearnAndReview;