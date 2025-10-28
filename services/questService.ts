import { Quest, QuestType } from '../types';
import { QUEST_DEFINITIONS } from '../constants';
import { achievementService } from './achievementService';

const QUESTS_KEY = 'talkmaster_daily_quests';
const QUESTS_DATE_KEY = 'talkmaster_quests_date';

class QuestService {

    public getQuests(): Quest[] {
        const today = new Date().toISOString().split('T')[0];
        const lastGeneratedDate = localStorage.getItem(QUESTS_DATE_KEY);

        if (lastGeneratedDate !== today) {
            return this.generateDailyQuests();
        }

        try {
            const questsJson = localStorage.getItem(QUESTS_KEY);
            return questsJson ? JSON.parse(questsJson) : this.generateDailyQuests();
        } catch (error) {
            console.error('Error parsing quests:', error);
            return this.generateDailyQuests();
        }
    }

    private saveQuests(quests: Quest[]): void {
        localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
    }

    private generateDailyQuests(): Quest[] {
        const today = new Date().toISOString().split('T')[0];
        
        // Filter out quests that might be too hard for a new user
        const stats = achievementService.getStats();
        const availableQuests = QUEST_DEFINITIONS.filter(q => {
            if (q.type === QuestType.COMPLETE_SPECIFIC_SCENARIO && stats.conversationsCompleted < 1) {
                return false;
            }
            if (q.type === QuestType.CONVERSE_FOR_MINUTES && q.goal > 120 && stats.conversationsCompleted < 3) {
                return false;
            }
            return true;
        });

        // Pick 3 unique quests
        const shuffled = [...availableQuests].sort(() => 0.5 - Math.random());
        const selectedQuests = shuffled.slice(0, 3).map((q, index): Quest => ({
            ...q,
            id: `${today}-${index}`,
            currentProgress: 0,
            isCompleted: false,
            isClaimed: false,
        }));

        this.saveQuests(selectedQuests);
        localStorage.setItem(QUESTS_DATE_KEY, today);
        return selectedQuests;
    }

    public updateQuestProgress(type: QuestType, value: number | string): Quest[] {
        const quests = this.getQuests();
        let questsUpdated = false;

        const updatedQuests = quests.map(quest => {
            if (quest.isCompleted) {
                return quest;
            }

            let progressMade = false;
            if (quest.type === type) {
                if (type === QuestType.COMPLETE_SPECIFIC_SCENARIO && quest.meta?.scenarioId === value) {
                    quest.currentProgress += 1;
                    progressMade = true;
                } else if (type === QuestType.COMPLETE_ANY_SCENARIO) {
                    quest.currentProgress += 1;
                    progressMade = true;
                } else if (type === QuestType.CONVERSE_FOR_MINUTES && typeof value === 'number') {
                    quest.currentProgress += value;
                    progressMade = true;
                } else if (type === QuestType.SAVE_VOCAB_WORDS) {
                    quest.currentProgress += 1;
                    progressMade = true;
                }
            }

            if (progressMade) {
                questsUpdated = true;
                if (quest.currentProgress >= quest.goal) {
                    quest.currentProgress = quest.goal;
                    quest.isCompleted = true;
                }
            }
            return quest;
        });

        if (questsUpdated) {
            this.saveQuests(updatedQuests);
        }

        return updatedQuests;
    }

    public claimReward(questId: string): { quests: Quest[]; xpGained: number } {
        const quests = this.getQuests();
        let xpGained = 0;
        const updatedQuests = quests.map(quest => {
            if (quest.id === questId && quest.isCompleted && !quest.isClaimed) {
                quest.isClaimed = true;
                xpGained = quest.xp;
            }
            return quest;
        });
        
        if (xpGained > 0) {
            this.saveQuests(updatedQuests);
        }
        
        return { quests, xpGained };
    }
}

export const questService = new QuestService();
