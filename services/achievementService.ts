import { Achievement, UserStats } from '../types';
import { ACHIEVEMENTS } from '../constants';

const STATS_KEY = 'talkmaster_stats';
const UNLOCKED_KEY = 'talkmaster_unlocked_achievements';

const isYesterday = (dateString: string): boolean => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split('T')[0] === dateString;
};

const isToday = (dateString: string): boolean => {
    return new Date().toISOString().split('T')[0] === dateString;
}

class AchievementService {
    public getStats(): UserStats {
        try {
            const stats = localStorage.getItem(STATS_KEY);
            const parsedStats = stats ? JSON.parse(stats) : this.getDefaultStats();
            // Ensure new fields exist for old users
            return {
                ...this.getDefaultStats(),
                ...parsedStats
            };
        } catch (error) {
            console.error('Error parsing user stats:', error);
            return this.getDefaultStats();
        }
    }

    public saveStats(stats: UserStats): void {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
    
    public checkAndResetStreak(): void {
        const stats = this.getStats();
        if (stats.lastConversationDate && !isToday(stats.lastConversationDate) && !isYesterday(stats.lastConversationDate)) {
            stats.streak = 0;
            this.saveStats(stats);
        }
    }

    public getUnlockedAchievementIds(): Set<string> {
        try {
            const unlocked = localStorage.getItem(UNLOCKED_KEY);
            return unlocked ? new Set(JSON.parse(unlocked)) : new Set();
        } catch (error) {
            console.error('Error parsing unlocked achievements:', error);
            return new Set();
        }
    }

    private saveUnlockedAchievementIds(unlockedIds: Set<string>): void {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(Array.from(unlockedIds)));
    }

    private getDefaultStats(): UserStats {
        return {
            conversationsCompleted: 0,
            uniqueScenarios: [],
            streak: 0,
            lastConversationDate: null,
            flawlessConversations: 0,
            dailyQuestsCompleted: 0,
        };
    }

    public updateStatsAndCheckAchievements(
        { scenarioId, wasFlawless }: { scenarioId: string; wasFlawless: boolean }
    ): Achievement | null {
        const stats = this.getStats();
        const todayStr = new Date().toISOString().split('T')[0];

        // Update stats
        stats.conversationsCompleted += 1;
        if (!stats.uniqueScenarios.includes(scenarioId)) {
            stats.uniqueScenarios.push(scenarioId);
        }
        if (wasFlawless) {
            stats.flawlessConversations += 1;
        }

        // Update streak
        if (stats.lastConversationDate) {
            if (isYesterday(stats.lastConversationDate)) {
                stats.streak += 1;
            } else if (!isToday(stats.lastConversationDate)) {
                stats.streak = 1; // Reset streak if they missed a day
            }
        } else {
            stats.streak = 1; // First conversation
        }
        stats.lastConversationDate = todayStr;

        this.saveStats(stats);
        
        // Check for new achievements
        const unlockedIds = this.getUnlockedAchievementIds();
        const achievementsToCheck = [
            { id: 'first_conversation', value: stats.conversationsCompleted },
            { id: 'explorer', value: stats.uniqueScenarios.length },
            { id: 'persistent', value: stats.streak },
            { id: 'perfectionist', value: stats.flawlessConversations },
        ];

        for (const check of achievementsToCheck) {
            if (!unlockedIds.has(check.id)) {
                const achievement = ACHIEVEMENTS.find(a => a.id === check.id);
                if (achievement && check.value >= achievement.goal) {
                    unlockedIds.add(achievement.id);
                    this.saveUnlockedAchievementIds(unlockedIds);
                    return achievement; // Return the first new achievement unlocked
                }
            }
        }

        return null; // No new achievements
    }

    public getAllAchievementsWithProgress() {
        const stats = this.getStats();
        const unlockedIds = this.getUnlockedAchievementIds();

        return ACHIEVEMENTS.map(ach => {
            let currentProgress = 0;
            switch (ach.id) {
                case 'first_conversation':
                    currentProgress = stats.conversationsCompleted;
                    break;
                case 'explorer':
                    currentProgress = stats.uniqueScenarios.length;
                    break;
                case 'persistent':
                    currentProgress = stats.streak;
                    break;
                case 'perfectionist':
                    currentProgress = stats.flawlessConversations;
                    break;
            }
            return {
                ...ach,
                isUnlocked: unlockedIds.has(ach.id),
                currentProgress: Math.min(currentProgress, ach.goal),
            };
        });
    }
}

export const achievementService = new AchievementService();
