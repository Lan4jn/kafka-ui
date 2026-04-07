# Kafka UI Glossary Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover-triggered glossary tooltips for a selected high-frequency Kafka term set in Chinese UI labels, so users can see English originals without changing existing label display.

**Architecture:** Add a shared `GlossaryTerm` wrapper on top of the existing tooltip component, centralize English originals in one glossary map, and opt in page labels incrementally. Keep the current `t(...) -> string` contract unchanged.

**Tech Stack:** React, TypeScript, existing `Tooltip` (`@floating-ui/react`), Jest, React Testing Library

---

## File Map

### Create

- `kafka-ui-react-app/src/components/common/GlossaryTerm/GlossaryTerm.tsx`
- `kafka-ui-react-app/src/components/common/GlossaryTerm/index.ts`
- `kafka-ui-react-app/src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`
- `kafka-ui-react-app/src/lib/glossaryTerms.ts`
- `kafka-ui-react-app/src/components/ConsumerGroups/__tests__/List.spec.tsx`

### Modify

- `kafka-ui-react-app/src/components/Dashboard/Dashboard.tsx`
- `kafka-ui-react-app/src/components/Topics/List/TopicTable.tsx`
- `kafka-ui-react-app/src/components/Topics/Topic/Overview/Overview.tsx`
- `kafka-ui-react-app/src/components/ConsumerGroups/List.tsx`
- `kafka-ui-react-app/src/components/Brokers/BrokersList/BrokersList.tsx`
- `kafka-ui-react-app/src/components/Connect/Details/Overview/Overview.tsx`
- `kafka-ui-react-app/src/components/Dashboard/__tests__/Dashboard.spec.tsx`
- `kafka-ui-react-app/src/components/Topics/List/__tests__/TopicTable.spec.tsx`
- `kafka-ui-react-app/src/components/Brokers/BrokersList/__test__/BrokersList.spec.tsx`
- `kafka-ui-react-app/src/components/Connect/Details/Overview/__tests__/Overview.spec.tsx`

## Task 1: Add Shared GlossaryTerm Component

**Files:**
- Create: `kafka-ui-react-app/src/components/common/GlossaryTerm/GlossaryTerm.tsx`
- Create: `kafka-ui-react-app/src/components/common/GlossaryTerm/index.ts`
- Create: `kafka-ui-react-app/src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`

- [ ] **Step 1: Write the failing test**

`GlossaryTerm.spec.tsx`:

```tsx
import React from 'react';
import { render } from 'lib/testHelpers';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryTerm from 'components/common/GlossaryTerm';

describe('GlossaryTerm', () => {
  it('renders visible text and shows english original on hover', async () => {
    render(<GlossaryTerm english="Partition">分区</GlossaryTerm>);

    expect(screen.getByText('分区')).toBeInTheDocument();
    expect(screen.queryByText('Partition')).not.toBeInTheDocument();

    await userEvent.hover(screen.getByText('分区'));
    expect(screen.getByText('Partition')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`

Expected: FAIL because component does not exist.

- [ ] **Step 3: Write minimal implementation**

`GlossaryTerm.tsx`:

```tsx
import React from 'react';
import { Placement } from '@floating-ui/react';
import Tooltip from 'components/common/Tooltip/Tooltip';

interface Props {
  english: string;
  children: React.ReactNode;
  placement?: Placement;
}

const GlossaryTerm: React.FC<Props> = ({ english, children, placement }) => (
  <Tooltip value={<span>{children}</span>} content={english} placement={placement} />
);

export default GlossaryTerm;
```

`index.ts`:

```ts
export { default } from './GlossaryTerm';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/common/GlossaryTerm/GlossaryTerm.tsx \
  kafka-ui-react-app/src/components/common/GlossaryTerm/index.ts \
  kafka-ui-react-app/src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx
git commit -m "feat: add glossary term tooltip component"
```

## Task 2: Add Centralized Glossary Term Map

