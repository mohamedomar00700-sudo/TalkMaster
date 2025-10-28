import { VocabularyItem } from '../types';

const VOCABULARY_KEY = 'talkmaster_vocabulary_items';

class VocabularyService {
    public getVocabularyItems(): VocabularyItem[] {
        try {
            const items = localStorage.getItem(VOCABULARY_KEY);
            return items ? JSON.parse(items) : [];
        } catch (error) {
            console.error('Error parsing vocabulary items:', error);
            return [];
        }
    }

    public saveVocabularyItem(newItem: VocabularyItem): void {
        const items = this.getVocabularyItems();
        if (!items.some(item => item.word.toLowerCase() === newItem.word.toLowerCase())) {
            const updatedItems = [newItem, ...items];
            localStorage.setItem(VOCABULARY_KEY, JSON.stringify(updatedItems));
        }
    }

    public isWordSaved(word: string): boolean {
        const items = this.getVocabularyItems();
        return items.some(item => item.word.toLowerCase() === word.toLowerCase());
    }

    public clearVocabularyItems(): void {
        localStorage.removeItem(VOCABULARY_KEY);
    }
}

export const vocabularyService = new VocabularyService();
