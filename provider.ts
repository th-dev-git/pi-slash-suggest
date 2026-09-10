/**
 * Slash-provider wrapper: gives the base provider pi's line-start view of a
 * MID-TEXT slash token, so the full slash menu works anywhere a `/` follows
 * whitespace (ticket 01/02). `applyCompletion` is owned here: the base's
 * splice assumes line-start semantics.
 */

import type { AutocompleteItem, AutocompleteProvider } from "@earendil-works/pi-tui";

/** The mid-text trigger rule: `/` at line start or after whitespace. */
export const SLASH_TOKEN_RE = /(?:^|\s)(\/\S*)$/;

export function wrapSlashProvider(base: AutocompleteProvider): AutocompleteProvider {
	return {
		triggerCharacters: base.triggerCharacters,

		async getSuggestions(lines, cursorLine, cursorCol, options) {
			const before = (lines[cursorLine] || "").slice(0, cursorCol);
			const m = SLASH_TOKEN_RE.exec(before);
			const isNativeLineStart = cursorLine === 0 && m !== null && m[1] === before;
			if (!m || isNativeLineStart) {
				// No mid-text token (or pi's own line-start case): untouched.
				return base.getSuggestions(lines, cursorLine, cursorCol, options);
			}
			// Synthesize the line-start view: token becomes the whole line.
			const token = m[1];
			const after = (lines[cursorLine] || "").slice(cursorCol);
			const synthLines = [...lines];
			synthLines[cursorLine] = token + after;
			return base.getSuggestions(synthLines, cursorLine, token.length, options);
		},

		applyCompletion(
			lines: string[],
			cursorLine: number,
			cursorCol: number,
			item: AutocompleteItem,
			prefix: string,
		) {
			// Own ONLY the mid-text slash token; everything else (`@` files,
			// native line-start slash) keeps the base's behavior untouched.
			const before = (lines[cursorLine] || "").slice(0, cursorCol);
			const m = SLASH_TOKEN_RE.exec(before);
			const tokenStart = m ? before.length - m[1].length : -1;
			const isMidTextSlash = m !== null && m[1] === prefix && !(cursorLine === 0 && tokenStart === 0);
			if (!isMidTextSlash) {
				return base.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
			}
			const line = lines[cursorLine] || "";
			const start = cursorCol - prefix.length;
			// Trailing space (ticket 04) — always at EOL, skipped only before
			// existing whitespace.
			const nextChar = line[cursorCol];
			const needsSpace = nextChar === undefined || !/\s/.test(nextChar);
			const inserted = `/${item.value}${needsSpace ? " " : ""}`;
			const next = [...lines];
			next[cursorLine] = line.slice(0, start) + inserted + line.slice(cursorCol);
			// Cursor lands past the single separating space, whichever side it came from.
			return { lines: next, cursorLine, cursorCol: start + inserted.length + (needsSpace ? 0 : 1) };
		},

		shouldTriggerFileCompletion: base.shouldTriggerFileCompletion?.bind(base),
	};
}
