# Kafka UI Localization Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining frontend-owned English copy on the `localization-zh-cn` branch so the Chinese UI is usable without frequent English leakage.

**Architecture:** Continue using the existing lightweight locale dictionary plus `LocaleProvider` pattern. Add missing translation keys to both locale files, replace remaining hardcoded strings with `t(...)`, and convert shared validation literals into frontend-localized messages without changing validation behavior.

**Tech Stack:** React, TypeScript, Jest, React Testing Library, `react-hook-form`, `yup`, existing `LocaleContext`

---

## File Map

### Modify

- `kafka-ui-react-app/src/locales/en.ts`
- `kafka-ui-react-app/src/locales/zh-CN.ts`
- `kafka-ui-react-app/src/components/common/NewTable/Table.tsx`
- `kafka-ui-react-app/src/components/common/NewTable/__test__/Table.spec.tsx`
- `kafka-ui-react-app/src/components/Dashboard/ClusterName.tsx`
- `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/EditFilter.tsx`
- `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/InfoModal.tsx`
- `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx`
- `kafka-ui-react-app/src/lib/hooks/api/topicMessages.tsx`
- `kafka-ui-react-app/src/lib/hooks/api/ksqlDb.tsx`
- `kafka-ui-react-app/src/components/Connect/Details/Config/Config.tsx`
- `kafka-ui-react-app/src/components/Connect/Details/Config/__tests__/Config.spec.tsx`
- `kafka-ui-react-app/src/lib/yupExtended.ts`
- `kafka-ui-react-app/src/widgets/ClusterConfigForm/schema.ts`

## Task 1: Localize Shared Table Copy

