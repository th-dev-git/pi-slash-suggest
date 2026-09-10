/**
 * SlashSuggestEditor: pi's CustomEditor with the mid-text `/` trigger and
 * slash-token highlight (tickets 01/02/04).
 *
 * - The three gating methods are TS-private and runtime-overridden
 *   (`@ts-expect-error`); confirmed against the installed pi 0.85.1 runtime
 *   (Homebrew) and identical in the pinned 0.84.3 types. Fallback if an
 *   upgrade breaks this: one-line
 *   core patch (drop the `/` exclusion in pi-tui editor.js
 *   setAutocompleteTriggerCharacters + relax isSlashMenuAllowed).
 * - Menu keys mid-text (ticket 04): accept = Tab or → only; Enter closes the
 *   menu without accepting or submitting (native Enter = accept+submit is
 *   preserved at line start). Key rewriting matches raw sequences — v1 ignores
 *   user-rebound TUI keybindings.
 */

import { CustomEditor } from "@earendil-works/pi-coding-agent";
import { highlightSlashTokens } from "./highlight";
import { SLASH_TOKEN_RE } from "./provider";

// @ts-expect-error — runtime-overrides TS-private base methods
// (isSlashMenuAllowed / isAtStartOfMessage / isInSlashCommandContext)
export class SlashSuggestEditor extends CustomEditor {
	override isSlashMenuAllowed(): boolean {
		return true; // drop the cursorLine === 0 gate
	}

	override isAtStartOfMessage(): boolean {
		// Called right after `/` was inserted: it must sit at a word boundary
		// (start of line or after whitespace), on ANY line.
		const before = this.currentLineBeforeCursor();
		return /(?:^|\s)\/$/.test(before);
	}

	override isInSlashCommandContext(textBeforeCursor: string): boolean {
		// Base semantics (line-start "/cmd args") OR the mid-text token.
		return textBeforeCursor.trimStart().startsWith("/") || SLASH_TOKEN_RE.test(textBeforeCursor);
	}

	override render(width: number): string[] {
		// Menu open = token in progress: no highlight — also keeps the ANSI
		// wrap out of the autocomplete menu rows.
		if (this.isShowingAutocomplete()) return super.render(width);
		return super.render(width).map((line) => highlightSlashTokens(line));
	}

	override handleInput(data: string): void {
		if (this.isShowingAutocomplete() && this.isMidTextSlashContext()) {
			// Enter: close the menu only — never accept, never submit.
			if (data === "\r") return super.handleInput("\x1b");
			// → : accept, exactly like Tab.
			if (data === "\x1b[C") return super.handleInput("\t");
		}
		return super.handleInput(data);
	}

	/** True when the cursor sits on a slash token that ISN'T pi's native
	 *  line-0-start case (whose Enter/Tab UX stays untouched). */
	private isMidTextSlashContext(): boolean {
		const before = this.currentLineBeforeCursor();
		const m = SLASH_TOKEN_RE.exec(before);
		if (!m) return false;
		const tokenStart = before.length - m[1].length;
		// @ts-expect-error — private state access
		return !(this.state.cursorLine === 0 && tokenStart === 0);
	}

	private currentLineBeforeCursor(): string {
		// @ts-expect-error — private state access, same as pi's own impl
		const line = this.state.lines[this.state.cursorLine] || "";
		// @ts-expect-error — private state access
		return line.slice(0, this.state.cursorCol);
	}
}
