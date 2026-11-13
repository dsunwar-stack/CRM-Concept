# Prototypes

Standalone, click-through HTML prototypes. No build step: open the file in a browser.

## `ccp-chat-prototype.html` — Amazon Connect CCP + EVEE assist

A chat agent's desktop: the CCP contact panel on the left, canned responses and history in the
middle, and the EVEE AI assistant on the right. All conversations are scripted locally; nothing
is sent anywhere.

**Logo:** save the brand logo as `prototypes/assets/logo.png`. Until then a plain placeholder
square is shown.

### Things to try

- **Chat with Nikki** (selected on load): type a greeting, ask for the transaction details, then
  offer a dispute. She answers in context, and the *Suggested Next Best Response* panel moves
  through its stages as the conversation progresses.
- **Use a suggestion or canned response:** *Use* (or clicking the response text) drops it into
  the chat box, ready to send. *Copy* copies it to the clipboard. `{name}` placeholders fill in
  with the current customer's first name.
- **Switch contacts:** Jane's opening message arrives in the background and shows an unread
  badge. Each contact keeps its own transcript, draft, suggestions and history.
- **Incoming chat:** about 25 seconds after load (while your status is *Available*), Sam Patel's
  chat rings in the queue. Accept or decline it.
- **EVEE IQA:** ask a question (or tap a quick question). Answer the clarification questions to
  get a refined answer, and open *Sources*.
- **Search and filter responses**, toggle **Available / Break / Offline**, **End Chat** then
  **Close Contact**, collapse the CCP panel, or drag its edge to resize.

## `Agent-AssistantforBank.html` — portfolio-safe copy

The same prototype with nothing traceable to a real employer, for sharing in a portfolio. Share
this file, never `ccp-chat-prototype.html`.

- Fictional bank (Meridian Bank), customers (Nina Ashby, Jo Marlow, Sam Okafor), merchant
  (Bramblemart, shown on statements as `BRMBL*MKTPLACE`) and references (`MB-DEMO-…`).
- UK only: £ amounts, UK dates and spelling, and generic "card scheme dispute rules" wording
  instead of named regulations.
- Labelled as a concept prototype in the footer. Suggestion cards have a front-end-only
  "Not helpful?" picker and example source chips.
- Runs fully offline: no fonts, scripts or other external requests, and no storage.

## `Agent-Assistant-2.html` — modern restyle

The portfolio-safe copy with a refreshed visual layer: Geist and Geist Mono (embedded),
a 4px spacing scale, white panels on a soft canvas, segmented tabs and Lucide line icons
throughout. Content, data and every interaction are the same as `Agent-AssistantforBank.html`,
and it still runs fully offline as one file. Safe to share.

## `Agent-Assistant-3.html` — reworked assist panel

Version 2 with the assist panel restructured for comparison:

- The right panel has two tabs. **Suggestions** holds a compact customer summary and the next
  best response, with **Use reply** as the main action and alternatives as one-tap options.
  **Ask Assist** is a chat-style thread: question, answer, clarifying questions inside the
  answer, then the refined answer as the next message.
- A dot on the Suggestions tab flags a new suggestion that arrives while you're in Ask Assist.
- A suggestion bar sits above the chat message box so the reply is next to where it's sent.
