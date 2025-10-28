
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scenario, UserLevel, View, Message, Speaker, Achievement, Voice, ConversationResult, InteractionMode, QuestType, UserProfile } from './types';
import { VOICES } from './constants';
import { scenarioService } from './services/scenarioService';
import { userService } from './services/userService';
import { reviewService } from './services/reviewService';
import { vocabularyService } from './services/vocabularyService';
import ConversationRouter from './components/ConversationRouter';
import Header from './components/Header';
import { audioService } from './services/audioService';
import { achievementService } from './services/achievementService';
import { questService } from './services/questService';
import AchievementToast from './components/AchievementToast';
import LearnAndReview from './components/LearnAndReview';
import Dashboard from './components/Dashboard';
import ConversationSummary from './components/ConversationSummary';
import StartConversationModal from './components/StartConversationModal';
import Onboarding from './components/Onboarding';
import SettingsView from './components/SettingsView';

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (storedPrefs === 'light' || storedPrefs === 'dark') {
      return storedPrefs;
    }

    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'light';
};


const App: React.FC = () => {
  // Initialize state directly from localStorage to prevent re-render flashes.
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => userService.getUserProfile());
  const [theme, setTheme] = useState(getInitialTheme());
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [conversationResult, setConversationResult] = useState<ConversationResult | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel>(UserLevel.Intermediate);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.LIVE);
  const [userRole, setUserRole] = useState<'default' | 'reversed'>('default');
  const [xp, setXp] = useState(0); // Default to 0, loaded in effect
  const [isSoundEnabled, setIsSoundEnabled] = useState(!audioService.isMuted);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  // Initialize avatar based on the profile loaded from storage.
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(userProfile?.avatarId || 'orion');
  const [isGlowing, setIsGlowing] = useState(false);
  const userAppLevel = Math.floor(xp / 100) + 1;
  const isInitialMount = useRef(true);
  const conversationStartTime = useRef<number | null>(null);

  const loadScenarios = useCallback(() => {
    setScenarios(scenarioService.getAllScenarios());
  }, []);

  const loadInitialStats = useCallback(() => {
    const stats = achievementService.getStats();
    const quests = questService.getQuests();
    const claimedXp = quests.filter(q => q.isClaimed).reduce((sum, q) => sum + q.xp, 0);
    // Base XP from conversations, add claimed quest XP
    setXp(stats.conversationsCompleted * 10 + stats.dailyQuestsCompleted * 25 + 150 + claimedXp);
  }, []);
  
  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    userService.saveUserProfile(profile);
    setUserProfile(profile);
    setSelectedAvatarId(profile.avatarId); // Also set it here for immediate UI update
    audioService.playWelcome(); // Play welcome sound after onboarding
  }, []);

  // This effect now reacts to the userProfile state and handles loading initial data.
  // This replaces the previous useEffect that fetched the profile.
  useEffect(() => {
    loadScenarios();
    if (userProfile) {
      setSelectedAvatarId(userProfile.avatarId);
      achievementService.checkAndResetStreak();
      loadInitialStats();
    } else {
      // Ensure stats are reset if there's no profile (onboarding state)
      setXp(0);
    }
  }, [userProfile, loadScenarios, loadInitialStats]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
       if (userProfile) audioService.playTransition();
    }
  }, [view, userProfile]);

  // Prevent body scroll when the start modal is open
  useEffect(() => {
    if (isStartModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isStartModalOpen]);


  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);
  
  const toggleSound = useCallback(() => {
    audioService.toggleMute();
    setIsSoundEnabled(prevState => !prevState);
  }, []);

  const handleOpenStartModal = useCallback((scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsStartModalOpen(true);
  }, []);
  
  const handleCloseStartModal = useCallback(() => {
    setIsStartModalOpen(false);
    setSelectedScenario(null);
  }, []);

  const handleStartConversation = useCallback((mode: InteractionMode, role: 'default' | 'reversed') => {
    setInteractionMode(mode);
    setUserRole(role);
    setIsStartModalOpen(false);
    conversationStartTime.current = Date.now();
    setView(View.CONVERSATION);
  }, []);

  const handleConversationEnd = useCallback((result: Omit<ConversationResult, 'duration'>) => {
    const durationInSeconds = conversationStartTime.current ? Math.round((Date.now() - conversationStartTime.current) / 1000) : 0;
    const fullResult: ConversationResult = { ...result, duration: durationInSeconds };

    if (fullResult.earnedXp > 0) {
        audioService.playSuccess();
    }
    setXp(prevXp => prevXp + fullResult.earnedXp);

    const wasFlawless = interactionMode === InteractionMode.TEXT && fullResult.messages.length > 0
      ? fullResult.messages.filter(m => m.speaker === Speaker.User).every(m => m.feedback === 'Great job!')
      : false;
    
    const newAchievement = achievementService.updateStatsAndCheckAchievements({
        scenarioId: fullResult.scenario.id,
        wasFlawless,
    });

    // Update quest progress
    questService.updateQuestProgress(QuestType.COMPLETE_ANY_SCENARIO, 1);
    questService.updateQuestProgress(QuestType.COMPLETE_SPECIFIC_SCENARIO, fullResult.scenario.id);
    if (durationInSeconds > 0) {
        questService.updateQuestProgress(QuestType.CONVERSE_FOR_MINUTES, durationInSeconds);
    }
    
    if (newAchievement) {
        audioService.playAchievementUnlock();
        setNewlyUnlockedAchievement(newAchievement);
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 1500); // Duration of the sparkle animation
    }
    
    setConversationResult(fullResult);
    setView(View.CONVERSATION_SUMMARY);
    setSelectedScenario(null);
    conversationStartTime.current = null;
  }, [interactionMode]);
  
  const handleClaimQuestReward = useCallback((questId: string) => {
    const { xpGained } = questService.claimReward(questId);
    if (xpGained > 0) {
        audioService.playSuccess();
        setXp(prev => prev + xpGained);
    }
  }, []);

  const handleCloseToast = useCallback(() => {
    setNewlyUnlockedAchievement(null);
  }, []);

  const handleShowLearnAndReview = useCallback(() => {
    setView(View.LEARN_REVIEW);
  }, []);
  
  const handleShowSettings = useCallback(() => {
    setView(View.SETTINGS);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView(View.DASHBOARD);
    setConversationResult(null); // Clear result after viewing
  }, []);
  
  const handleScenarioCreated = useCallback(() => {
    loadScenarios();
  }, [loadScenarios]);
  
  const handleSelectAvatar = useCallback((avatarId: string) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, avatarId };
      setUserProfile(updatedProfile);
      userService.saveUserProfile(updatedProfile);
      setSelectedAvatarId(avatarId);
    }
  }, [userProfile]);

  const handleUpdateProfile = useCallback((updatedProfileData: Partial<UserProfile>) => {
    if (userProfile) {
        const updatedProfile = { ...userProfile, ...updatedProfileData };
        setUserProfile(updatedProfile);
        userService.saveUserProfile(updatedProfile);
    }
  }, [userProfile]);
  
  const handleClearVocabulary = useCallback(() => {
      vocabularyService.clearVocabularyItems();
  }, []);

  const handleClearCorrections = useCallback(() => {
      reviewService.clearReviewItems();
  }, []);

  const handleResetApp = useCallback(() => {
    // Define all keys used by the application for a thorough cleaning.
    const keysToRemove = [
      'talkmaster_user_profile',
      'theme',
      'soundMuted',
      'talkmaster_stats',
      'talkmaster_unlocked_achievements',
      'talkmaster_review_items',
      'talkmaster_vocabulary_items',
      'talkmaster_custom_scenarios',
      'talkmaster_daily_quests',
      'talkmaster_quests_date',
    ];
    
    // Attempt to remove each key individually.
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Failed to remove key ${key}:`, e);
      }
    });
    
    // Use clear() as a fallback for any missed keys.
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }

    // Reload the page to ensure a completely clean start from cleared storage.
    // This avoids race conditions between React state updates and the refresh.
    window.location.reload();
  }, []);


  if (!userProfile) {
    return <Onboarding onOnboardingComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`min-h-screen text-slate-800 transition-colors duration-300 dark:text-slate-200`}>
       {isGlowing && <div className="achievement-sparkle"></div>}
      <div className="container max-w-4xl min-h-screen p-4 mx-auto md:p-6">
        <Header 
          userLevel={userAppLevel} 
          xp={xp} 
          theme={theme} 
          toggleTheme={toggleTheme}
          isSoundEnabled={isSoundEnabled}
          toggleSound={toggleSound}
          onShowLearnAndReview={handleShowLearnAndReview}
          onShowSettings={handleShowSettings}
        />
        <main className="mt-4">
          {view === View.DASHBOARD && (
            <Dashboard
              userName={userProfile.name}
              scenarios={scenarios}
              onScenarioSelect={handleOpenStartModal}
              onScenarioCreated={handleScenarioCreated}
              onClaimQuestReward={handleClaimQuestReward}
              selectedAvatarId={selectedAvatarId}
              onSelectAvatar={handleSelectAvatar}
            />
          )}
          {view === View.CONVERSATION && selectedScenario && (
            <ConversationRouter
              scenario={selectedScenario}
              userLevel={userLevel}
              onConversationEnd={handleConversationEnd}
              voice={selectedVoice}
              interactionMode={interactionMode}
              userRole={userRole}
              selectedAvatarId={selectedAvatarId}
            />
          )}
          {view === View.CONVERSATION_SUMMARY && conversationResult && (
            <ConversationSummary 
              result={conversationResult}
              onClose={handleBackToDashboard}
            />
          )}
          {view === View.LEARN_REVIEW && (
            <LearnAndReview onBack={handleBackToDashboard} />
          )}
          {view === View.SETTINGS && (
            <SettingsView
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onBack={handleBackToDashboard}
                onClearVocabulary={handleClearVocabulary}
                onClearCorrections={handleClearCorrections}
                onResetApp={handleResetApp}
            />
          )}
        </main>
        {newlyUnlockedAchievement && (
            <AchievementToast 
                achievement={newlyUnlockedAchievement}
                onClose={handleCloseToast}
            />
        )}
        {isStartModalOpen && selectedScenario && (
            <StartConversationModal 
                scenario={selectedScenario}
                onClose={handleCloseStartModal}
                onStart={handleStartConversation}
            />
        )}
      </div>
    </div>
  );
};

export default App;
