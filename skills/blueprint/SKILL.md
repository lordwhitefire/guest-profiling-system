---
name: blueprint
description: Victor's build model. Use at the start of ANY software project (website, web app, mobile or desktop app), when planning or reviewing a build, or when studying existing software. It gives the names for every part of a build, the order to work in, and the 80-area Checklist, so nothing is forgotten.
---

# Blueprint

Blueprint is the one model for everything about building software. Load it before you plan, build or review a project. Use its names exactly. Victor will refer to the parts by these names.

Explain in plain words before you implement anything. Do not start drafting or building while Victor is still thinking out loud.

## The names

| Name | What it is |
|---|---|
| **Blueprint** | The whole model. Everything below. |
| **Build Layers** | The four layers: **UI**, **Data**, **Business logic**, **Functionality**. Study order: UI → Data → Business logic → Functionality. Build order: Functionality → Business logic → Data → UI, after Victor confirms it. |
| **UX Thread** | UX. It is not a layer. It runs through every Build Layer and the Engine, and shapes each one. |
| **Engine** | How the product is built, run and protected. It comes after the Build Layers. It has 10 **Engine Parts**. |
| **Project Ring** | The work around the product: client, version control, legal, docs, handoff, progress tracking. It sits around everything. |
| **Checklist** | The 80 areas. In Plan mode every area ends as Decided, Skip or Pending; in Study mode as Seen, Not seen or Not applicable. |
| **Home** | The one place an area belongs. Every area has exactly one Home. |
| **Feature Card** | A short note that traces one feature through every part; in Study mode it also carries Evidence and Not seen. |

**Functionality is the feature list; the Feature Card is the unit that connects all the layers.**

The 10 Engine Parts: Architecture, Integration, Communication between parts, Runtime environment, Deployment, Configuration, Security, Reliability, Scalability, Resource management.

```
                UX Thread (touches everything)
  ┌───────────────────────────────────────────┐
  │  Build Layers:  UI → Data → Business      │
  │                 logic → Functionality     │
  └───────────────────────────────────────────┘
  ┌───────────────────────────────────────────┐
  │  Engine (10 parts)                        │
  └───────────────────────────────────────────┘
  Project Ring around everything.  Checklist = 80 areas.
```

The diagram shows the **study order**. The **build order** is the reverse: **Functionality → Business logic → Data → UI**, after Victor confirms it.

## Order

**Study order:** **UI → Data → Business logic → Functionality.** Use this when reading software someone else built: you see the UI first, then the data it shows, then the rules behind it, then the feature list.

**Build order:** **Functionality → Business logic → Data → UI.** Use this when building: decide what the user can do, then the rules, then what to store, then how it looks. The UX Thread runs through every step.

**Ask before using the build order.** Before the first build, ask Victor: "Build order: Functionality → Business logic → Data → UI. Confirm?" Do not use it until he answers. If he gives a different order, use his.

**Confirmed:** Victor confirmed this build order on 2026-11-08.

## Plan mode (starting or reviewing a build)

1. **Read the constraints first.** Do area 75 (constraints) and area 01 (project setup) before anything else. Money, hosting, connectivity and the client's devices decide what is possible.
2. **Pick the Checklist sections.** Sections A and E always apply. B applies only if the project sells products. C applies to web apps. D applies to mobile or desktop apps. Mark the rest Skip with a reason.
3. **Decide the decide-first areas** before the Data layer: 75 constraints, 49 multi-tenancy, 59 delete policy. They shape the whole database.
4. **Confirm the build order, then walk the Build Layers in it:** Functionality → Business logic → Data → UI. For each, load `references/build-layers.md` and answer its questions. Answer the UX Thread questions at the same time. If Victor has not confirmed the build order, stop and ask.
5. **Walk the Engine.** Load `references/engine.md` and answer each part.
6. **Handle the Project Ring.** Load `references/project-ring.md`.
7. **Mark every area** in `references/areas.md` as Decided, Skip or Pending. Nothing may stay unmarked.
8. **Write a Feature Card** for each feature that matters (template in `references/build-layers.md`).
9. **Report to Victor in plain words:** what is Decided, what is Pending, and what needs his call.

The study order is UI → Data → Business logic → Functionality. The build order is Functionality → Business logic → Data → UI, and it is used only after Victor confirms it. When you build, respect dependencies. If a lower layer needs something first, say so and ask.

## Study mode (reading existing software)

Use the **study order**: **UI → Data → Business logic → Functionality.** For each Build Layer, write what the software does (not its code). For the Engine, fill each part with evidence: a file name, or "not present". Where the truth lives: Data in the live database schema, Business logic in the code path that actually runs for a scenario, Engine in config and deploy files. Never guess. If you did not see it, write "not seen".

Mark every area as **Seen**, **Not seen** or **Not applicable**. "Not seen" is not a failure; it is the truth. In Study mode, every Feature Card also carries two lines: **Evidence** and **Not seen**.

## Rules

1. Use these names every time. Do not invent new ones.
2. Every one of the 80 areas has exactly one Home. Check by counting.
3. For every Build Layer, also answer its UX Thread questions.
4. In Plan mode, every area ends as **Decided**, **Skip** or **Pending**. In Study mode, every area ends as **Seen**, **Not seen** or **Not applicable**. Skip needs a reason; Not seen needs a note of what was missing.
5. If something does not fit the Blueprint, say so. Do not force it.
6. The Homes in `references/areas.md` are a starting point. If one looks wrong, tell Victor and propose a change. Do not change it quietly.
7. Write progress to a file as you go (area 73) so a dead session can resume (area 74).
8. Keep outputs in simple words.
9. Never use the build order until Victor confirms it. The study order is always UI → Data → Business logic → Functionality.

## Files

- `references/build-layers.md`: the four Build Layers, UX Thread questions, Feature Card template.
- `references/engine.md`: the 10 Engine Parts and a quality double-check.
- `references/project-ring.md`: the 12 Project Ring areas.
- `references/areas.md`: all 80 areas with their Home and Touches, plus the gap questions.
