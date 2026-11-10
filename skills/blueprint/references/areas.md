# The 80 Areas and their Homes

The 80 areas come from Victor's `web-development-areas.md`. Each has exactly one Home.

**The Homes are a starting point. If one looks wrong, tell Victor and propose a change. Do not change it quietly.**

**Home** = the one place an area belongs. **Touches** = up to three other Homes this area affects; the Home owns the decision. `?` = unsure, to confirm with Victor.

Status for every area at the end of Plan mode: **Decided**, **Skip** (with a reason) or **Pending**. In Study mode: **Seen**, **Not seen** or **Not applicable**.

Sections: A applies to all projects. B only if the project sells products. C for web apps. D for mobile or desktop apps. E applies to all.

**Decide first:** 01, 75, 49, 59.

| # | Area | Section | Home | Touches |
|---|---|---|---|---|
| 01 | Project setup | A | Project Ring (hosting and environment answers also go to Engine: Runtime environment). Decide first | Engine: Runtime environment, Engine: Deployment, Data |
| 02 | Stack decisions | A | Engine: Architecture | UI, Engine: Deployment, Engine: Resource management |
| 03 | Design system | A | UI | UX Thread, Engine: Resource management |
| 04 | Brand and identity | A | UI | UX Thread, Functionality |
| 05 | Frontend architecture | A | Engine: Architecture | UI, Engine: Resource management, Engine: Runtime environment |
| 06 | Routing and navigation | A | UX Thread | UI, Functionality |
| 07 | SEO and discoverability | A | Functionality | UI, UX Thread, Engine: Deployment ? |
| 08 | Performance | A | Engine: Resource management | UI, Engine: Scalability, Engine: Reliability |
| 09 | Responsive and cross-device | A | UI | UX Thread, Engine: Resource management |
| 10 | Cross-browser compatibility | A | UI | UX Thread, Engine: Runtime environment |
| 11 | Accessibility | A | UX Thread | UI, Functionality |
| 12 | Assets and media | A | UI | Data, Engine: Resource management, Engine: Integration |
| 13 | Error handling | A | Engine: Reliability | UX Thread, UI, Engine: Communication between parts |
| 14 | Environment and configuration | A | Engine: Configuration | Engine: Deployment, Engine: Security, Engine: Runtime environment |
| 15 | Version control conventions | A | Project Ring | Engine: Deployment |
| 16 | Development workflow | A | Project Ring | Engine: Configuration, Engine: Deployment |
| 17 | Testing | A | Project Ring | Engine: Reliability, Engine: Deployment, Business logic |
| 18 | Deployment and DevOps | A | Engine: Deployment | Engine: Configuration, Engine: Runtime environment, Engine: Reliability |
| 19 | Monitoring and observability | A | Engine: Reliability | Engine: Deployment, Engine: Security, Engine: Scalability |
| 20 | Legal and compliance | A | Project Ring | UX Thread, Data, Engine: Security |
| 21 | Documentation | A | Project Ring | Functionality, Engine: Integration |
| 22 | Naming conventions | A | Project Ring | UI, Data, Business logic ? |
| 23 | Animation and interactions | A | UI | UX Thread, Engine: Resource management |
| 24 | Notifications and feedback | A | UX Thread | UI, Functionality, Engine: Communication between parts |
| 25 | Forms and validation | A | UX Thread | UI, Business logic, Data |
| 26 | Internationalization | A | UX Thread | UI, Data, Functionality |
| 27 | Offline and PWA | A | Engine: Reliability | UX Thread, Data, Engine: Resource management |
| 28 | Cookie and session management | A | Engine: Security | Data, UX Thread, Engine: Configuration |
| 29 | Redirect and URL management | A | UX Thread | UI, Engine: Deployment, Functionality |
| 30 | Code splitting and bundle size | A | Engine: Resource management | UI, Engine: Deployment |
| 31 | Backup and recovery | A | Engine: Reliability | Data, Engine: Deployment |
| 32 | Client communication | A | Project Ring | UX Thread, Functionality |
| 33 | Handoff and maintenance | A | Project Ring | Engine: Deployment, Engine: Configuration |
| 34 | Payment integration | B | Functionality | Business logic, Engine: Integration, Engine: Security |
| 35 | Product catalog | B | Functionality | Data ?, Business logic, UI |
| 36 | Inventory management | B | Business logic | Data, Functionality, Engine: Communication between parts |
| 37 | Cart and checkout | B | Functionality | Business logic, Data, UX Thread |
| 38 | Shipping and delivery | B | Business logic | Functionality, Data, Engine: Integration |
| 39 | Discount and promotions | B | Business logic | Functionality, Data |
| 40 | Order management | B | Business logic | Data, Functionality, Engine: Communication between parts |
| 41 | CMS integration | B | Functionality | Data, Engine: Integration, UI |
| 42 | Reviews and testimonials | B | Functionality | Data, UI, Business logic |
| 43 | Authentication and authorization | C | Engine: Security | Data, Business logic, UX Thread |
| 44 | User management | C | Functionality | Data, Business logic, Engine: Security |
| 45 | Onboarding flow | C | UX Thread | Functionality, UI, Data |
| 46 | Dashboard and data visualization | C | Functionality | UI, Data, Engine: Resource management |
| 47 | Real-time features | C | Functionality | Engine: Communication between parts, Engine: Scalability, UI |
| 48 | Notification system | C | Functionality | UX Thread, Engine: Integration, Engine: Communication between parts |
| 49 | Multi-tenancy | C | Data. Decide first | Engine: Architecture, Engine: Security, Business logic |
| 50 | File management | C | Functionality | Data, Engine: Integration, Engine: Security |
| 51 | Search and filtering | C | Functionality | Data, UI, Engine: Scalability |
| 52 | Audit logs and activity history | C | Data | Engine: Security, Engine: Reliability, Business logic |
| 53 | Import and export | C | Functionality | Data, Engine: Integration, UX Thread |
| 54 | Subscription and feature gating | C | Business logic | Engine: Security, Data, Functionality |
| 55 | Settings and configuration | C | Functionality | Data, Engine: Configuration, UX Thread |
| 56 | Admin panel | C | Functionality | UI, Engine: Security, Data |
| 57 | API design | C | Engine: Integration | Data, Business logic, Engine: Security |
| 58 | Background jobs and queues | C | Engine: Communication between parts | Engine: Reliability, Engine: Scalability, Business logic |
| 59 | Soft delete vs hard delete | C | Data. Decide first | Business logic, Engine: Security, Functionality |
| 60 | Collaboration features | C | Business logic | UX Thread, Engine: Communication between parts, Data |
| 61 | Webhooks (outgoing) | C | Engine: Integration | Engine: Communication between parts, Engine: Reliability, Engine: Security |
| 62 | Timezone and localization | C | Data | UX Thread, UI, Functionality |
| 63 | Rate limiting and abuse prevention | C | Engine: Security | Engine: Scalability, Engine: Reliability |
| 64 | Multi-step flows and wizards | C | UX Thread | UI, Functionality, Data |
| 65 | Platform targets | D | Engine: Architecture | UI, Engine: Deployment, Engine: Runtime environment |
| 66 | App store and distribution | D | Engine: Deployment | Engine: Configuration, Engine: Security |
| 67 | Push notifications (mobile) | D | Functionality | UX Thread, Engine: Integration, Engine: Configuration |
| 68 | Device features | D | Functionality | UX Thread, Engine: Security, Engine: Runtime environment |
| 69 | Offline mode (mobile) | D | Engine: Reliability | Data, UX Thread, Engine: Communication between parts |
| 70 | App updates | D | Engine: Deployment | Engine: Configuration, Engine: Reliability, UX Thread |
| 71 | Deep linking | D | Functionality | UX Thread, Engine: Integration |
| 72 | Performance (mobile specific) | D | Engine: Resource management | UI, Engine: Runtime environment, Engine: Reliability |
| 73 | Progress tracking | E | Project Ring | — |
| 74 | Session recovery | E | Project Ring | Engine: Reliability |
| 75 | Constraint identification | E | Project Ring. Decide first | Engine: Architecture, Engine: Runtime environment, Engine: Scalability |
| 76 | Scalability planning | E | Engine: Scalability | Engine: Architecture, Engine: Resource management, Data |
| 77 | Security | E | Engine: Security | Data, Engine: Configuration, Engine: Reliability |
| 78 | Landing page vs app shell | E | Engine: Architecture | UI, Functionality, Engine: Deployment |
| 79 | Design tokens and theming | E | UI | UX Thread, Engine: Resource management |
| 80 | Third party integrations | E | Engine: Integration | Engine: Security, Engine: Configuration, Engine: Reliability |

