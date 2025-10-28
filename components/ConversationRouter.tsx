import React from 'react';
import { Scenario, UserLevel, Voice, InteractionMode, ConversationResult } from '../types';
import LiveConversationView from './LiveConversationView';
import TextConversationView from './TextConversationView';

interface ConversationRouterProps {
  scenario: Scenario;
  userLevel: UserLevel;
  voice: Voice;
  interactionMode: InteractionMode;
  userRole: 'default' | 'reversed';
  onConversationEnd: (result: Omit<ConversationResult, 'duration'>) => void;
  selectedAvatarId: string;
}

const ConversationRouter: React.FC<ConversationRouterProps> = ({
  scenario,
  userLevel,
  voice,
  interactionMode,
  userRole,
  onConversationEnd,
  selectedAvatarId,
}) => {
  const systemPrompt = userRole === 'default' ? scenario.systemPrompt : scenario.reverseSystemPrompt;
  const goal = userRole === 'default' ? scenario.goal : scenario.reverseGoal;
  const currentScenario = { ...scenario, systemPrompt, goal };

  if (interactionMode === InteractionMode.LIVE) {
    return (
      <LiveConversationView
        scenario={currentScenario}
        userLevel={userLevel}
        voice={voice}
        onConversationEnd={onConversationEnd}
        selectedAvatarId={selectedAvatarId}
      />
    );
  }

  return (
    <TextConversationView
      scenario={currentScenario}
      userLevel={userLevel}
      voice={voice}
      onConversationEnd={onConversationEnd}
      selectedAvatarId={selectedAvatarId}
    />
  );
};

export default ConversationRouter;