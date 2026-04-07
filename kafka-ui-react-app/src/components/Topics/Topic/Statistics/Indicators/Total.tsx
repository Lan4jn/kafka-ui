import React from 'react';
import * as Metrics from 'components/common/Metrics';
import { TopicAnalysisStats } from 'generated-sources';
import { formatTimestamp } from 'lib/dateTimeHelpers';
import { useTranslation } from 'components/contexts/LocaleContext';

const Total: React.FC<TopicAnalysisStats> = ({
  totalMsgs,
  minOffset,
  maxOffset,
  minTimestamp,
  maxTimestamp,
  nullKeys,
  nullValues,
  approxUniqKeys,
  approxUniqValues,
}) => {
  const { t } = useTranslation();
  return (
    <Metrics.Section title={t('topics.statistics.sections.messages')}>
      <Metrics.Indicator label={t('topics.statistics.total.totalNumber')}>
        {totalMsgs}
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.total.offsetsMinMax')}>
        {`${minOffset} - ${maxOffset}`}
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.total.timestampMinMax')}>
        {`${formatTimestamp(minTimestamp)} - ${formatTimestamp(maxTimestamp)}`}
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.total.nullKeys')}>
        {nullKeys}
      </Metrics.Indicator>
      <Metrics.Indicator
        label={t('topics.statistics.total.uniqueKeys')}
        title={t('topics.statistics.total.uniqueKeysTitle')}
      >
        {approxUniqKeys}
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.total.nullValues')}>
        {nullValues}
      </Metrics.Indicator>
      <Metrics.Indicator
        label={t('topics.statistics.total.uniqueValues')}
        title={t('topics.statistics.total.uniqueValuesTitle')}
      >
        {approxUniqValues}
      </Metrics.Indicator>
    </Metrics.Section>
  );
};

export default Total;
