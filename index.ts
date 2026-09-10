/**
 * slash-suggest — mid-text `/` autocomplete + slash-token highlight.
 *
 * Typing `/` after whitespace (or at any line start) opens the same slash
 * menu pi shows at line start; accepted tokens are highlighted live in the
 * editor. No pi core change: a custom editor overrides three TS-private
 * gating methods, and the autocomplete provider is wrapped to give the base
 * provider a line-start view of mid-text tokens (.scratch/slash-suggest/).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SlashSuggestEditor } from "./editor";
import { wrapSlashProvider } from "./provider";

export default function slashSuggest(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return; // RPC/print modes never construct an editor
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new SlashSuggestEditor(tui, theme, keybindings));
		ctx.ui.addAutocompleteProvider((base) => wrapSlashProvider(base));
	});
}
