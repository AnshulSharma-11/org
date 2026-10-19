# ORGPLUS Assistant

A built-in help assistant for visitors, employees and HR. It runs **entirely in the browser**:
no server, no API key and no per-message cost, so usage is unlimited.

| File | Purpose |
|------|---------|
| `Chatbot.jsx` | The floating button, chat panel and the route layout that mounts it on every page |
| `chatbot.css` | Styles (uses the shared light / dark theme tokens) |
| `engine.js` | Language understanding: synonyms, typo correction, weighted phrase matching |
| `knowledge.js` | **All the questions and answers** (the part you will edit most) |
| `dataAnswers.js` | Live look-ups ("my leave balance", "pending leave requests") using the logged-in user's own API access |
| `assistant.js` | Ties it together: picks the best answer, handles "take me to…" navigation |

## Teach it a new answer
Add an object to `INTENTS` in `knowledge.js`:

```js
{
  id: 'emp_my_topic',
  roles: ['employee'],                       // or ['hr'], ['guest'], '*'
  phrases: ['how do i do x', 'steps for x', 'where is x'],   // 5–10 ways people might ask
  run: (c) => ({
    text: 'Step 1 …\n\n- point **one**\n- point two',
    links: [{ label: 'Open page', to: `/employee/${c.employeeId}/somewhere` }],
    chips: ['Related question'],
  }),
}
```
Tips: write phrases the way people really type; add a few rewordings. Avoid one-word phrases.
Synonyms (e.g. *holiday → leave*) live at the top of `engine.js`.

## Add a live-data answer
Write an async function in `dataAnswers.js` (use `fetchAll` / `fetchObject` and the `L` loaders; results are
cached for 45 s), export it in `DATA`, then point an intent's `run` at it.

## Good to know
* It answers about ORGPLUS and the signed-in user's own data. It is not a general-purpose AI.
* Conversations are kept in `sessionStorage` per user and wiped on sign-out.
* Hidden when printing.
