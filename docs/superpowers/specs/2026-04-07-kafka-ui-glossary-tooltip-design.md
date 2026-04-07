# Kafka UI Glossary Tooltip Design

## Goal

Add a usable and low-risk glossary tooltip mechanism for high-frequency Kafka terms in the Chinese UI: the page keeps the current Chinese (or existing mixed) display, and hover can show the English original.

## Scope

This pass includes:

- a reusable `GlossaryTerm` component built on the existing tooltip interaction model
- a curated high-frequency term list (not full-site exhaustive)
- integration in high-traffic pages already touched by localization work:
  - Dashboard
  - Topics list/details/messages/statistics
  - Consumer Groups list/details
  - Brokers list/configs
  - Connect details
- focused tests for the shared component and at least one integrated page path

This pass excludes:

- automatic full-site text scanning/replacement
- global parser/token syntax in locale dictionaries
- replacing backend response text or user data values
- tooltip wrapping in code snippets, raw config values, IDs, or enum payload values

## Requirements

### Functional

- Hover over selected Kafka terms should show a tooltip with the English original.
- The visible inline text must remain unchanged from the current page copy unless explicitly adjusted for glossary consistency.
- Tooltip behavior must be consistent with existing app tooltip behavior (hover trigger, placement style, no modal behavior).

### Non-Functional

- No change to existing `t(...) -> string` i18n contract.
- No regression in current localization tests.
- Incremental adoption: pages can opt in term-by-term.

## Design

### 1. Shared Glossary Component

Create a lightweight component (e.g., `GlossaryTerm`) that:

- accepts `children` (rendered visible text)
- accepts `english` (tooltip content)
- reuses existing tooltip UI/interaction pattern
- supports optional `placement`

This keeps glossary behavior explicit and easy to review in code.

### 2. Term Source

Create a small glossary map/module for the first-phase terms, including at minimum:

- Broker
- Topic
- Partition
- Offset
- Consumer Group
- Replication Factor
- In-Sync Replicas / ISR
- Segment
- Serde
- Connector
- KSQL
- ACL

The source should expose stable identifiers so pages can request terms without duplicating English originals in many files.

### 3. Integration Pattern

For each selected page area:

- wrap target label fragments with `GlossaryTerm`
- avoid wrapping values from data payloads
- avoid wrapping long paragraphs; apply to concise labels/titles/metrics/table headers

Examples of expected style:

- `Broker 数量` -> keep text; `Broker` part is hoverable with tooltip `Broker`
- `消费积压` (if chosen for glossary mapping) can show `Consumer Lag`

## Testing Strategy

Use TDD for the feature and integration.

- Unit test: `GlossaryTerm` renders visible text and reveals English content on hover.
- Integration test: one representative page test asserts term tooltip appears in Chinese locale.
- Regression tests: run existing localization-focused suites already used in this branch.

## Risks And Mitigations

- Over-wrapping causes noisy UI: mitigate by limiting first pass to high-frequency labels only.
- Inconsistent terminology across pages: mitigate with one glossary source module.
- Tooltip clutter on dense tables: mitigate by selecting only key headers/metric labels in this phase.

## Completion Criteria

This work is complete when:

- shared glossary tooltip component exists and is tested
- first-phase high-frequency terms are integrated in the scoped pages
- focused tests pass
- audit confirms hover-to-English behavior is present for integrated terms and absent where explicitly out of scope
