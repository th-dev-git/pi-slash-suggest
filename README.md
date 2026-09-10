<p>
  <img src="https://github.com/user-attachments/assets/341c5fcf-4974-4721-aa81-5793c0337dc3" alt="pi-slash-suggest" width="1100">
</p>

# pi-slash-suggest

`pi-slash-suggest` makes Pi's slash menu available in the middle of the editor, not only at the start of a line. Type normal text, press `/`, pick a command, and the completed slash token gets a persistent highlight.

<https://github.com/user-attachments/assets/526d5297-3bd0-4708-a0ec-59cea2795041>

## Install

```bash
pi install npm:pi-slash-suggest
```

That is the only required step. Pi loads the TypeScript extension directly; there is no build step and no Pi core patch.

## Try this first

Open Pi and type text before the slash:

```text
test slash /wa
```

The slash menu opens mid-line. Accept a suggestion with `Tab` or `→`:

```text
test slash /mattpocock-skills:wayfinder
```

Keep typing. The accepted slash token stays highlighted while the rest of the line remains normal text.

## How it works

Pi's native editor only exposes the slash menu in restricted contexts. This extension keeps Pi core untouched and changes behavior at the extension boundary:

- A custom editor relaxes the slash-menu gates for mid-text `/` tokens.
- A provider wrapper gives the base autocomplete provider a line-start view of the active token.
- Completion insertion is owned by the wrapper for mid-text tokens, so `/value` is inserted with one separating space.
- A pure highlight pass marks completed slash tokens when whitespace or end-of-line follows them.

At line start, Pi's native slash behavior stays unchanged.

## Slash menu keys

Mid-text, the menu keys are intentionally conservative:

| Key | Action |
|-----|--------|
| `Tab` | Accept the selected suggestion |
| `→` | Accept the selected suggestion |
| `Enter` | Close the menu without accepting or submitting |

At line 0, Pi's native keys stay unchanged.

## Implementation map

| File | Responsibility |
|------|----------------|
| `index.ts` | Extension entry point. Registers the custom editor and provider wrapper. |
| `editor.ts` | `SlashSuggestEditor`; cursor-line, word-boundary, slash-context, highlight, and key handling. |
| `provider.ts` | Autocomplete provider wrapper and mid-text completion insertion. |
| `highlight.ts` | Pure string transform for slash-token highlighting. |

## Test

Tests live in the parent `pi-extensions` repo:

```bash
bun test tests/pi-slash-suggest.test.ts   # unit
bun run test:integration                  # headless Pi
```

Manual check: open Pi, type `hello /`, accept a suggestion, then confirm the accepted token remains highlighted.

## Compatibility and risks

The editor overrides TypeScript-private methods. A Pi upgrade can break them.

Confirmed against:

- Pi `0.85.1` Homebrew runtime
- Pi `0.84.3` pinned types

Fallback: a one-line core patch in Pi TUI `editor.js` — remove the `/` exclusion in `setAutocompleteTriggerCharacters` and relax `isSlashMenuAllowed`.

Key rewriting matches raw input sequences. User-rebound TUI keybindings are ignored in v1.

## Repository

<https://github.com/th-dev-git/pi-slash-suggest>
