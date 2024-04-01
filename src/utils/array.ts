/**
 * Checks if two arrays contain the same elements.
 */
export const arraysSimilar = <T>(arr1: readonly T[], arr2: readonly T[]) => {
	if (arr1.length !== arr2.length) return false;
	const map = new Map();
	for (const it of arr1) map.set(it, map.has(it) ? map.get(it) + 1 : 1);
	for (const it of arr2) {
		if (!map.has(it)) return false;
		if (map.get(it) === 1) map.delete(it);
		else map.set(it, map.get(it) - 1);
	}
	if (map.size > 0) return false;
	return true;
};
