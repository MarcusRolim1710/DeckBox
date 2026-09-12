<!--
Sync Impact Report — DeckBox Constitution Amendment
- Version change: 0.0.0 (uninitialized/template) → 1.0.0 (initial ratification)
- Modified principles: [all placeholders] → 5 concrete principles (see below)
- Added sections:
  - Core Principles: I. Collection Valuation Integrity (NON-NEGOTIABLE)
  - Core Principles: II. API-Verified Card Identity
  - Core Principles: III. Album-First User Experience
  - Core Principles: IV. Simplicity & Local-First Data Ownership
  - Core Principles: V. Quality, Testing & Observability (NON-NEGOTIABLE)
  - Technology & Domain Constraints
  - Development Workflow & Quality Gates
- Removed sections: none (template placeholders replaced)
- Follow-up TODOs:
  - TODO(API_SELECTION): Confirm YGOPRODeck vs alternative; validate coverage for all required set codes. To be resolved in first feature spec (/speckit.specify for Nova Carta).
  - TODO(CURRENCY_POLICY): Decide USD vs BRL display and conversion source/rate cadence.
  - TODO(PLATFORM_TARGET): Confirm delivery target — mobile, web, or both (e.g., PWA/React Native/Flutter) — before scaffolding.
  - TODO(AUTH_SCOPE): Confirm MVP is single-user local-only vs. login/multi-user.
  - TODO(DUPLICATE_RULE): Finalize whether duplicates show as one card with counter vs. one tile per copy.
  - Deferred open points from briefing (favorites interaction, filters/search, edit/remove, valuation granularity, charts) to be specified per-feature, not in constitution.
-->

# DeckBox Constitution

## Core Principles

### I. Collection Valuation Integrity (NON-NEGOTIABLE)
The central promise of DeckBox is the automatic, accurate summation of the user's collection value. Every decision MUST preserve deterministic, auditable valuation.

- Valuation MUST be computed as `SUM(price_effective * quantity)` across all collection entries. The calculation MUST be pure, reproducible, and covered by unit tests.
- Each collection entry MUST persist `priceAtAcquisition` (price returned by API at time of add) and `currentPrice` (last synced price). `currentPrice` MAY be refreshed from the API; `priceAtAcquisition` MUST be immutable after creation.
- Currency MUST be explicit. The stored currency and display currency MUST be defined in the spec (default assumption: API returns USD). If BRL display is required, conversion rate source, timestamp, and rounding rules MUST be specced and tested.
- Quantity MUST be a positive integer (`>=1`). Adding a duplicate code MUST increment quantity or be explicitly rejected by spec — never silently create an ambiguous duplicate record.
- The Valores screen MUST always be able to explain its total (itemized breakdown). A total that cannot be traced to line items is non-compliant.

*Rationale*: Without trustworthy valuation, the product has no differentiation. Integrity here is load-bearing for user trust.*

### II. API-Verified Card Identity
A card's identity is its set code, not free-text. All card metadata MUST originate from a single verified external source of truth.

- User input for Nova Carta MUST be the canonical Yu-Gi-Oh code (`SET-NUMBER`, e.g., `LOB-001`). Normalization (trim, upper-case, hyphen handling) MUST be specced.
- On submission, the system MUST query the chosen card API (initial candidate: YGOPRODeck; final choice fixed in spec) and hydrate `name`, `imageUrl`, and `price` from the response. Manual entry of these fields is FORBIDDEN in MVP except for a specced fallback when the code is not found.
- When the code is not found, the system MUST show an explicit error state and MUST NOT create a partial record without user confirmation via the defined fallback flow.
- Image is MANDATORY for persistence. A card entry without a resolvable image URL MUST NOT be saved unless the spec explicitly allows placeholder imagery.
- Price absence from API MUST be handled explicitly: store `null` with a defined display/sum rule (e.g., excluded from total with warning), never as `0` silently.
- API contract MUST be covered by integration/contract tests (success, not-found, missing-price, malformed response).

