import { Scenario, Achievement, Voice, Quest, QuestType, BotAvatar } from './types';
import { BotHeadIcon, LyraIcon, NovaIcon } from './components/icons';

export const SCENARIOS: Scenario[] = [
  {
    id: 'airport',
    title: 'At the Airport',
    emoji: '✈️',
    description: 'Navigate check-in, security, and boarding.',
    goal: 'Successfully check in for your flight and ask for a window seat.',
    reverseGoal: 'Act as airport staff and help a traveler check in for their flight.',
    systemPrompt: 'You are a helpful airport staff member. Guide the user, who is a traveler, through the process of checking in for a flight to London. Keep your responses friendly and concise.',
    reverseSystemPrompt: 'You are a traveler checking in for a flight. The user is the airport staff. Start by telling them you want to check in for your flight to London. Ask questions if you are unsure what to do.',
    backgroundImage: 'https://picsum.photos/seed/airport/1200/800',
  },
  {
    id: 'restaurant',
    title: 'In a Restaurant',
    emoji: '🍔',
    description: 'Order food, ask for the bill, and interact with the waiter.',
    goal: 'Order a main course, a drink, and ask for the bill.',
    reverseGoal: 'Act as the waiter, take the customer\'s order, and bring them the bill.',
    systemPrompt: 'You are a friendly restaurant waiter. The user is a customer. Welcome them, take their order, and respond to their requests. Start by asking them if they are ready to order. Keep your language natural and appropriate for a casual dining setting.',
    reverseSystemPrompt: 'You are a customer at a restaurant. The user is the waiter. Wait for them to greet you and then order a meal. Start by telling them you are ready to order.',
    backgroundImage: 'https://picsum.photos/seed/restaurant/1200/800',
  },
  {
    id: 'job_interview',
    title: 'Job Interview',
    emoji: '💼',
    description: 'Answer common interview questions and showcase your skills.',
    goal: 'Introduce yourself and answer a question about your strengths.',
    reverseGoal: 'Act as the hiring manager and interview a candidate for a job.',
    systemPrompt: 'You are a hiring manager for a tech company. The user is a candidate for a software engineer role. Ask them common interview questions, starting with "Tell me about yourself." Evaluate their responses and provide a challenging but fair interview experience.',
    reverseSystemPrompt: 'You are a candidate interviewing for a software engineer role. The user is the hiring manager. Respond to their questions professionally. Start by introducing yourself when prompted.',
    backgroundImage: 'https://picsum.photos/seed/office/1200/800',
  },
  {
    id: 'hotel',
    title: 'At the Hotel',
    emoji: '🏨',
    description: 'Check-in, ask for room service, and check-out.',
    goal: 'Check into the hotel and ask about the Wi-Fi password.',
    reverseGoal: 'Act as the hotel receptionist and check a guest in.',
    systemPrompt: 'You are a hotel receptionist. The user is a guest who wants to check in. Greet them warmly and guide them through the check-in process. Ask for their reservation name to begin.',
    reverseSystemPrompt: 'You are a guest checking into a hotel. The user is the receptionist. Start by saying you have a reservation and give them your name (e.g., "Smith").',
    backgroundImage: 'https://picsum.photos/seed/hotel/1200/800',
  },
  {
    id: 'friends',
    title: 'Meeting Friends',
    emoji: '☕',
    description: 'Make small talk and catch up with friends.',
    goal: 'Ask your friend how they have been and suggest an activity.',
    reverseGoal: 'Respond to your friend\'s questions and share what you\'ve been up to.',
    systemPrompt: 'You are a friend meeting the user at a cafe. You haven\'t seen them in a while. Start the conversation by saying "Hey! It\'s been a while, how have you been?". Be casual, friendly, and engaging.',
    reverseSystemPrompt: 'You are meeting a friend (the user) at a cafe. They will start the conversation. Respond to them in a friendly, casual, and engaging way.',
    backgroundImage: 'https://picsum.photos/seed/cafe/1200/800',
  },
  {
    id: 'doctor',
    title: 'At the Doctor',
    emoji: '⚕️',
    description: 'Describe your symptoms and understand the doctor\'s advice.',
    goal: 'Describe at least two symptoms to the doctor.',
    reverseGoal: 'Act as the doctor, listen to the patient\'s symptoms, and give advice.',
    systemPrompt: 'You are a caring doctor. The user is your patient. Begin by asking "Hello, what seems to be the problem today?". Listen to their symptoms patiently and ask clarifying questions.',
    reverseSystemPrompt: 'You are a patient visiting the doctor (the user). Wait for them to ask about your symptoms, then describe what is wrong (e.g., "I have a headache and a sore throat.").',
    backgroundImage: 'https://picsum.photos/seed/clinic/1200/800',
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_conversation',
    title: 'First Conversation',
    description: 'Complete your first conversation.',
    emoji: '👋',
    goal: 1,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Try 5 different scenarios.',
    emoji: '🗺️',
    goal: 5,
  },
  {
    id: 'persistent',
    title: 'Persistent',
    description: 'Practice for 7 days in a row.',
    emoji: '🔥',
    goal: 7,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete a conversation with no mistakes.',
    emoji: '🎯',
    goal: 1,
  },
];

