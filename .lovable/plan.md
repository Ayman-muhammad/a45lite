# Finish Document Studio

## Build
- Add a dedicated `/documents` workspace for pasting source context and selecting document type, tone, and visual theme.
- Connect generation to the existing authenticated AI document service, with clear progress and actionable error states.
- Show the generated document outline and enable professional PDF download using the existing renderer.
- Add Document Studio to desktop and mobile navigation without crowding narrow phone layouts.

## Verification
- Confirm route metadata and navigation are complete.
- Run targeted type checks and inspect the current build result.
- Test the generation interface and PDF download path in the live preview.

## Technical details
- Keep AI calls server-side and preserve private generation history.
- Reuse the existing validated document schema, theme definitions, and PDF engine.
- Use the app’s existing semantic styles and phone-safe layout patterns.
