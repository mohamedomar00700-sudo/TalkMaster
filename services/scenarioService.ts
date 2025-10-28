import { Scenario } from '../types';
import { SCENARIOS } from '../constants';
import { achievementService } from './achievementService';

const CUSTOM_SCENARIOS_KEY = 'talkmaster_custom_scenarios';

class ScenarioService {
    public getCustomScenarios(): Scenario[] {
        try {
            const scenariosJson = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
            return scenariosJson ? JSON.parse(scenariosJson) : [];
        } catch (error) {
            console.error('Error parsing custom scenarios from localStorage:', error);
            return [];
        }
    }

    public saveCustomScenario(newScenario: Scenario): void {
        const customScenarios = this.getCustomScenarios();
        const updatedScenarios = [newScenario, ...customScenarios];
        localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(updatedScenarios));
    }
    
    public getAllScenarios(): Scenario[] {
        const customScenarios = this.getCustomScenarios();
        // Return custom scenarios first, then the default ones
        return [...customScenarios, ...SCENARIOS];
    }

    public getNextScenarioInJourney(): Scenario | null {
        const stats = achievementService.getStats();
        const completedScenarioIds = new Set(stats.uniqueScenarios);

        // Find the first default scenario that hasn't been completed
        const nextScenario = SCENARIOS.find(s => !completedScenarioIds.has(s.id));

        return nextScenario || null;
    }
}

export const scenarioService = new ScenarioService();
