// FIX: Import React to use React types like FC and SVGProps.
import React from 'react';

export enum UserLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export enum Speaker {
  User = 'user',
  Bot = 'bot',
}

export interface BotAvatar {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  description: string;
  goal: string;
  systemPrompt: string;
  reverseGoal: string;
  reverseSystemPrompt: string;
  backgroundImage: string;
  isCustom?: boolean;
}

export interface Message {
  id: string;
  speaker: Speaker;
  text: string;
  feedback?: string;
}

export interface Achievement {
  id:string;
  title: string;
  description: string;
  emoji: string;
  goal: number;
}

export interface UserStats {
  conversationsCompleted: number;
  uniqueScenarios: string[];
  streak: number;
  lastConversationDate: string | null; // YYYY-MM-DD
  flawlessConversations: number;
  dailyQuestsCompleted: number;
}

export interface ReviewItem {
  id: string;
  original: string;
  correction: string;
}

export interface VocabularyItem {
  word: string;
  definition: string;
  example: string;
}

export interface Voice {
    id: string;
    name: string;
}

export enum View {
  DASHBOARD,
  SCENARIO_SELECTION, // Kept for potential direct navigation, but Dashboard is primary
  CONVERSATION,
  CONVERSATION_SUMMARY,
  LEARN_REVIEW,
  SETTINGS,
}

export enum InteractionMode {
    LIVE = 'live',
    TEXT = 'text',
}

export interface ConversationResult {
  earnedXp: number;
  messages: Message[];
  scenario: Scenario;
  duration: number; // in seconds
}

export enum ConversationStatus {
    IDLE = 'Select a scenario to start',
    CONNECTING = 'Connecting...',
    LISTENING = 'Listening...',
    THINKING = 'Thinking...',
    SPEAKING = 'Speaking...',
    ERROR = 'An error occurred. Please try again.',
    RATE_LIMIT_ERROR = 'API rate limit reached. Please wait a moment.',
}

// New types for Daily Quests
export enum QuestType {
  COMPLETE_ANY_SCENARIO = 'COMPLETE_ANY_SCENARIO',
  COMPLETE_SPECIFIC_SCENARIO = 'COMPLETE_SPECIFIC_SCENARIO',
  CONVERSE_FOR_MINUTES = 'CONVERSE_FOR_MINUTES',
  SAVE_VOCAB_WORDS = 'SAVE_VOCAB_WORDS',
  USE_SPECIFIC_WORD = 'USE_SPECIFIC_WORD', // Future enhancement
}

export interface Quest {
  id: string;
  description: string;
  type: QuestType;
  goal: number; // e.g., 2 (minutes), 3 (words)
  currentProgress: number;
  xp: number;
  isCompleted: boolean;
  isClaimed: boolean;
  meta?: { // For specific targets
    scenarioId?: string;
    word?: string;
  }
}

// New types for Onboarding
export enum LearningGoal {
  TRAVEL = 'Travel',
  CAREER = 'Career',
  SOCIAL = 'Social',
  GENERAL = 'General Fluency',
}

export interface UserProfile {
  name: string;
  goal: LearningGoal;
  avatarId: string;
}