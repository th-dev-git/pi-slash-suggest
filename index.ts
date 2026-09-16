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
import { chainEditorComponent } from "./editor-chain";
import { makeSlashSuggestEditorClass } from "./editor";
import { wrapSlashProvider } from "./provider";

export default function slashSuggest(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return; // RPC/print modes never construct an editor
		// Chain, don't replace: another editor-installing extension (e.g.
		// pi-char-thai) may load before or after us (editor-chain.ts).
		chainEditorComponent(ctx.ui, makeSlashSuggestEditorClass);
		ctx.ui.addAutocompleteProvider((base) => wrapSlashProvider(base));
	});
}