*Rationale*: Code-as-identity prevents duplicates and typos, and API verification guarantees that image/price data is real and current.*

### III. Album-First User Experience
DeckBox is a digital binder, not a marketplace or deck-builder. Navigation and presentation MUST reinforce the album metaphor and stay minimal.

- MVP navigation MUST consist of exactly three top-level destinations: `Home`, `Valores`, `Nova Carta`. Adding or renaming a top-level item requires a constitution amendment or an explicit spec exception with justification.
- `Home` MUST contain two sections: (1) a horizontally scrollable favorites carousel and (2) a grid (album) of all cards in the collection. An empty collection MUST show a defined empty state, not a blank screen.
- Each grid cell MUST display at minimum the card image. Additional summary (name, price, quantity badge) is allowed only when specced and MUST not degrade grid performance or legibility.
- Favorite status is a boolean on the collection entry (`isFavorite`). The interaction to toggle it (e.g., star/heart on card detail or album tile) MUST be defined in spec and be reachable in no more than two taps/clicks.
- Filtering and search (by name, rarity, type, value) are NOT required for MVP but any implementation MUST be additive and MUST NOT alter the default album ordering without spec.
- Duplicate representation MUST be consistent: either (a) one tile per unique code with a quantity counter/badge, or (b) one tile per physical copy — the choice MUST be fixed in spec and applied uniformly. Mixing strategies is FORBIDDEN.

*Rationale*: Constraint on navigation and layout keeps the product focused and recognizable as a collector's album.*

### IV. Simplicity & Local-First Data Ownership
Start simple. Prefer local, single-user ownership and the smallest data model that satisfies the briefing.

- For MVP, persistence MUST be local-first (e.g., local storage / SQLite / IndexedDB depending on platform). Multi-user, login, or cloud sync is OUT OF SCOPE unless a spec explicitly elevates it — then data isolation and ownership rules MUST be specced.
- The canonical collection entry model MUST contain at minimum: `code` (string, unique key), `name` (string), `imageUrl` (string), `priceAtAcquisition` (number|null + currency), `currentPrice` (number|null + currency), `quantity` (integer >=1), `isFavorite` (boolean), `addedAt` (ISO-8601 timestamp). Additional fields (rarity, type, set name) MAY be added only when a consuming feature requires them.
- Business logic (valuation, quantity handling, favorite toggling) MUST live in testable domain/service modules, not embedded in UI components.
- Deletion and editing (quantity/favorite) MUST be specced before implementation; if unsupported in MVP, the UI MUST not expose affordances that imply they exist.
- No speculative features. YAGNI applies: top-10 most valuable, average price, historical charts, and evolution graphs are future enhancements — they MUST NOT be built without a spec.

*Rationale*: A minimal, well-tested core ships faster and leaves room to validate the valuation promise before adding complexity.*

### V. Quality, Testing & Observability (NON-NEGOTIABLE)
No feature ships without proof it works as specced.

- Tests MUST be written before or alongside implementation and MUST cover: valuation arithmetic, quantity/favorite mutations, API success/not-found/price-missing paths, and empty-collection states.
- Integration/contract tests are MANDATORY for the card API boundary. Mock the API in unit tests, but run at least one suite against a realistic fixture or recorded response.
- All user-visible errors (invalid code, API failure, missing price/image) MUST produce an observable, testable user-facing message — silent failure is FORBIDDEN.
- Structured logging or equivalent observability for API calls (code requested, latency, success/failure, price returned) SHOULD be present to diagnose pricing issues without exposing secrets.
- Performance budget: Home grid MUST remain responsive up to a specced collection size (e.g., 500+ cards). Any virtualization or pagination decision MUST be documented in spec and verified.

*Rationale*: Valuation and API dependencies are failure-prone; discipline here prevents silent data corruption.*

## Technology & Domain Constraints