**Files:**
- Create: `kafka-ui-react-app/src/lib/glossaryTerms.ts`
- Modify: `kafka-ui-react-app/src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`

- [ ] **Step 1: Write the failing test**

Extend `GlossaryTerm.spec.tsx`:

```tsx
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

it('uses english originals from glossary constants', async () => {
  render(<GlossaryTerm english={GLOSSARY_TERMS.CONSUMER_GROUP}>消费者组</GlossaryTerm>);
  await userEvent.hover(screen.getByText('消费者组'));
  expect(screen.getByText('Consumer Group')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`

Expected: FAIL because glossary module does not exist.

- [ ] **Step 3: Write minimal implementation**

`glossaryTerms.ts`:

```ts
export const GLOSSARY_TERMS = {
  BROKER: 'Broker',
  TOPIC: 'Topic',
  PARTITION: 'Partition',
  OFFSET: 'Offset',
  CONSUMER_GROUP: 'Consumer Group',
  CONSUMER_LAG: 'Consumer Lag',
  REPLICATION_FACTOR: 'Replication Factor',
  ISR: 'In-Sync Replicas',
  SEGMENT: 'Segment',
  SERDE: 'Serde',
  CONNECTOR: 'Connector',
  KSQL: 'KSQL',
  ACL: 'ACL',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/lib/glossaryTerms.ts \
  kafka-ui-react-app/src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx
git commit -m "feat: add kafka glossary term constants"
```

## Task 3: Integrate Dashboard/Topics Labels

**Files:**
- Modify: `kafka-ui-react-app/src/components/Dashboard/Dashboard.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/List/TopicTable.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Overview/Overview.tsx`
- Modify: `kafka-ui-react-app/src/components/Dashboard/__tests__/Dashboard.spec.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/List/__tests__/TopicTable.spec.tsx`

- [ ] **Step 1: Write failing tests**

Add assertions to existing specs (Chinese locale):

Dashboard spec:

```tsx
await userEvent.hover(screen.getByText('Broker'));
expect(screen.getAllByText('Broker').length).toBeGreaterThan(0);
```

TopicTable spec:

```tsx
expect(screen.queryByText('Partition')).not.toBeInTheDocument();
await userEvent.hover(screen.getByText('分区数'));
expect(screen.getByText('Partition')).toBeInTheDocument();
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
./node_modules/.bin/jest --runInBand --watch=false \
  src/components/Dashboard/__tests__/Dashboard.spec.tsx \
  src/components/Topics/List/__tests__/TopicTable.spec.tsx
```

Expected: FAIL because wrapped glossary tooltips are missing.

- [ ] **Step 3: Write minimal implementation**

Wrap label fragments with `GlossaryTerm` in:

- `Dashboard.tsx`: `Broker 数量`
- `TopicTable.tsx`: `分区数`, `副本因子`
- `Overview.tsx`: labels involving `Partition`, `Offset`, `Replication Factor`, `同步副本(ISR)`, `Segment`

Rule: wrap labels only; do not wrap runtime values (topic names, counts, broker IDs, payload fields).

- [ ] **Step 4: Run tests to verify they pass**

Run the same command from Step 2.

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/Dashboard/Dashboard.tsx \
  kafka-ui-react-app/src/components/Topics/List/TopicTable.tsx \
  kafka-ui-react-app/src/components/Topics/Topic/Overview/Overview.tsx \
  kafka-ui-react-app/src/components/Dashboard/__tests__/Dashboard.spec.tsx \
  kafka-ui-react-app/src/components/Topics/List/__tests__/TopicTable.spec.tsx
