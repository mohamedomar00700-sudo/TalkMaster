import React, { useState, useMemo, useCallback } from 'react';
import { ReviewItem, VocabularyItem } from '../types';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from './icons';
import { audioService } from '../services/audioService';

interface QuizViewProps {
  items: (ReviewItem | VocabularyItem)[];
  type: 'corrections' | 'vocabulary';
  onBack: () => void;
}

interface Question {
  prompt: string;
  options: string[];
  correctAnswer: string;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const QuizView: React.FC<QuizViewProps> = ({ items, type, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = useMemo<Question[]>(() => {
    const shuffledItems = shuffleArray(items);
    return shuffledItems.map((item, index) => {
      let prompt: string, correctAnswer: string;
      if (type === 'corrections') {
        const reviewItem = item as ReviewItem;
        prompt = `You said: "${reviewItem.original}". What is the correction?`;
        correctAnswer = reviewItem.correction;
      } else {
        const vocabItem = item as VocabularyItem;
        prompt = `What is the definition of "${vocabItem.word}"?`;
        correctAnswer = vocabItem.definition;
      }

      // Generate distractors
      const distractors = shuffledItems
        .filter((_, i) => i !== index)
        .slice(0, 3)
        .map(distractorItem => {
          if (type === 'corrections') return (distractorItem as ReviewItem).correction;
          return (distractorItem as VocabularyItem).definition;
        });

      const options = shuffleArray([correctAnswer, ...distractors]);
      return { prompt, options, correctAnswer };
    });
  }, [items, type]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    if (answer === currentQuestion.correctAnswer) {
      audioService.playSuccess();
      setScore(s => s + 1);
    } else {
      audioService.playError();
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
        <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <p className="mt-4 text-lg">Your score:</p>
            <p className={`mt-2 text-6xl font-bold ${percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                {percentage}%
            </p>
            <p className="mt-2 text-slate-500">{score} out of {questions.length} correct</p>
            <div className="mt-8 space-x-4">
                <button onClick={handleRestart} className="px-6 py-2 font-semibold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-teal-500 to-purple-600 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">Try Again</button>
                <button onClick={onBack} className="px-6 py-2 font-semibold text-slate-700 bg-slate-200 rounded-full dark:bg-slate-600 dark:text-slate-200">Finish</button>
            </div>
        </div>
    );
  }

  if (!currentQuestion) {
      return (
          <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl shadow-md">
              <AlertTriangleIcon className="w-12 h-12 mx-auto text-amber-500" />
              <h2 className="mt-4 text-xl font-bold">Not Enough Items</h2>
              <p className="mt-2 text-slate-500">You need at least 3 items saved to start a quiz.</p>
          </div>
      )
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Quiz Time!</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>

        <p className="mb-6 text-lg font-medium text-center">{currentQuestion.prompt}</p>

        <div className="space-y-3">
            {currentQuestion.options.map(option => {
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = option === selectedAnswer;
                
                let buttonClass = 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700';
                if (isAnswered) {
                    if (isCorrect) {
                        buttonClass = 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 text-emerald-800 dark:text-emerald-200';
                    } else if (isSelected) {
                        buttonClass = 'bg-rose-100 dark:bg-rose-900/50 border-rose-400 text-rose-800 dark:text-rose-200';
                    } else {
                         buttonClass = 'border-slate-300 dark:border-slate-600 opacity-60';
                    }
                }

                return (
                    <button
                        key={option}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={isAnswered}
                        className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${buttonClass}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex-grow">{option}</span>
                            {isAnswered && isCorrect && <CheckCircleIcon className="w-6 h-6 text-emerald-500"/>}
                            {isAnswered && isSelected && !isCorrect && <XCircleIcon className="w-6 h-6 text-rose-500"/>}
                        </div>
                    </button>
                )
            })}
        </div>
        
        {isAnswered && (
             <button
                onClick={handleNext}
                className="w-full px-6 py-3 mt-8 font-bold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-teal-500 to-purple-600 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Show Results'}
            </button>
        )}
    </div>
  );
};

export default QuizView;