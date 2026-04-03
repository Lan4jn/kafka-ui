import React from 'react';
import Input from 'components/common/Input/Input';
import { useFormContext } from 'react-hook-form';
import ControlledSelect from 'components/common/Select/ControlledSelect';
import { METRICS_OPTIONS } from 'lib/constants';
import * as S from 'widgets/ClusterConfigForm/ClusterConfigForm.styled';
import SectionHeader from 'widgets/ClusterConfigForm/common/SectionHeader';
import SSLForm from 'widgets/ClusterConfigForm/common/SSLForm';
import Credentials from 'widgets/ClusterConfigForm/common/Credentials';
import { useTranslation } from 'components/contexts/LocaleContext';

const Metrics = () => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();
  const visibleMetrics = !!watch('metrics');
  const toggleMetrics = () =>
    setValue(
      'metrics',
      visibleMetrics
        ? undefined
        : {
            type: '',
            port: 0,
            isAuth: false,
          },
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );

  return (
    <>
      <SectionHeader
        title={t('clusterConfig.metrics.title')}
        adding={!visibleMetrics}
        addButtonText={t('clusterConfig.metrics.addButtonText')}
        onClick={toggleMetrics}
      />
      {visibleMetrics && (
        <>
          <ControlledSelect
            name="metrics.type"
            label={t('clusterConfig.metrics.fields.type')}
            placeholder={t('clusterConfig.metrics.placeholders.type')}
            options={METRICS_OPTIONS}
          />
          <S.Port>
            <Input
              label={t('clusterConfig.metrics.fields.port')}
              name="metrics.port"
              type="number"
              positiveOnly
              withError
            />
          </S.Port>
          <Credentials prefix="metrics" />
          <SSLForm
            prefix="metrics.keystore"
            title={t('clusterConfig.metrics.keystore.title')}
          />
        </>
      )}
    </>
  );
};
export default Metrics;