export const VOICES: Voice[] = [
    { id: 'Zephyr', name: 'Zephyr' },
    { id: 'Kore', name: 'Kore' },
    { id: 'Puck', name: 'Puck' },
    { id: 'Charon', name: 'Charon' },
    { id: 'Fenrir', name: 'Fenrir' },
];

export const BOT_AVATARS: BotAvatar[] = [
  {
    id: 'orion',
    name: 'Orion',
    icon: BotHeadIcon,
  },
  {
    id: 'nova',
    name: 'Nova',
    icon: NovaIcon,
  },
  {
    id: 'lyra',
    name: 'Lyra',
    icon: LyraIcon,
  },
];

export const QUEST_DEFINITIONS: Omit<Quest, 'id' | 'currentProgress' | 'isCompleted' | 'isClaimed'>[] = [
    // General Quests
    { type: QuestType.COMPLETE_ANY_SCENARIO, description: 'Complete any scenario', goal: 1, xp: 20 },
    { type: QuestType.SAVE_VOCAB_WORDS, description: 'Save 3 new words', goal: 3, xp: 15 },
    { type: QuestType.SAVE_VOCAB_WORDS, description: 'Save your first new word', goal: 1, xp: 10 },
    { type: QuestType.CONVERSE_FOR_MINUTES, description: 'Practice for 2 minutes', goal: 120, xp: 25 }, // Goal in seconds
    { type: QuestType.CONVERSE_FOR_MINUTES, description: 'Practice for 5 minutes', goal: 300, xp: 40 }, // Goal in seconds

    // Specific Scenario Quests (will be populated dynamically)
    ...SCENARIOS.map(s => ({
        type: QuestType.COMPLETE_SPECIFIC_SCENARIO,
        description: `Complete the "${s.title}" scenario`,
        goal: 1,
        xp: 30,
        meta: { scenarioId: s.id }
    })),
];


// New: Scenario Themes for the immersive modal
interface ScenarioTheme {
  bgImage: string;
  color: string; // A primary accent color for glows, borders, etc.
  sound: 'airport' | 'restaurant' | 'hotel' | 'interview' | 'default';
}

export const SCENARIO_THEMES: Record<string, ScenarioTheme> = {
  airport: {
    bgImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=2070&auto=format&fit=crop',
    color: '#38bdf8', // sky-400
    sound: 'airport',
  },
  restaurant: {
    bgImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
    color: '#f87171', // red-400
    sound: 'restaurant',
  },
  job_interview: {
    bgImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop',
    color: '#818cf8', // indigo-400
    sound: 'interview',
  },
  hotel: {
    bgImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
    color: '#facc15', // yellow-400
    sound: 'hotel',
  },
  default: {
    bgImage: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb92?q=80&w=2070&auto=format&fit=crop',
    color: '#a78bfa', // violet-400
    sound: 'default',
  }
};
