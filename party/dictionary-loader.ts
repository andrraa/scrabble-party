import { PACKED_WORDS } from './words-packed';

let dictionarySet: Set<string> | null = null;

export function getDictionary(): Set<string> {
	if (dictionarySet) return dictionarySet;

	dictionarySet = new Set<string>(PACKED_WORDS.split(' '));
	return dictionarySet;
}

export function isValidWord(word: string, dict: Set<string>): boolean {
	return dict.has(word.toUpperCase());
}
