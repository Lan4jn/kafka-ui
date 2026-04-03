import { ErrorMessage } from '@hookform/error-message';
import { Button } from 'components/common/Button/Button';
import Input from 'components/common/Input/Input';
import { FormError } from 'components/common/Input/Input.styled';
import { InputLabel } from 'components/common/Input/InputLabel.styled';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { RouteParamsClusterTopic } from 'lib/paths';
import useAppParams from 'lib/hooks/useAppParams';
import { useConfirm } from 'lib/hooks/useConfirm';
import { useTranslation } from 'components/contexts/LocaleContext';
import {
  useIncreaseTopicPartitionsCount,
  useUpdateTopicReplicationFactor,
} from 'lib/hooks/api/topics';

import * as S from './DangerZone.styled';

export interface DangerZoneProps {
  defaultPartitions: number;
  defaultReplicationFactor: number;
}

const DangerZone: React.FC<DangerZoneProps> = ({
  defaultPartitions,
  defaultReplicationFactor,
}) => {
  const { t } = useTranslation();
  const params = useAppParams<RouteParamsClusterTopic>();
  const [partitions, setPartitions] = React.useState<number>(defaultPartitions);
  const [replicationFactor, setReplicationFactor] = React.useState<number>(
    defaultReplicationFactor
  );
  const increaseTopicPartitionsCount = useIncreaseTopicPartitionsCount(params);
  const updateTopicReplicationFactor = useUpdateTopicReplicationFactor(params);

  const partitionsMethods = useForm({
    defaultValues: {
      partitions,
    },
  });

  const replicationFactorMethods = useForm({
    defaultValues: {
      replicationFactor,
    },
  });

  const confirm = useConfirm();
  const confirmPartitionsChange = () =>
    confirm(t('topics.edit.dangerZone.confirmations.partitions'), () =>
      increaseTopicPartitionsCount.mutateAsync(
        partitionsMethods.getValues('partitions')
      )
    );
  const confirmReplicationFactorChange = () =>
    confirm(t('topics.edit.dangerZone.confirmations.replicationFactor'), () =>
      updateTopicReplicationFactor.mutateAsync(
        replicationFactorMethods.getValues('replicationFactor')
      )
    );

  const validatePartitions = (data: { partitions: number }) => {
    if (data.partitions < defaultPartitions) {
      partitionsMethods.setError('partitions', {
        type: 'manual',
        message: t('topics.edit.dangerZone.validation.partitionsMin'),
      });
    } else {
      setPartitions(data.partitions);
      confirmPartitionsChange();
    }
  };

  const validateReplicationFactor = (data: { replicationFactor: number }) => {
    try {
      setReplicationFactor(data.replicationFactor);
      confirmReplicationFactorChange();
    } catch (e) {
      // do nothing
    }
  };

  return (
    <S.Wrapper>
      <S.Title>{t('topics.edit.dangerZone.title')}</S.Title>
      <S.Warning>{t('topics.edit.dangerZone.warning')}</S.Warning>
      <div>
        <FormProvider {...partitionsMethods}>
          <S.Form
            onSubmit={partitionsMethods.handleSubmit(validatePartitions)}
            aria-label={t('topics.edit.dangerZone.aria.partitionsForm')}
          >
            <div>
              <InputLabel htmlFor="partitions">
                {t('topics.edit.dangerZone.fields.partitions')}
              </InputLabel>
              <Input
                inputSize="M"
                type="number"
                id="partitions"
                name="partitions"
                hookFormOptions={{
                  required: t(
                    'topics.edit.dangerZone.validation.partitionsRequired'
                  ),
                }}
                placeholder={t(
                  'topics.edit.dangerZone.placeholders.partitions'
                )}
              />
            </div>
            <div>
              <Button
                buttonType="primary"
                buttonSize="M"
                type="submit"
                disabled={!partitionsMethods.formState.isDirty}
              >
                {t('topics.edit.dangerZone.actions.submit')}
              </Button>
            </div>
          </S.Form>
        </FormProvider>
        <FormError>
          <ErrorMessage
            errors={partitionsMethods.formState.errors}
            name="partitions"
          />
        </FormError>
        <FormProvider {...replicationFactorMethods}>
          <S.Form
            onSubmit={replicationFactorMethods.handleSubmit(
              validateReplicationFactor
            )}
            aria-label={t('topics.edit.dangerZone.aria.replicationFactorForm')}
          >
            <div>
              <InputLabel htmlFor="replicationFactor">
                {t('topics.edit.dangerZone.fields.replicationFactor')}
              </InputLabel>
              <Input
                id="replicationFactor"
                inputSize="M"
                type="number"
                placeholder={t(
                  'topics.edit.dangerZone.placeholders.replicationFactor'
                )}
                name="replicationFactor"
                hookFormOptions={{
                  required: t(
                    'topics.edit.dangerZone.validation.replicationFactorRequired'
                  ),
                }}
              />
            </div>
            <div>
              <Button
                buttonType="primary"
                buttonSize="M"
                type="submit"
                disabled={!replicationFactorMethods.formState.isDirty}
              >
                {t('topics.edit.dangerZone.actions.submit')}
              </Button>
            </div>
          </S.Form>
        </FormProvider>
        <FormError>
          <ErrorMessage
            errors={replicationFactorMethods.formState.errors}
            name="replicationFactor"
          />
        </FormError>
      </div>
    </S.Wrapper>
  );
};

export default DangerZone;
