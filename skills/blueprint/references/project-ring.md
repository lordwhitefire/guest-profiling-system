# Project Ring

The Project Ring is the work around the product, not the product itself. Version control, client talk, legal and handoff do not appear in any standard architecture model, so this part is Victor's own.

It has 12 Checklist areas. Mark each as Decided, Skip or Pending.

---

## Start of the project

- **01 Project setup**: name, client, deadline, budget, audience, currency, domain, hosting target, environments. The hosting and environment answers also feed the Engine (Runtime environment). Do this first.
- **75 Constraint identification**: list the real limits before any design decision: budget, hosting, outside-service limits, Nigerian context (payment providers, connectivity), the client's devices. Do this first.
- **32 Client communication**: what to ask the client before starting, how progress is shared, who approves designs, what the handoff looks like.

## While building

- **15 Version control**: branch names, commit format, review rules, release tags, protected main branch.
- **16 Development workflow**: linting, formatting, pre-commit checks, strict TypeScript, code review.
- **17 Testing**: what is tested, which kinds of tests, who runs them.
- **22 Naming conventions**: names for components, files, tables, functions, constants.
- **21 Documentation**: README, changelog, comments, API docs, a note for the next developer.
- **73 Progress tracking**: before any multi-step task write a checklist to a file, mark each step as it is finished, never lose progress.
- **74 Session recovery**: after any interruption reload all the rule files first, write a log after each meaningful action (what was done, what is next, what was decided).

## End of the project

- **20 Legal and compliance**: privacy policy, cookie banner, GDPR, terms, age limits.
- **33 Handoff and maintenance**: who maintains it after launch, credentials handoff, client training, the support period.

---

## Rules for this part

1. Do 01 and 75 before the Build Layers. Decisions in the Build Layers depend on them.
2. Keep 73 and 74 running the whole project, not just at the start.
3. The Project Ring never changes what the product does. If an item starts to change the product (for example a legal rule that needs a new screen), it belongs to a Build Layer or the Engine, so tell Victor.