- **API Selection**: The spec for Nova Carta MUST name the chosen card API, document its base URL, rate limits, price field semantics (e.g., `card_prices[0].cardmarket_price` vs. `tcgplayer_price`), and set-code coverage. Switching APIs requires a spec update and contract-test refresh.
- **Currency & Pricing**: If BRL display is required, the spec MUST define conversion source (e.g., FX API or daily rate table), update cadence, rounding, and whether stored prices remain in USD. Do not assume conversion without spec.
- **Platform Target**: Until `TODO(PLATFORM_TARGET)` is resolved, implementation MUST NOT assume a platform-specific capability (e.g., native file system, push notifications) that would lock out web or mobile. Spec MUST declare target(s): web, mobile (React Native/Flutter), or both, and the persistence mechanism accordingly.
- **Security & Privacy**: Collection data is user-owned. No card data or collection totals may be transmitted to third parties beyond the card API query (code only). If auth/cloud sync is added, specs MUST address data isolation and transport security.
- **Accessibility & Internationalization**: UI text is Portuguese (pt-BR) by default per briefing. Any i18n or currency formatting MUST use locale-aware formatters and be tested for `pt-BR` and `en-US` price display.
- **Error Handling**: Network/API failures MUST be surfaced with retry affordance. The app MUST remain usable (read-only album + last-known prices) when offline after initial sync.

## Development Workflow & Quality Gates

- **Spec-Driven Delivery**: Work MUST follow the Spec Kit flow: `constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement`. No code for a new capability without an approved spec and plan.
- **Review Gates**: Every pull request MUST verify constitution compliance in its description (which principle(s) it touches and how). PRs that add a top-level route, change the data model, or alter valuation logic MUST call out the impact explicitly.
- **Branching & Versioning**: Semantic versioning applies (`MAJOR.MINOR.PATCH`): MAJOR for incompatible principle removal/redefinition, MINOR for new principle or materially expanded guidance, PATCH for clarifications. Constitution version is independent of app version but MUST be bumped on every governance change.
- **Definition of Done** for any feature touching collection or valuation:
  1. Spec approved with open points from briefing resolved or explicitly deferred.
  2. Unit + integration/contract tests passing (valuation, API boundary, empty/error states).
  3. Manual verification of Home (carousel+grid), Nova Carta (code→API→confirm→save), and Valores (itemized total) flows.
  4. No unexplained constitution `TODO` remains for that feature's scope.
- **Simplicity Check**: If a proposed implementation adds complexity without a spec requirement (e.g., new state library, new backend service), the PR MUST justify it or be rejected.

## Governance

This constitution is the single source of truth for DeckBox product and engineering governance. It supersedes all other practices, briefings, and ad-hoc decisions where conflicts arise. The briefing document (`DeckBox_Briefing.md`) is the product vision input; this constitution is the enforceable rule set derived from it.

- **Amendment Procedure**: Any change to principles, navigation structure, data model invariants, or valuation rules MUST be proposed as a constitution amendment (PR against `.specify/memory/constitution.md`) with a Sync Impact Report, rationale, and migration plan if behavior changes. Approval requires maintainer review.
- **Versioning Policy**: Governed by semantic versioning as defined in Workflow. `Ratified` is the original adoption date; `Last Amended` is the date of the latest merged amendment. Both use `YYYY-MM-DD` ISO format.
- **Compliance Review**: Every spec, plan, and PR review MUST check compliance with the five core principles. Non-compliant work MUST be flagged and blocked until resolved or an explicit, time-boxed exception is recorded in the spec.
- **Runtime Guidance**: Dependent templates and commands read this constitution at runtime. They are not modified by constitution amendments. Day-to-day guidance for agents lives in `.specify/memory/constitution.md` (this file); template sources remain untouched.
- **Deferral Policy**: Open points listed as `TODO` in the Sync Impact Report are not governance gaps — they are planned spec decisions. They MUST be resolved in the relevant feature spec before implementation.

**Version**: 1.0.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-12
