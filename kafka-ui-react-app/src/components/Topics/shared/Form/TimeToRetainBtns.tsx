import React from 'react';
import { MILLISECONDS_IN_DAY } from 'lib/constants';
import styled from 'styled-components';
import { useTranslation } from 'components/contexts/LocaleContext';

import TimeToRetainBtn from './TimeToRetainBtn';

export interface Props {
  name: string;
  value: string;
}

const TimeToRetainBtnsWrapper = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 8px;
`;

const TimeToRetainBtns: React.FC<Props> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <TimeToRetainBtnsWrapper>
      <TimeToRetainBtn
        text={t('topics.form.retentionPresets.hours12')}
        inputName={name}
        value={MILLISECONDS_IN_DAY / 2}
      />
      <TimeToRetainBtn
        text={t('topics.form.retentionPresets.day1')}
        inputName={name}
        value={MILLISECONDS_IN_DAY}
      />
      <TimeToRetainBtn
        text={t('topics.form.retentionPresets.days2')}
        inputName={name}
        value={MILLISECONDS_IN_DAY * 2}
      />
      <TimeToRetainBtn
        text={t('topics.form.retentionPresets.days7')}
        inputName={name}
        value={MILLISECONDS_IN_DAY * 7}
      />
      <TimeToRetainBtn
        text={t('topics.form.retentionPresets.weeks4')}
        inputName={name}
        value={MILLISECONDS_IN_DAY * 7 * 4}
      />
    </TimeToRetainBtnsWrapper>
  );
};

export default TimeToRetainBtns;