**Files:**
- Modify: `kafka-ui-react-app/src/components/common/NewTable/Table.tsx`
- Modify: `kafka-ui-react-app/src/components/common/NewTable/__test__/Table.spec.tsx`
- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`

- [ ] **Step 1: Write the failing test**

Add a Chinese-locale test to `kafka-ui-react-app/src/components/common/NewTable/__test__/Table.spec.tsx` that renders the table through existing helpers and expects localized pagination and empty-state copy:

```tsx
it('renders localized empty and pagination copy in Chinese', async () => {
  localStorage.setItem('locale', 'zh-CN');

  render(
    <Table
      data={[]}
      columns={columns}
      pageCount={2}
      total={20}
      emptyMessage={undefined}
    />
  );

  expect(screen.getByText('暂无数据')).toBeInTheDocument();
  expect(screen.getByText('上一页')).toBeInTheDocument();
  expect(screen.getByText('下一页')).toBeInTheDocument();
  expect(screen.getByText('跳转到页码：')).toBeInTheDocument();
  expect(screen.getByText('第 1 页，共 2 页')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --runInBand src/components/common/NewTable/__test__/Table.spec.tsx`

Expected: FAIL because the table still renders English strings such as `No rows found`, `Previous`, `Next`, and `Go to page:`.

- [ ] **Step 3: Write minimal implementation**

Update `kafka-ui-react-app/src/components/common/NewTable/Table.tsx` to read translations from `useTranslation()` and replace these literals:

```tsx
const { t } = useTranslation();

{emptyMessage || t('common.table.noRows')}
{t('common.table.previous')}
{t('common.table.next')}
<span>{t('common.table.goToPage')}</span>
<span>
  {t('common.table.pageOf', {
    current: table.getState().pagination.pageIndex + 1,
    total: table.getPageCount(),
  })}
</span>
```

Add matching keys to both locale files:

```ts
'common.table.previous': 'Previous',
'common.table.next': 'Next',
'common.table.goToPage': 'Go to page:',
'common.table.pageOf': 'Page {current} of {total}',
```

```ts
'common.table.previous': '上一页',
'common.table.next': '下一页',
'common.table.goToPage': '跳转到页码：',
'common.table.pageOf': '第 {current} 页，共 {total} 页',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --runInBand src/components/common/NewTable/__test__/Table.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/common/NewTable/Table.tsx \
  kafka-ui-react-app/src/components/common/NewTable/__test__/Table.spec.tsx \
  kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts
git commit -m "feat: localize shared table copy"
```

## Task 2: Localize Topic Filter Residual Copy

**Files:**
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/EditFilter.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/InfoModal.tsx`
- Modify: `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx`
- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`

- [ ] **Step 1: Write the failing tests**

Extend `kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx` with Chinese-locale assertions for the edit modal title and info modal button:

```tsx
it('renders localized edit filter copy in Chinese', async () => {
  localStorage.setItem('locale', 'zh-CN');
  renderComponent();

  await userEvent.click(screen.getByTestId('editActiveSmartFilterBtn'));

  expect(screen.getByText('编辑过滤器')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
});

it('renders localized info modal dismiss action in Chinese', async () => {
  localStorage.setItem('locale', 'zh-CN');
  renderComponent();

  await userEvent.click(screen.getByLabelText('info'));

  expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --runInBand src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx`

Expected: FAIL because `Edit filter`, `Save`, and `Ok` are still hardcoded in English.

- [ ] **Step 3: Write minimal implementation**

Update both components to use `useTranslation()` and add these keys:

```ts
'topics.messages.filters.edit.title': 'Edit filter',
'topics.messages.filters.edit.save': 'Save',
'topics.messages.filters.info.ok': 'Ok',
'topics.messages.filters.info.variablesTitle': 'Variables bound to groovy context:',
'topics.messages.filters.info.parsingTitle': 'JSON parsing logic:',
'topics.messages.filters.info.samplesTitle': 'Sample filters:',
```

```ts
'topics.messages.filters.edit.title': '编辑过滤器',
'topics.messages.filters.edit.save': '保存',
'topics.messages.filters.info.ok': '确定',
'topics.messages.filters.info.variablesTitle': '绑定到 groovy 上下文的变量：',
'topics.messages.filters.info.parsingTitle': 'JSON 解析逻辑：',
'topics.messages.filters.info.samplesTitle': '示例过滤器：',
```

Replace visible labels and headings in:

- `EditFilter.tsx`
- `InfoModal.tsx`

Keep code examples unchanged where they are instructional snippets rather than UI labels.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --runInBand src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/EditFilter.tsx \
  kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/InfoModal.tsx \
  kafka-ui-react-app/src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx \
  kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts
git commit -m "feat: localize topic filter helper copy"
```

## Task 3: Localize Runtime Toasts And Connect Config Residual Copy

**Files:**
- Modify: `kafka-ui-react-app/src/lib/hooks/api/topicMessages.tsx`
- Modify: `kafka-ui-react-app/src/lib/hooks/api/ksqlDb.tsx`
- Modify: `kafka-ui-react-app/src/components/Connect/Details/Config/Config.tsx`
- Modify: `kafka-ui-react-app/src/components/Connect/Details/Config/__tests__/Config.spec.tsx`
- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`

- [ ] **Step 1: Write the failing test**

Add a Chinese-locale test to `kafka-ui-react-app/src/components/Connect/Details/Config/__tests__/Config.spec.tsx`:

```tsx
it('renders localized credential warning and submit button in Chinese', async () => {
  localStorage.setItem('locale', 'zh-CN');
  renderComponent({
    config: { password: '******' },
  });

  expect(
    screen.getByText('请将 ****** 替换为真实凭据，避免误损坏连接器配置。')
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --runInBand src/components/Connect/Details/Config/__tests__/Config.spec.tsx`

Expected: FAIL because the warning text and submit button still render in English.

- [ ] **Step 3: Write minimal implementation**

Update `Config.tsx` to use `useTranslation()` and replace:

- the credential warning
- the submit button label

Add toast-related keys for both live message consumption and KSQL:

```ts
'topics.messages.live.loading': 'Consuming messages...',
'topics.messages.live.abort': 'Abort',
'topics.messages.live.cancelled': 'Cancelled',
'topics.messages.live.error': 'Something went wrong. Please try again.',
'ksqlDb.query.loading': 'Consuming query execution result...',
'ksqlDb.query.abort': 'Abort',
'ksqlDb.query.cancelled': 'Cancelled',
'ksqlDb.query.error': 'Something went wrong. Please try again.',
'connectors.config.warning':
  'Please replace ****** with the real credential values to avoid accidentally breaking your connector config!',
'connectors.config.submit': 'Submit',
```

```ts
'topics.messages.live.loading': '正在消费消息...',
'topics.messages.live.abort': '中止',
'topics.messages.live.cancelled': '已取消',
'topics.messages.live.error': '发生错误，请重试。',
'ksqlDb.query.loading': '正在消费查询结果...',
'ksqlDb.query.abort': '中止',
'ksqlDb.query.cancelled': '已取消',
'ksqlDb.query.error': '发生错误，请重试。',
'connectors.config.warning': '请将 ****** 替换为真实凭据，避免误损坏连接器配置。',
'connectors.config.submit': '提交',
```

Use `getCurrentLocale()` plus `translateMessage(...)` inside the non-component toast helpers where hooks cannot call `useTranslation()` directly.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --runInBand src/components/Connect/Details/Config/__tests__/Config.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/lib/hooks/api/topicMessages.tsx \
  kafka-ui-react-app/src/lib/hooks/api/ksqlDb.tsx \
  kafka-ui-react-app/src/components/Connect/Details/Config/Config.tsx \
  kafka-ui-react-app/src/components/Connect/Details/Config/__tests__/Config.spec.tsx \
  kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts
git commit -m "feat: localize runtime toasts and connect config copy"
```

## Task 4: Localize Validation Schemas And Final Residual Copy

**Files:**
- Modify: `kafka-ui-react-app/src/lib/yupExtended.ts`
- Modify: `kafka-ui-react-app/src/widgets/ClusterConfigForm/schema.ts`
- Modify: `kafka-ui-react-app/src/components/Dashboard/ClusterName.tsx`
- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`
- Test: `kafka-ui-react-app/src/components/contexts/__tests__/LocaleContext.spec.tsx`
- Test: `kafka-ui-react-app/src/lib/__test__/i18n.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add focused assertions where existing tests already exercise validation output. If there is no direct coverage, add a minimal unit test around the topic form schema:

```ts
it('returns localized topic validation copy in Chinese context', async () => {
  localStorage.setItem('locale', 'zh-CN');

  await expect(
    topicFormValidationSchema.validate(
      { name: '', partitions: 0, customParams: [{ name: '', value: '' }] },
      { abortEarly: false }
    )
  ).rejects.toMatchObject({
    errors: expect.arrayContaining([
      'Topic 名称为必填项',
      '分区数必须大于或等于 1',
      '自定义参数为必填项',
      '值为必填项',
    ]),
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --runInBand src/lib/__test__/i18n.spec.ts src/components/contexts/__tests__/LocaleContext.spec.tsx src/components/Topics/shared/Form/__tests__/TopicForm.spec.tsx`

Expected: FAIL because validation copy is still English.

- [ ] **Step 3: Write minimal implementation**

Add translation keys for validation strings and use `translateMessage(..., getCurrentLocale())` from schema files to keep the schema API stable.

Example keys:

```ts
'topics.form.validation.nameRequired': 'Topic Name is required',
'topics.form.validation.namePattern': 'Only alphanumeric, _, -, and . allowed',
'topics.form.validation.partitionsMin':
  'Number of Partitions must be greater than or equal to 1',
'topics.form.validation.partitionsType':
  'Number of Partitions is required and must be a number',
'topics.form.validation.customParamRequired': 'Custom parameter is required',
'topics.form.validation.valueRequired': 'Value is required',
'clusterConfig.validation.requiredField': 'required field',
'clusterConfig.validation.positiveOnly': 'positive only',
'clusterConfig.validation.numbersOnly': 'numbers only',
'clusterConfig.validation.required': 'required',
'dashboard.cluster.readonly': 'readonly',
```

```ts
'topics.form.validation.nameRequired': 'Topic 名称为必填项',
'topics.form.validation.namePattern': '仅允许字母数字、_、- 和 .',
'topics.form.validation.partitionsMin': '分区数必须大于或等于 1',
'topics.form.validation.partitionsType': '分区数为必填项且必须为数字',
'topics.form.validation.customParamRequired': '自定义参数为必填项',
'topics.form.validation.valueRequired': '值为必填项',
'clusterConfig.validation.requiredField': '必填项',
'clusterConfig.validation.positiveOnly': '必须为正数',
'clusterConfig.validation.numbersOnly': '必须为数字',
'clusterConfig.validation.required': '必填',
'dashboard.cluster.readonly': '只读',
```

Update:

- `yupExtended.ts`
- `schema.ts`
- `Dashboard/ClusterName.tsx`

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --runInBand src/lib/__test__/i18n.spec.ts src/components/contexts/__tests__/LocaleContext.spec.tsx src/components/Topics/shared/Form/__tests__/TopicForm.spec.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add kafka-ui-react-app/src/lib/yupExtended.ts \
  kafka-ui-react-app/src/widgets/ClusterConfigForm/schema.ts \
  kafka-ui-react-app/src/components/Dashboard/ClusterName.tsx \
  kafka-ui-react-app/src/locales/en.ts \
  kafka-ui-react-app/src/locales/zh-CN.ts
git commit -m "feat: localize validation schema copy"
```

## Task 5: Final Verification

**Files:**
- Modify: none
- Test: targeted files above

- [ ] **Step 1: Run focused verification**

Run:

```bash
pnpm test -- --runInBand \
  src/lib/__test__/i18n.spec.ts \
  src/components/contexts/__tests__/LocaleContext.spec.tsx \
  src/components/common/NewTable/__test__/Table.spec.tsx \
  src/components/Topics/Topic/Messages/Filters/__tests__/Filters.spec.tsx \
  src/components/Connect/Details/Config/__tests__/Config.spec.tsx
```

Expected: PASS

- [ ] **Step 2: Run a residual English scan**

Run:

```bash
rg -n --glob '!**/__test__/**' --glob '!**/__tests__/**' --glob '!**/*.spec.tsx' \
  --glob '!**/*.spec.ts' --glob '!**/Icons/**' \
  '>[[:space:]]*[A-Za-z][^<{]{1,}<|\"[A-Za-z][^\"\\\\]{2,}\"' \
  kafka-ui-react-app/src
```

Expected: Remaining hits are implementation strings, enum values, or non-user-facing content rather than major UI copy.

- [ ] **Step 3: Commit verification notes if needed**

```bash
git status --short
```

Expected: Clean working tree or only intentional final changes.
