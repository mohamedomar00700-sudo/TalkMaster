import React, { useState, useEffect } from 'react';
import { UserProfile, LearningGoal } from '../types';
import { ArrowLeftIcon, UserIcon, CheckIcon, AlertTriangleIcon } from './icons';

interface SettingsViewProps {
  userProfile: UserProfile | null;
  onUpdateProfile: (updatedData: Partial<UserProfile>) => void;
  onBack: () => void;
  onClearVocabulary: () => void;
  onClearCorrections: () => void;
  onResetApp: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, onUpdateProfile, onBack, onClearVocabulary, onClearCorrections, onResetApp }) => {
  // All hooks must be called at the top level, before any conditional returns.
  const [isEditingName, setIsEditingName] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<'vocabulary' | 'corrections' | 'reset' | null>(null);
  
  // Initialize state safely to prevent crash on reset, where userProfile becomes null.
  const [name, setName] = useState(userProfile?.name ?? '');
  const [goal, setGoal] = useState(userProfile?.goal ?? LearningGoal.GENERAL);

  // Sync state if userProfile prop changes while component is mounted.
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setGoal(userProfile.goal);
    }
  }, [userProfile]);

  // Guard against rendering if userProfile is null. This is crucial for the reset flow.
  if (!userProfile) {
    return null;
  }
  
  const handleNameSave = () => {
    if (name.trim() && name.trim() !== userProfile.name) {
      onUpdateProfile({ name: name.trim() });
    }
    setIsEditingName(false);
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGoal = e.target.value as LearningGoal;
    setGoal(newGoal);
    onUpdateProfile({ goal: newGoal });
  };
  
  const handleConfirm = () => {
    if (confirmingAction === 'vocabulary') onClearVocabulary();
    if (confirmingAction === 'corrections') onClearCorrections();
    if (confirmingAction === 'reset') onResetApp();
    setConfirmingAction(null);
  };
  
  const getConfirmationMessage = () => {
      switch(confirmingAction) {
          case 'vocabulary': return 'All saved vocabulary will be permanently deleted.';
          case 'corrections': return 'All saved corrections will be permanently deleted.';
          case 'reset': return 'All progress, settings, and saved items will be permanently deleted.';
          default: return '';
      }
  }


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md dark:bg-slate-800">
        <button onClick={onBack} className="flex items-center px-3 py-2 -ml-3 space-x-2 text-slate-600 transition-all duration-150 rounded-lg dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400 active:scale-95">
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>
        <h2 className="text-xl font-bold text-center">Settings</h2>
        <div className="w-24"></div> {/* Spacer to keep title centered */}
      </div>

      {/* Profile Section */}
      <div className="p-6 bg-white rounded-xl shadow-md dark:bg-slate-800">
        <h3 className="text-lg font-bold">Profile</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-600 dark:text-slate-300">Name</label>
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1 text-right bg-slate-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                />
                <button onClick={handleNameSave} className="p-2 text-white bg-emerald-500 rounded-full hover:bg-emerald-600">
                  <CheckIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-slate-800 dark:text-slate-100">{userProfile.name}</span>
                <button onClick={() => setIsEditingName(true)} className="text-sm font-semibold text-teal-600 hover:underline">Edit</button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="learningGoal" className="font-semibold text-slate-600 dark:text-slate-300">Learning Goal</label>
            <select
              id="learningGoal"
              value={goal}
              onChange={handleGoalChange}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 border-transparent"
            >
              {Object.values(LearningGoal).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
       {/* Danger Zone Section */}
      <div className="p-6 bg-rose-50 dark:bg-rose-900/30 rounded-xl shadow-md border-2 border-rose-200 dark:border-rose-800">
        <div className="flex items-center space-x-3">
            <AlertTriangleIcon className="w-6 h-6 text-rose-500"/>
            <h3 className="text-lg font-bold text-rose-800 dark:text-rose-200">Danger Zone</h3>
        </div>
        
        {confirmingAction ? (
            <div className="mt-4 text-center animate-fadeIn">
                <p className="font-semibold text-rose-700 dark:text-rose-200">Are you absolutely sure?</p>
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-300">{getConfirmationMessage()}</p>
                <div className="flex justify-center mt-4 space-x-4">
                    <button
                        onClick={() => setConfirmingAction(null)}
                        className="px-6 py-2 font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
                    >
                        Yes, I'm sure
                    </button>
                </div>
            </div>
        ) : (
            <>
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">These actions are permanent and cannot be undone.</p>
                <div className="flex flex-col mt-4 space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setConfirmingAction('vocabulary')}
                    className="w-full px-4 py-2 font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors duration-200"
                  >
                    Clear Saved Vocabulary
                  </button>
                  <button
                    onClick={() => setConfirmingAction('corrections')}
                    className="w-full px-4 py-2 font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors duration-200"
                  >
                    Clear Saved Corrections
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-700">
                  <button
                    onClick={() => setConfirmingAction('reset')}
                    className="w-full px-4 py-2 font-bold text-rose-100 bg-rose-700 rounded-lg hover:bg-rose-800 transition-colors duration-200"
                  >
                    Reset Application
                  </button>
                  <p className="mt-2 text-xs text-center text-rose-500 dark:text-rose-400">
                    This will log you out and clear all data, starting the app from the beginning.
                  </p>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default SettingsView;