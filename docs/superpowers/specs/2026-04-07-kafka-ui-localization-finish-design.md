# Kafka UI Localization Finish Design

## Goal

Finish the remaining frontend localization work on the `localization-zh-cn` branch so the React app is usable as a Chinese UI without frequent English leakage.

This design covers only frontend-owned copy that is still hardcoded in English. It does not change the localization architecture and does not attempt backend-driven i18n.

## Scope

This pass includes:

- shared table copy such as empty states and pagination
- remaining page-level English strings in dashboard, topic filters, connect config, live consume, and KSQL flows
- frontend validation messages in shared form schemas
- supporting tests for the highest-risk localized paths

This pass excludes:

- backend-returned raw error messages
- test-only mock strings
- icon metadata and non-user-facing accessibility internals unless they are visible to users
- broad refactors of the existing i18n layer

## Design

Keep using the current lightweight dictionary approach:

- add new translation keys to `kafka-ui-react-app/src/locales/en.ts`
- add matching Chinese translations to `kafka-ui-react-app/src/locales/zh-CN.ts`
- replace remaining high-impact hardcoded strings with `t(...)`

No new i18n dependency or locale abstraction is introduced.

## Change Areas

### Shared Components

Localize remaining reusable UI copy that can leak across many pages:

- `components/common/NewTable/Table.tsx`
- any shared components surfaced by the targeted scan

This is the highest-value cleanup because one shared component affects multiple screens.

### Page And Flow Cleanup

Localize known residual English strings in:

- dashboard badges and labels
- topic message filter edit/info flows
- live consume and KSQL progress toasts
- connect config warning and submit flow

### Validation Messages

Move remaining frontend validation strings into locale dictionaries for:

- `lib/yupExtended.ts`
- `widgets/ClusterConfigForm/schema.ts`

The goal is consistent Chinese UX for form errors, while preserving the same validation rules and behavior.

## Testing Strategy

Use TDD for each targeted area:

- add failing tests for shared table copy and one or two high-impact user flows
- verify the failures are caused by missing localization
- implement the minimal translation changes
- rerun focused tests

At minimum, verify:

- locale utilities/provider tests still pass
- new or updated UI tests cover shared table pagination/empty states
- targeted tests cover residual-English hotspots fixed in this pass

## Risks And Constraints

- Some strings found by grep are not user-facing copy; avoid over-localizing identifiers, enum values, and implementation constants.
- Validation schemas currently hold literal English strings; converting them must not change validation semantics.
- Backend error text will still appear in English where the frontend only forwards server responses.

## Completion Criteria

This pass is complete when:

- the major user-visible English leftovers identified in the review are removed
- English and Chinese locale files remain key-aligned
- focused tests pass on the localization branch
- the app no longer shows frequent English leakage during normal Chinese usage
