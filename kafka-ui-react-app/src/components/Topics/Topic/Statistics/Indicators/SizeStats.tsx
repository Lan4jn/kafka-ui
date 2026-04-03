import React from 'react';
import * as Metrics from 'components/common/Metrics';
import { TopicAnalysisSizeStats } from 'generated-sources';
import BytesFormatted from 'components/common/BytesFormatted/BytesFormatted';
import { useTranslation } from 'components/contexts/LocaleContext';

const TranslatedIndicators: React.FC<TopicAnalysisSizeStats> = ({
  sum,
  min,
  max,
  avg,
  prctl50,
  prctl75,
  prctl95,
  prctl99,
  prctl999,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Metrics.Indicator label={t('topics.statistics.size.totalSize')}>
        <BytesFormatted value={sum} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.minSize')}>
        <BytesFormatted value={min} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.maxSize')}>
        <BytesFormatted value={max} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.average')}>
        <BytesFormatted value={avg} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.percentile50')}>
        <BytesFormatted value={prctl50} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.percentile75')}>
        <BytesFormatted value={prctl75} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.percentile95')}>
        <BytesFormatted value={prctl95} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.percentile99')}>
        <BytesFormatted value={prctl99} />
      </Metrics.Indicator>
      <Metrics.Indicator label={t('topics.statistics.size.percentile999')}>
        <BytesFormatted value={prctl999} />
      </Metrics.Indicator>
    </>
  );
};

const SizeStats: React.FC<{
  stats: TopicAnalysisSizeStats;
  title: string;
}> = ({
  stats: { sum, min, max, avg, prctl50, prctl75, prctl95, prctl99, prctl999 },
  title,
}) => (
  <Metrics.Section title={title}>
    <TranslatedIndicators
      sum={sum}
      min={min}
      max={max}
      avg={avg}
      prctl50={prctl50}
      prctl75={prctl75}
      prctl95={prctl95}
      prctl99={prctl99}
      prctl999={prctl999}
    />
  </Metrics.Section>
);

export default SizeStats;
