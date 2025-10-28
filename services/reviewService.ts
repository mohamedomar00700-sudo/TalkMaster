import { ReviewItem } from '../types';

const REVIEW_KEY = 'talkmaster_review_items';

class ReviewService {

    public getReviewItems(): ReviewItem[] {
        try {
            const items = localStorage.getItem(REVIEW_KEY);
            return items ? JSON.parse(items) : [];
        } catch (error) {
            console.error('Error parsing review items:', error);
            return [];
        }
    }

    public addReviewItem(newItem: ReviewItem): void {
        const items = this.getReviewItems();
        // Avoid adding duplicate originals
        if (!items.some(item => item.original.toLowerCase() === newItem.original.toLowerCase())) {
            const updatedItems = [newItem, ...items];
            localStorage.setItem(REVIEW_KEY, JSON.stringify(updatedItems));
        }
    }

    public clearReviewItems(): void {
        localStorage.removeItem(REVIEW_KEY);
    }
}

export const reviewService = new ReviewService();