## Count by Home (must total 80)

| Home | Count |
|---|---|
| UI | 7 |
| UX Thread | 8 |
| Data | 4 |
| Business logic | 6 |
| Functionality | 18 |
| Engine | 25 |
| Project Ring | 12 |
| **Total** | **80** |

**Original checklist count: 80.** The gap questions are counted separately below.

Engine split: Architecture 4, Integration 3, Communication between parts 1, Runtime environment 0, Deployment 3, Configuration 1, Security 4, Reliability 5, Scalability 1, Resource management 3.

## Known gaps

- Data has only 4 areas. The extra Data questions are **D1–D9** (table below).
- Runtime environment has no area. The extra Runtime questions are **R1–R5** (table below).
- Communication between parts has one area. The extra Communication questions are **C1–C3** (table below).
- Areas 07 (SEO) and 35 (Product catalog) were hard to place. Check them.

## Gap questions — extras, not part of the 80

These are the gap questions from `build-layers.md` and `engine.md` — the ones with no area number of their own. They fill the three known gaps. They have their own count: they are not extra areas and do not change the 80.

| ID | Question | Home |
|---|---|---|
| D1 | What are the main things stored? | Data |
| D2 | How do they connect? | Data |
| D3 | Which fields are required? Which must be unique? | Data |
| D4 | What kind of ID does each thing get? | Data |
| D5 | What states can each thing be in, and in what order? | Data |
| D6 | Who owns each record? | Data |
| D7 | What can never change after it is created? | Data |
| D8 | What is stored, and what is worked out when needed? | Data |
| D9 | How will the shape of the data change later? | Data |
| R1 | Where does it run (browser, server, phone, serverless)? | Engine: Runtime environment |
| R2 | Which versions of the runtime are needed? | Engine: Runtime environment |
| R3 | What are the limits (memory, time per request)? | Engine: Runtime environment |
| R4 | What are the real conditions for the users: slow networks, power cuts, old phones? | Engine: Runtime environment |
| R5 | Which environments exist (dev, staging, production), and how do they differ? | Engine: Runtime environment |
| C1 | How do the parts talk (direct call, queue, events, shared database)? | Engine: Communication between parts |
| C2 | What happens if a message is late or lost? | Engine: Communication between parts |
| C3 | What happens if the same message arrives twice? | Engine: Communication between parts |
| **Total** | **17 gap questions** | **D 9, R 5, C 3** |

**Gap questions count: 17 (D 9, R 5, C 3).** These are extras, not areas, and are not part of the original 80.
