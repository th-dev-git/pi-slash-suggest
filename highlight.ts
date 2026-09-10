/**
 * Slash-token highlight: wraps COMPLETED slash tokens (ticket 04: completed
 * = followed by whitespace or EOL; in-progress tokens stay plain) in ANSI.
 * Pure string transform applied to `Editor.render()` output lines
 * (rainbow-editor pattern, pi examples/extensions/rainbow-editor.ts).
 */

export const HL_ON = "\x1b[48;2;70;70;110m\x1b[97m"; // muted indigo bg, white fg
export const HL_OFF = "\x1b[0m";

/** pi-tui's hardware-cursor sentinel, which can sit inside a rendered token. */
const CURSOR_MARKER = "\x1b_pi:c\x07";

// Token: `/` + letter, then word chars / `:` / `-`, tolerating the cursor
// marker anywhere inside or at the end. Boundary: whitespace or line start
// before, whitespace/marker/EOL after (mirrors the mid-text trigger rule).
const TOKEN_RE = new RegExp(
	`(^|\\s)(\\/[A-Za-z](?:[\\w:-]|${CURSOR_MARKER})*)(?=\\s|${CURSOR_MARKER}|$)`,
	"g",
);

export function highlightSlashTokens(line: string): string {
	return line.replace(TOKEN_RE, (_m, pre: string, token: string) => `${pre}${HL_ON}${token}${HL_OFF}`);
}