git commit -m "feat: add glossary tooltips to dashboard and topics labels"
```

## Task 4: Integrate ConsumerGroups/Brokers/Connect Labels

**Files:**
- Create: `kafka-ui-react-app/src/components/ConsumerGroups/__tests__/List.spec.tsx`
- Modify: `kafka-ui-react-app/src/components/ConsumerGroups/List.tsx`
- Modify: `kafka-ui-react-app/src/components/Brokers/BrokersList/BrokersList.tsx`
- Modify: `kafka-ui-react-app/src/components/Brokers/BrokersList/__test__/BrokersList.spec.tsx`
- Modify: `kafka-ui-react-app/src/components/Connect/Details/Overview/Overview.tsx`
- Modify: `kafka-ui-react-app/src/components/Connect/Details/Overview/__tests__/Overview.spec.tsx`

- [ ] **Step 1: Write failing tests**

Create `ConsumerGroups/__tests__/List.spec.tsx` with mocked `useConsumerGroups`, then assert:

```tsx
expect(screen.queryByText('Consumer Group')).not.toBeInTheDocument();
await userEvent.hover(screen.getByText('消费者组'));
expect(screen.getByText('Consumer Group')).toBeInTheDocument();
```

Extend existing specs:

- `BrokersList.spec.tsx`: hover `Broker` term and assert tooltip English text appears.
- `Connect Overview.spec.tsx`: hover `Connector`-wrapped label and assert tooltip appears.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
./node_modules/.bin/jest --runInBand --watch=false \
  src/components/ConsumerGroups/__tests__/List.spec.tsx \
  src/components/Brokers/BrokersList/__test__/BrokersList.spec.tsx \
  src/components/Connect/Details/Overview/__tests__/Overview.spec.tsx
```

Expected: FAIL before glossary integration.

- [ ] **Step 3: Write minimal implementation**

Integrate `GlossaryTerm` in:

- `ConsumerGroups/List.tsx`: title and `消费积压` header (tooltip `Consumer Lag`)
- `BrokersList.tsx`: selected metric/header terms like `Broker`, `ISR`, `Partition`
- `Connect/Details/Overview.tsx`: `Connector`-related labels only

Do not wrap dynamic values from API payloads.

- [ ] **Step 4: Run tests to verify they pass**

Run the same command from Step 2.

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/ConsumerGroups/__tests__/List.spec.tsx \
  kafka-ui-react-app/src/components/ConsumerGroups/List.tsx \
  kafka-ui-react-app/src/components/Brokers/BrokersList/BrokersList.tsx \
  kafka-ui-react-app/src/components/Brokers/BrokersList/__test__/BrokersList.spec.tsx \
  kafka-ui-react-app/src/components/Connect/Details/Overview/Overview.tsx \
  kafka-ui-react-app/src/components/Connect/Details/Overview/__tests__/Overview.spec.tsx
git commit -m "feat: add glossary tooltips to consumers brokers and connect labels"
```

## Task 5: Regression Verification And Scope Audit

**Files:**
- No additional files required unless regressions appear

- [ ] **Step 1: Run focused regression suite**

```bash
./node_modules/.bin/jest --runInBand --watch=false \
  src/components/common/GlossaryTerm/__tests__/GlossaryTerm.spec.tsx \
  src/components/Dashboard/__tests__/Dashboard.spec.tsx \
  src/components/Topics/List/__tests__/TopicTable.spec.tsx \
  src/components/ConsumerGroups/__tests__/List.spec.tsx \
  src/components/Brokers/BrokersList/__test__/BrokersList.spec.tsx \
  src/components/Connect/Details/Overview/__tests__/Overview.spec.tsx \
  src/components/common/NewTable/__test__/Table.spec.tsx \
  src/lib/__test__/i18n.spec.ts \
  src/components/contexts/__tests__/LocaleContext.spec.tsx
```

Expected: PASS

- [ ] **Step 2: Run scope audit**

Manual check in changed files:

- only labels/headers/metric titles wrapped
- no payload value wrapping
- no changes to `LocaleContext` and `translateMessage` contract

- [ ] **Step 3: Commit regression fixes only when Task 5 changed code**

If Task 5 changed files, stage the real changed file paths and commit them with message `fix: resolve glossary tooltip regression issues`. If Task 5 produced no file changes, do not create a commit.
