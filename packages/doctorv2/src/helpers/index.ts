export const returnFalse: () => false = () => false;
export const returnNull: () => null = () => null;

export const safeMatch = (text: string, regex: RegExp) => {
	const match = text.match(regex);

	if (Array.isArray(match)) {
		return match;
	}

	return [];
};

export const safeMatchAll = (text: string, regex: RegExp) => {
	const matches = [];
	let match = null;

	while ((match = regex.exec(text)) !== null) {
		matches.push(match);
	}

	return matches;
};
