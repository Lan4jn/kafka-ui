# Kafka UI Glossary Tooltip Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface centralized glossary terms when hovering the Chinese-dashboard/topic labels so users can learn the English equivalents without losing the localized copy.

**Architecture:** Wrap the relevant static label strings in `GlossaryTerm` while keeping runtime values untouched. Import `GLOSSARY_TERMS` to tie each label to its centralized definition and update the data tables and metrics to render the Chinese copy with hover tooltips.

**Tech Stack:** React, TypeScript, Jest, React Testing Library, @testing-library/user-event, `@floating-ui/react` tooltip helper.

---

## File Map

- Modify: `kafka-ui-react-app/src/components/Dashboard/Dashboard.tsx`
- Create: `kafka-ui-react-app/src/components/Dashboard/__tests__/Dashboard.spec.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/List/TopicTable.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/List/__tests__/TopicTable.spec.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Overview/Overview.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Overview/__test__/Overview.spec.tsx`

### Task 1: Dashboard broker column tooltip

**Files:**
- Create: `kafka-ui-react-app/src/components/Dashboard/__tests__/Dashboard.spec.tsx`
- Modify: `kafka-ui-react-app/src/components/Dashboard/Dashboard.tsx`
- Test: `docs/superpowers/plans/` target command below

- [ ] **Step 1: Write the failing test**

```tsx
it('shows Broker tooltip for the Dashboard brokers column label', async () => {
  renderComponentWithCluster(1); // helper that renders Dashboard w/ test data
  const header = screen.getByRole('columnheader', { name: 'Broker 数量' });
  expect(header).toBeInTheDocument();
  await userEvent.hover(header);
  expect(await screen.findByText(GLOSSARY_TERMS.BROKER)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/Dashboard/__tests__/Dashboard.spec.tsx src/components/Topics/List/__tests__/TopicTable.spec.tsx`

Expected: FAIL because the dashboard column still renders the English `Brokers count` string and does not import `GlossaryTerm`/`GLOSSARY_TERMS` yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
import GlossaryTerm from 'components/common/GlossaryTerm';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

const initialColumns: ColumnDef<Cluster>[] = [
  ...,
  {
    header: (
      <GlossaryTerm english={GLOSSARY_TERMS.BROKER}>Broker 数量</GlossaryTerm>
    ),
    accessorKey: 'brokerCount',
  },
  ...
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/Dashboard/__tests__/Dashboard.spec.tsx src/components/Topics/List/__tests__/TopicTable.spec.tsx`

Expected: PASS with the new tooltip assertion satisfied.

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/Dashboard/Dashboard.tsx \
  kafka-ui-react-app/src/components/Dashboard/__tests__/Dashboard.spec.tsx
git commit -m "feat: add glossary tooltips to dashboard and topics labels"
```

### Task 2: TopicTable column tooltips

**Files:**
- Modify: `kafka-ui-react-app/src/components/Topics/List/TopicTable.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/List/__tests__/TopicTable.spec.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('shows glossary tooltip on 分区数 and 副本因子 headers', async () => {
  renderComponent({ topics: topicsPayload, pageCount: 1 });
  const partitionsHeader = screen.getByRole('columnheader', { name: '分区数' });
  const replicationHeader = screen.getByRole('columnheader', { name: '副本因子' });
  await userEvent.hover(partitionsHeader);
  expect(await screen.findByText(GLOSSARY_TERMS.PARTITION)).toBeInTheDocument();
  await userEvent.hover(replicationHeader);
  expect(await screen.findByText(GLOSSARY_TERMS.REPLICATION_FACTOR)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the same command as above. Expect failure because the headers still render English `Partitions`/`Replication Factor` and no glossary tooltip is wired.

- [ ] **Step 3: Write minimal implementation**

```tsx
import GlossaryTerm from 'components/common/GlossaryTerm';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

const columns = React.useMemo<ColumnDef<Topic>[]>(
  () => [
    {
      id: TopicColumnsToSort.TOTAL_PARTITIONS,
      header: (
        <GlossaryTerm english={GLOSSARY_TERMS.PARTITION}>分区数</GlossaryTerm>
      ),
      accessorKey: 'partitionCount',
    },
    ...
    {
      header: (
        <GlossaryTerm english={GLOSSARY_TERMS.REPLICATION_FACTOR}>
          副本因子
        </GlossaryTerm>
      ),
      accessorKey: 'replicationFactor',
    },
    ...
  ],
  []
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest --runInBand --watch=false src/components/Dashboard/__tests__/Dashboard.spec.tsx src/components/Topics/List/__tests__/TopicTable.spec.tsx`

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/Topics/List/TopicTable.tsx \
  kafka-ui-react-app/src/components/Topics/List/__tests__/TopicTable.spec.tsx
git commit -m "feat: add glossary tooltips to dashboard and topics labels"
```

### Task 3: Topic Overview metric and column tooltips

**Files:**
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Overview/Overview.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Overview/__test__/Overview.spec.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('shows translation hover for the partition metric label', async () => {
  renderComponent();
  const label = screen.getByText('分区');
  await userEvent.hover(label);
  expect(await screen.findByText(GLOSSARY_TERMS.PARTITION)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the combined jest command and expect failure because the label is still `Partitions` without glossary data.

- [ ] **Step 3: Write minimal implementation**

```tsx
import GlossaryTerm from 'components/common/GlossaryTerm';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

<Metrics.Indicator label={<GlossaryTerm english={GLOSSARY_TERMS.PARTITION}>分区</GlossaryTerm>}>
  {data?.partitionCount}
</Metrics.Indicator>
<Metrics.Indicator label={<GlossaryTerm english={GLOSSARY_TERMS.REPLICATION_FACTOR}>副本因子</GlossaryTerm>}>
  {data?.replicationFactor}
</Metrics.Indicator>
<Metrics.Indicator
  label={<GlossaryTerm english={GLOSSARY_TERMS.ISR}>同步副本(ISR)</GlossaryTerm>}
>
  ...
</Metrics.Indicator>
<Metrics.Indicator label={<GlossaryTerm english={GLOSSARY_TERMS.SEGMENT}>Segment 大小</GlossaryTerm>}>
  ...
</Metrics.Indicator>
<Metrics.Indicator label={<GlossaryTerm english={GLOSSARY_TERMS.SEGMENT}>Segment 计数</GlossaryTerm>}>
  ...
</Metrics.Indicator>
```

Columns using Partition/Offset should also wrap text, e.g.,

```tsx
{
  header: (
    <GlossaryTerm english={GLOSSARY_TERMS.PARTITION}>分区 ID</GlossaryTerm>
  ),
  accessorKey: 'partition',
},
{
  header: (
    <GlossaryTerm english={GLOSSARY_TERMS.OFFSET}>最早 Offset</GlossaryTerm>
  ),
  accessorKey: 'offsetMin',
},
{
  header: (
    <GlossaryTerm english={GLOSSARY_TERMS.OFFSET}>最新 Offset</GlossaryTerm>
  ),
  accessorKey: 'offsetMax',
},
```

- [ ] **Step 4: Run test to verify it passes**

Run the combined jest command again.

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/Topics/Topic/Overview/Overview.tsx \
  kafka-ui-react-app/src/components/Topics/Topic/Overview/__test__/Overview.spec.tsx
git commit -m "feat: add glossary tooltips to dashboard and topics labels"
```

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-07-kafka-ui-glossary-tooltip-plan.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
