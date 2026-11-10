# Build Layers

**Study order:** **UI → Data → Business logic → Functionality.** Use this when reading software someone else built.

**Build order:** **Functionality → Business logic → Data → UI.** Use this when building. **Do not use the build order until Victor confirms it.** If he has not confirmed it, stop and ask.

**Confirmed:** Victor confirmed this build order on 2026-11-08.

The sections below are in study order. To build, read them in the build order. Example used throughout: **cancel a booking**.

For each layer: what it is, the questions to answer, and the UX Thread question to ask while you are there.

---

## 1. UI

What the user sees: layout, colours, type, buttons, motion.
Example: the "Cancel booking" button and its confirm dialog.

Questions:
- What screens exist?
- What components are needed, and which can be shared?
- What are the colours, type, spacing, corners and shadows? (areas 03, 79)
- Is there dark mode?
- What does it look like on a phone, a tablet and a wide screen? (09)
- Which browsers must it work in? (10)
- Where do images and icons come from? (12)
- What moves, and how much? (23)

UX Thread question: for every screen, what does it look like when it is empty, loading, failed and successful?

Checklist areas that live here: 03, 04, 09, 10, 12, 23, 79.

---

## 2. Data

What is stored: the things, how they connect, and what happens to them over time.
Example: the booking record, its status, and who owns it.

Questions:
- **D1** — What are the main things stored? (For a hotel: guest, room, booking, bill.)
- **D2** — How do they connect? (One booking has one guest. One room has many bookings.)
- **D3** — Which fields are required? Which must be unique?
- **D4** — What kind of ID does each thing get?
- **D5** — What states can each thing be in, and in what order?
- **D6** — Who owns each record?
- **D7** — What can never change after it is created?
- **D8** — What is stored, and what is worked out when needed?
- When a record is deleted, is it gone or hidden? (59)
- How is it separated between customers or organisations? (49)
- Are times stored in UTC and shown local? (62)
- What actions are logged? (52)
- **D9** — How will the shape of the data change later?

UX Thread question: what does the user see when there is no data yet, or the data is slow to load?

Checklist areas that live here: 49, 52, 59, 62. The Checklist asks little about Data. The questions marked **D1–D9** above are the extra gap questions, listed in `references/areas.md`. The questions with area numbers belong to those areas.

---

## 3. Business logic

The rules: when something may happen, how a number is worked out, who is allowed.
Example: "A booking can be cancelled free until 24 hours before check-in. After that, one night is charged."

Questions:
- What are the rules, written as "when X, then Y"?
- Who is allowed to do each action?
- What numbers are calculated (price, tax, shipping, discount)? Show the formula.
- What limits exist (stock, dates, amounts)?
- What happens when two rules conflict?
- What happens when something goes wrong halfway (money taken, booking not saved)?
- Where does each rule live? It must live in one place only.
- What are the exceptions?

UX Thread question: when a rule says no, how does the user find out why, in plain words?

Checklist areas that live here: 36, 38, 39, 40, 54, 60.

---

## 4. Functionality

What the user can do: the feature list.
Example: "A guest can cancel a booking."

Questions:
- Who are the kinds of users?
- For each kind, what can they do? Write each as "A [user] can [do something]".
- Which features are must-have, and which can wait?
- For each feature, which UI, Data and Business logic does it need? (Fill a Feature Card.)

UX Thread question: how many steps does each feature take, and where might a user get lost?

Checklist areas that live here: 07, 34, 35, 37, 41, 42, 44, 46, 47, 48, 50, 51, 53, 55, 56, 67, 68, 71.

---

## Feature Card template

Fill one for each feature that matters. In **study mode**, add the two extra lines **Evidence** and **Not seen**.

```
Feature:        (A guest can cancel a booking)
UI:             (the button and the confirm dialog)
UX Thread:      (two taps, a clear message, a refund note)
Data:           (booking status changes to "cancelled", the time is stored)
Business logic: (free until 24 hours before, then one night charged)
Engine:         (the refund runs as a background job, it retries on failure)
Evidence:       (the file, schema, request/response, or golden master that proves it)
Not seen:       (what could not be checked, and why)
```
