# Kafka UI Frontend Localization Design

## Overview

This spec defines a frontend-only localization implementation for the React app in `kafka-ui-react-app`.

The goal is to support runtime switching between English and Simplified Chinese for:

- navigation and shared UI text
- page-level labels and actions
- empty states and confirmation dialogs
- frontend-generated notifications and validation messages

This work explicitly excludes backend-returned raw error messages. Those messages will continue to display as returned by the server.

## Goals

- Detect the initial locale from the browser on first visit.
- Allow the user to switch languages from the top navigation bar.
- Persist the user-selected locale in `localStorage`.
- Centralize UI text into locale dictionaries instead of hardcoded component strings.
- Support English fallback for missing Chinese translations.
- Keep the implementation lightweight and aligned with existing app patterns.

## Non-Goals

- No backend-driven localization.
- No URL-based locale routing.
- No pluralization engine or ICU message formatting in the first version.
- No rich-text translation framework in the first version.
- No support for locales beyond `en` and `zh-CN`.

## Constraints And Existing Context

- The frontend currently has no i18n framework.
- UI copy is primarily hardcoded across React components.
- The app already uses React context for cross-cutting state such as theme mode.
- The top navigation in `src/components/NavBar/NavBar.tsx` is the preferred location for the locale switcher.
- The app root in `src/index.tsx` is the correct place to attach a global locale provider.

## Options Considered

### Option 1: Lightweight In-App Dictionary

Create a `LocaleProvider`, locale dictionaries, and a `t()` helper maintained inside the app.

Pros:

- Small dependency footprint
- Fits the current codebase structure
- Easy to reason about and test
- Low migration overhead

Cons:

- Advanced i18n features would need future incremental work

### Option 2: `react-i18next`

Adopt a standard third-party i18n stack.

Pros:

- Mature ecosystem
- Strong support for advanced formatting and future scale

Cons:

- Larger integration surface
- More setup and test churn for a codebase that currently has no localization foundation
- Overweight for the current scope

### Option 3: Global Translation Utility Without Provider

Use a global locale variable and translation helper without React context.

Pros:

- Minimal code to start

Cons:

- Poor reactivity for runtime switching
- Weaker integration with component rendering
- Harder to maintain cleanly

## Decision

Adopt Option 1: a lightweight in-app dictionary implementation.

This approach is the best fit for the current repository because it solves the immediate product need without turning the work into an i18n framework migration. It also matches the existing use of React context and keeps the code understandable for future contributors.

## Architecture

### Locale State

Introduce a `LocaleProvider` responsible for:

- selecting the initial locale
- persisting a user override
- exposing the active locale
- exposing `setLocale(locale)`
- exposing `t(key, params?)`

Locale resolution order:

1. `localStorage` saved locale, if present
2. browser locale from `navigator.language` / `navigator.languages`
3. fallback to `en`

Chinese browser variants such as `zh`, `zh-CN`, and `zh-Hans` resolve to `zh-CN`. All other unmatched locales resolve to `en`.

### Locale Resources

Store locale resources in:

- `src/locales/en.ts`
- `src/locales/zh-CN.ts`
- `src/locales/types.ts`

English is the source-of-truth dictionary. Chinese must follow the same key structure.

If a Chinese key is missing, `t()` falls back to the English value and logs a development warning.

### Translation API

Provide a small translation layer in `src/lib/i18n.ts` or equivalent:

- `detectBrowserLocale()`
- `translate(locale, key, params?)`
- simple parameter interpolation such as `{topicName}`
- fallback handling

The first version only supports plain text and simple interpolation.

### UI Integration

Wrap the React app with `LocaleProvider` in `src/index.tsx`.

Add a locale switcher to the top navigation in `src/components/NavBar/NavBar.tsx`, positioned alongside the existing theme selector.

Use the existing `Select` component for consistency unless it introduces a concrete usability issue.

## Directory Layout

Planned additions:

- `src/components/contexts/LocaleContext.tsx`
- `src/locales/en.ts`
- `src/locales/zh-CN.ts`
- `src/locales/types.ts`
- `src/lib/i18n.ts`

## Translation Key Strategy

Keys are organized by domain, not by file name, so that component moves do not force translation key churn.

Examples:

- `common.actions.save`
- `common.actions.cancel`
- `navbar.language`
- `navbar.theme.auto`
- `topics.list.columns.partitions`
- `topics.notifications.clearSuccess`
- `schemas.empty.noSchemas`

## Scope Of Text Migration

Included:

- top navigation and sidebar
- common shared UI
- page-level labels and actions
- forms and placeholders
- dialogs and confirmation copy
- empty states
- frontend-generated notifications
- frontend-generated validation messages

Excluded:

- backend-returned raw error strings
- API payload content originating from Kafka or backend systems

## Migration Strategy

The rollout should happen incrementally to keep the app stable and reviewable.

Phase 1:

- locale infrastructure
- root provider integration
- top nav locale switcher
- shared/common copy
- error page
- confirmation modal
- common notifications

Phase 2:

- core pages: Topics, Consumer Groups, Brokers, Schemas, Connect, KsqlDB

Phase 3:

- remaining scattered strings
- placeholders
- tooltips
- table headers
- test cleanup

Do not implement bilingual branching directly inside components. Components should consume translated text via `t()`.

## Testing Strategy

Add or update tests for:

- browser locale detection
- `localStorage` precedence over browser locale
- English fallback when a Chinese key is missing
- interpolation behavior
- navigation language switch interaction
- persistence across refresh

Existing tests that assert English text directly should be updated to:

- either render under an explicit English locale provider
- or assert using the locale resource values

At least one integration-oriented test should cover:

- browser locale resolves to Chinese by default
- user switches to English
- reload preserves English

## Risks And Mitigations

### Risk: Missed hardcoded strings

UI text is currently distributed across many components.

Mitigation:

- use `rg` to identify JSX string literals and notification messages
- migrate page by page
- keep translation warnings enabled in development

### Risk: Test churn

Many tests currently assert literal English strings.

Mitigation:

- update tests alongside each migration batch
- centralize expected copy where practical

### Risk: Mixed-language UX

Backend errors will remain in their original language, which can lead to a mixed-language interface.

Mitigation:

- document this as an intentional boundary
- localize all frontend-owned messages to minimize inconsistency

## Acceptance Criteria

- First visit respects browser locale and resolves Chinese browsers to `zh-CN`.
- Users can switch language from the top navigation.
- Chosen language persists across reloads.
- Shared UI and core pages support English and Simplified Chinese.
- Frontend-generated notifications and validation messages support both locales.
- Missing Chinese keys fall back to English without breaking rendering.
- Backend raw error text remains unchanged.

## Open Implementation Notes

- Prefer ASCII in keys and code; Chinese is only stored in locale resource values.
- Keep the initial implementation synchronous and bundle-based; no lazy locale loading is required.
- Reuse existing UI patterns and avoid introducing unrelated refactors.
