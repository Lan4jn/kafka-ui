import React from 'react';
import { Row } from '@tanstack/react-table';
import Heading from 'components/common/heading/Heading.styled';
import BytesFormatted from 'components/common/BytesFormatted/BytesFormatted';
import {
  List,
  Label,
} from 'components/common/PropertiesList/PropertiesList.styled';
import { TopicAnalysisStats } from 'generated-sources';
import { formatTimestamp } from 'lib/dateTimeHelpers';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './Statistics.styles';

const PartitionInfoRow: React.FC<{ row: Row<TopicAnalysisStats> }> = ({
  row,
}) => {
  const { t } = useTranslation();
  const {
    totalMsgs,
    minTimestamp,
    maxTimestamp,
    nullKeys,
    nullValues,
    approxUniqKeys,
    approxUniqValues,
    keySize,
    valueSize,
  } = row.original;
  return (
    <S.PartitionInfo>
      <div>
        <Heading level={4}>{t('topics.statistics.partitionInfo.partitionStats')}</Heading>
        <List>
          <Label>{t('topics.statistics.partitionInfo.totalMessages')}</Label>
          <span>{totalMsgs}</span>
          <Label>{t('topics.statistics.size.totalSize')}</Label>
          <BytesFormatted value={(keySize?.sum || 0) + (valueSize?.sum || 0)} />
          <Label>{t('topics.statistics.partitionInfo.minTimestamp')}</Label>
          <span>{formatTimestamp(minTimestamp)}</span>
          <Label>{t('topics.statistics.partitionInfo.maxTimestamp')}</Label>
          <span>{formatTimestamp(maxTimestamp)}</span>
          <Label>{t('topics.statistics.partitionInfo.nullKeys')}</Label>
          <span>{nullKeys}</span>
          <Label>{t('topics.statistics.partitionInfo.nullValues')}</Label>
          <span>{nullValues}</span>
          <Label>{t('topics.statistics.partitionInfo.uniqueKeys')}</Label>
          <span>{approxUniqKeys}</span>
          <Label>{t('topics.statistics.partitionInfo.uniqueValues')}</Label>
          <span>{approxUniqValues}</span>
        </List>
      </div>
      <div>
        <Heading level={4}>{t('topics.statistics.partitionInfo.keySizes')}</Heading>
        <List>
          <Label>{t('topics.statistics.partitionInfo.totalKeySize')}</Label>
          <BytesFormatted value={keySize?.sum} />
          <Label>{t('topics.statistics.partitionInfo.minKeySize')}</Label>
          <BytesFormatted value={keySize?.min} />
          <Label>{t('topics.statistics.partitionInfo.maxKeySize')}</Label>
          <BytesFormatted value={keySize?.max} />
          <Label>{t('topics.statistics.partitionInfo.avgKeySize')}</Label>
          <BytesFormatted value={keySize?.avg} />
          <Label>{t('topics.statistics.size.percentile50')}</Label>
          <BytesFormatted value={keySize?.prctl50} />
          <Label>{t('topics.statistics.size.percentile75')}</Label>
          <BytesFormatted value={keySize?.prctl75} />
          <Label>{t('topics.statistics.size.percentile95')}</Label>
          <BytesFormatted value={keySize?.prctl95} />
          <Label>{t('topics.statistics.size.percentile99')}</Label>
          <BytesFormatted value={keySize?.prctl99} />
          <Label>{t('topics.statistics.size.percentile999')}</Label>
          <BytesFormatted value={keySize?.prctl999} />
        </List>
      </div>
      <div>
        <Heading level={4}>{t('topics.statistics.partitionInfo.valueSizes')}</Heading>
        <List>
          <Label>{t('topics.statistics.partitionInfo.totalValueSize')}</Label>
          <BytesFormatted value={valueSize?.sum} />
          <Label>{t('topics.statistics.partitionInfo.minValueSize')}</Label>
          <BytesFormatted value={valueSize?.min} />
          <Label>{t('topics.statistics.partitionInfo.maxValueSize')}</Label>
          <BytesFormatted value={valueSize?.max} />
          <Label>{t('topics.statistics.partitionInfo.avgValueSize')}</Label>
          <BytesFormatted value={valueSize?.avg} />
          <Label>{t('topics.statistics.size.percentile50')}</Label>
          <BytesFormatted value={valueSize?.prctl50} />
          <Label>{t('topics.statistics.size.percentile75')}</Label>
          <BytesFormatted value={valueSize?.prctl75} />
          <Label>{t('topics.statistics.size.percentile95')}</Label>
          <BytesFormatted value={valueSize?.prctl95} />
          <Label>{t('topics.statistics.size.percentile99')}</Label>
          <BytesFormatted value={valueSize?.prctl99} />
          <Label>{t('topics.statistics.size.percentile999')}</Label>
          <BytesFormatted value={valueSize?.prctl999} />
        </List>
      </div>
    </S.PartitionInfo>
  );
};

export default PartitionInfoRow;
