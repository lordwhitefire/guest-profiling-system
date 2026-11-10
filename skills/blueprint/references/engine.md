# Engine

The Engine is how the product is built, run and protected. It comes after the Build Layers. It is not a layer you build features in. It is what sits under all of them.

It has 10 Engine Parts. For each: what it is, the questions to answer, and the Checklist areas that live there.

The UX Thread question for the whole Engine: when something goes wrong or is slow, what does the user see?

Gap questions that have no area of their own are listed in `references/areas.md` with IDs D1–D9, R1–R5 and C1–C3.

---

## 1. Architecture
How the big parts are organised.
- What are the big parts (website, server, database, storage)?
- What is the stack? (02)
- How is the frontend organised? (05)
- Which platforms does it run on? (65)
- Is the public landing page separate from the app? (78)

Areas: 02, 05, 65, 78

## 2. Integration
How it connects to outside services.
- Which outside services does it use (payments, email, SMS, maps)? (80)
- Does it offer its own API? (57)
- Does it tell outside services when something happens? (61)
- For each service: account, keys, and a test mode ready before the build starts.

Areas: 57, 61, 80

## 3. Communication between parts
How the parts pass information to each other.
- **C1** — How do the parts talk (direct call, queue, events, shared database)?
- What runs in the background? (58)
- **C2** — What happens if a message is late or lost?
- **C3** — What happens if the same message arrives twice?

Areas: 58. This part has only one area. The extra gap questions are C1–C3, listed in `references/areas.md`.

## 4. Runtime environment
Where and under what conditions it runs.
- **R1** — Where does it run (browser, server, phone, serverless)?
- **R2** — Which versions of the runtime are needed?
- **R3** — What are the limits (memory, time per request)?
- **R4** — What are the real conditions for the users: slow networks, power cuts, old phones?
- **R5** — Which environments exist (dev, staging, production), and how do they differ?

Areas: none of its own. The extra gap questions are R1–R5, listed in `references/areas.md`. Area 01 asks about hosting and environments, but it sits in the Project Ring because the rest of it is about the project. Answer the hosting and environment questions of 01 here.

## 5. Deployment
How it is packaged, released and made available.
- How does new code reach users? (18)
- Is there a preview for each change?
- How do you roll back a bad release?
- For apps: store submission, signing, review time. (66)
- For apps: how are old versions updated or blocked? (70)

Areas: 18, 66, 70

## 6. Configuration
The settings that change how it behaves between environments.
- Which settings differ between dev, staging and production?
- Who can see the secrets?
- What is the plan when a key leaks?
- Can a feature be switched on or off without a new release? (14)

Areas: 14

## 7. Security
How it protects itself and its data.
- How do users prove who they are? (43)
- How long do sessions last, and how are cookies protected? (28)
- How are bots and abuse stopped? (63)
- Is everything on HTTPS? Is input cleaned? Are tokens stored safely? (77)
- Which data is sensitive, and how is it protected?

Areas: 28, 43, 63, 77

## 8. Reliability
How it keeps working and recovers from failures.
- What happens when a page or a call fails? (13)
- How do you know it is down or slow? (19)
- Does it work offline, and what happens when the connection returns? (27, 69)
- How often is data backed up, and can it be restored? (31)

Areas: 13, 19, 27, 31, 69

## 9. Scalability
How it copes with growth.
- How much traffic is expected at launch?
- When does the current stack break?
- What is the upgrade path?
- Are database indexes and a CDN planned? (76)

Areas: 76

## 10. Resource management
How it uses memory, processing power, storage and network.
- What are the speed targets? (08)
- How big can the code bundle be, and what is loaded only when needed? (30)
- For apps: start-up time, memory, battery, long lists. (72)

Areas: 08, 30, 72

---

## Quality double-check (ISO 25010)

After filling the 10 parts, check the product against this standard list of qualities. If one has no answer anywhere, you have a gap.

1. Functional suitability: does it do what is needed?
2. Performance efficiency: is it fast for the resources it uses?
3. Compatibility: does it work with other systems and share the same machine well?
4. Interaction capability: can the intended users operate it easily?
5. Reliability: does it keep working?
6. Security: is data protected from the wrong people?
7. Maintainability: can it be changed safely later?
8. Flexibility: can it be moved or adapted to other environments?
9. Safety: does it avoid causing harm?

Maintainability and Safety are not obvious in the 10 Engine Parts. Ask about them on every project.
