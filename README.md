# pi-slash-suggest

Pi extension. Adds the mid-text trigger and the slash-token highlight to the pi editor.

## What it does

- Type `/` after whitespace, or at the start of any line. The full slash menu opens. This is the mid-text trigger.
- Accept a suggestion. The completed slash token gets a highlight in the editor.
- No change to pi core. The extension uses a custom editor and a provider wrapper.

## Keys in the slash menu

Mid-text, the menu keys change:

| Key | Action |
|-----|--------|
| Tab | Accept the suggestion |
| → | Accept the suggestion |
| Enter | Close the menu. Does not accept. Does not submit. |

At line 0, pi's native keys stay unchanged.

## How it works

- `editor.ts` — `SlashSuggestEditor` extends `CustomEditor`. It overrides three gating methods: the cursor-line gate, the word-boundary check, and the slash-context check. It also adds the highlight in `render()` and the key rewriting in `handleInput()`.
- `provider.ts` — wraps the autocomplete provider. For a mid-text slash token, it gives the base provider a line-start view of the token. It owns `applyCompletion` for mid-text tokens: it inserts `/value` plus one separating space.
- `highlight.ts` — pure string transform. It wraps completed slash tokens in ANSI styles. A token is completed when whitespace or end-of-line follows it.

## Install

Symlink the extension into the pi agent directory:

```bash
ln -s ~/workspace/sidehustle/pi-extensions/pi-slash-suggest ~/.pi/agent/extensions/pi-slash-suggest
```

Restart pi. Type text, then ` /` — the menu must open.

## Test

Tests live in the `pi-extensions` repo:

```bash
bun test tests/pi-slash-suggest.test.ts   # unit
bun run test:integration                  # headless pi
```

Then the manual check: open pi, type `hello /`, accept a suggestion, check the highlight.

## Risks

The editor overrides TS-private methods. A pi upgrade can break them. Confirmed against pi 0.85.1 (Homebrew runtime) and the pinned 0.84.3 types. Fallback: a one-line core patch in pi-tui `editor.js` — drop the `/` exclusion in `setAutocompleteTriggerCharacters` and relax `isSlashMenuAllowed`.

Key rewriting matches raw input sequences. User-rebound TUI keybindings are ignored in v1.
