/**
 * Editor-component chaining (cooperative convention).
 *
 * pi keeps exactly ONE custom-editor factory: `ctx.ui.setEditorComponent`
 * replaces the previous one wholesale (InteractiveMode.setCustomEditorComponent),
 * so two extensions that each install an editor knock each other out — last
 * loader wins. This helper composes instead:
 *
 *   1. Capture the previously installed factory via `ctx.ui.getEditorComponent()`
 *      at registration time (session_start), before the next extension
 *      overwrites it.
 *   2. Build this extension's editor class on top of the previous factory's
 *      editor class.
 *   3. Expose the composed class as `factory.editorClass` so the NEXT
 *      extension can chain without probing.
 *
 * A previous factory without `.editorClass` (foreign extension) is probed
 * once: it is constructed and the instance's runtime class used as the base.
 * pi's Editor constructor only sets fields, so probe construction is
 * side-effect-free.
 *
 * This file is duplicated in every extension that participates
 * (pi-slash-suggest, pi-char-thai) — the packages ship independently on npm
 * and must not import each other. Keep the copies in sync.
 */

import { CustomEditor } from "@earendil-works/pi-coding-agent";

/** Any pi editor class: CustomEditor or a subclass built by another extension. */
export type EditorConstructor = new (...args: any[]) => CustomEditor;

/** The factory pi's setEditorComponent expects, plus the cooperative marker. */
export interface EditorComponentFactory {
	(...args: any[]): any;
	editorClass?: EditorConstructor;
}

interface EditorComponentUI {
	getEditorComponent?: () => EditorComponentFactory | undefined;
	setEditorComponent: (factory: EditorComponentFactory) => void;
}

/**
 * Install `makeEditorClass` composed onto whatever editor factory is already
 * registered (if any). `makeEditorClass` receives the base class and returns
 * this extension's editor class; it runs at most once, lazily on pi's first
 * construction when a probe was needed, eagerly otherwise.
 */
export function chainEditorComponent(
	ui: EditorComponentUI,
	makeEditorClass: (base: EditorConstructor) => EditorConstructor,
): void {
	const prev = ui.getEditorComponent?.();
	let Composed: EditorConstructor | null = prev?.editorClass ? makeEditorClass(prev.editorClass) : null;

	const factory: EditorComponentFactory = (tui, theme, keybindings) => {
		if (!Composed) {
			let Base: EditorConstructor = CustomEditor;
			if (prev) {
				try {
					const probe = prev(tui, theme, keybindings);
					if (probe && typeof probe.handleInput === "function" && typeof probe.getText === "function") {
						Base = probe.constructor as EditorConstructor;
					}
				}
				catch {
					// Foreign factory threw while probing — fall back to pi's stock base.
				}
			}
			Composed = makeEditorClass(Base);
			factory.editorClass = Composed;
		}
		return new Composed(tui, theme, keybindings);
	};
	if (Composed) factory.editorClass = Composed;
	ui.setEditorComponent(factory);
}
