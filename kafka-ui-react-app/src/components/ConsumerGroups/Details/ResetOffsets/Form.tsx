import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ConsumerGroupDetails,
  ConsumerGroupOffsetsReset,
  ConsumerGroupOffsetsResetType,
} from 'generated-sources';
import { ClusterGroupParam } from 'lib/paths';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { MultiSelect, Option } from 'react-multi-select-component';
import 'react-datepicker/dist/react-datepicker.css';
import { ErrorMessage } from '@hookform/error-message';
import { InputLabel } from 'components/common/Input/InputLabel.styled';
import { Button } from 'components/common/Button/Button';
import Input from 'components/common/Input/Input';
import { FormError } from 'components/common/Input/Input.styled';
import useAppParams from 'lib/hooks/useAppParams';
import { useResetConsumerGroupOffsetsMutation } from 'lib/hooks/api/consumers';
import { FlexFieldset, StyledForm } from 'components/common/Form/Form.styled';
import ControlledSelect from 'components/common/Select/ControlledSelect';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './ResetOffsets.styled';

interface FormProps {
  defaultValues: ConsumerGroupOffsetsReset;
  topics: string[];
  partitions: ConsumerGroupDetails['partitions'];
}

const Form: React.FC<FormProps> = ({ defaultValues, partitions, topics }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routerParams = useAppParams<ClusterGroupParam>();
  const reset = useResetConsumerGroupOffsetsMutation(routerParams);
  const topicOptions = React.useMemo(
    () => topics.map((value) => ({ value, label: value })),
    [topics]
  );
  const resetTypeOptions = React.useMemo(
    () =>
      Object.values(ConsumerGroupOffsetsResetType).map((value) => ({
        value,
        label: t(`consumerGroups.resetOffsets.resetTypes.${value}`),
      })),
    [t]
  );
  const methods = useForm<ConsumerGroupOffsetsReset>({
    mode: 'onChange',
    defaultValues,
  });

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = methods;
  const { fields } = useFieldArray({
    control,
    name: 'partitionsOffsets',
  });

  const resetTypeValue = watch('resetType');
  const topicValue = watch('topic');
  const offsetsValue = watch('partitionsOffsets');
  const partitionsValue = watch('partitions') || [];

  const partitionOptions =
    partitions
      ?.filter((p) => p.topic === topicValue)
      .map((p) => ({
        label: t('consumerGroups.resetOffsets.partitionOption', {
          partition: p.partition.toString(),
        }),
        value: p.partition,
      })) || [];

  const onSelectedPartitionsChange = (selected: Option[]) => {
    setValue(
      'partitions',
      selected.map(({ value }) => value)
    );

    setValue(
      'partitionsOffsets',
      selected.map(({ value }) => {
        const currentOffset = offsetsValue?.find(
          ({ partition }) => partition === value
        );
        return { offset: currentOffset?.offset, partition: value };
      })
    );
  };

  React.useEffect(() => {
    onSelectedPartitionsChange([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicValue]);

  const onSubmit = async (data: ConsumerGroupOffsetsReset) => {
    await reset.mutateAsync(data);
    navigate('../');
  };

  return (
    <FormProvider {...methods}>
      <StyledForm onSubmit={handleSubmit(onSubmit)}>
        <FlexFieldset>
          <ControlledSelect
            name="topic"
            label={t('consumerGroups.resetOffsets.fields.topic')}
            placeholder={t('consumerGroups.resetOffsets.placeholders.topic')}
            options={topicOptions}
          />
          <ControlledSelect
            name="resetType"
            label={t('consumerGroups.resetOffsets.fields.resetType')}
            placeholder={t('consumerGroups.resetOffsets.placeholders.resetType')}
            options={resetTypeOptions}
          />
          <div>
            <InputLabel>{t('consumerGroups.resetOffsets.fields.partitions')}</InputLabel>
            <MultiSelect
              options={partitionOptions}
              value={partitionsValue.map((p) => ({
                value: p,
                label: String(p),
              }))}
              onChange={onSelectedPartitionsChange}
              labelledBy={t('consumerGroups.resetOffsets.placeholders.partitions')}
              overrideStrings={{
                selectSomeItems: t(
                  'consumerGroups.resetOffsets.placeholders.partitions'
                ),
              }}
            />
          </div>
          {resetTypeValue === ConsumerGroupOffsetsResetType.TIMESTAMP &&
            partitionsValue.length > 0 && (
              <div>
                <InputLabel>
                  {t('consumerGroups.resetOffsets.fields.timestamp')}
                </InputLabel>
                <Controller
                  control={control}
                  name="resetToTimestamp"
                  rules={{
                    required: t(
                      'consumerGroups.resetOffsets.validation.timestampRequired'
                    ),
                  }}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <S.DatePickerInput
                      ref={ref}
                      selected={new Date(value as number)}
                      onChange={(e: Date | null) => onChange(e?.getTime())}
                      onBlur={onBlur}
                    />
                  )}
                />
                <ErrorMessage
                  errors={errors}
                  name="resetToTimestamp"
                  render={({ message }) => <FormError>{message}</FormError>}
                />
              </div>
            )}

          {resetTypeValue === ConsumerGroupOffsetsResetType.OFFSET &&
            partitionsValue.length > 0 && (
              <S.OffsetsWrapper>
                {fields.map((field, index) => (
                  <Input
                    key={field.id}
                    label={t('consumerGroups.resetOffsets.fields.partitionOffset', {
                      partition: String(field.partition),
                    })}
                    type="number"
                    name={`partitionsOffsets.${index}.offset` as const}
                    hookFormOptions={{
                      shouldUnregister: true,
                      required: t(
                        'consumerGroups.resetOffsets.validation.offsetRequired'
                      ),
                      min: {
                        value: 0,
                        message: t(
                          'consumerGroups.resetOffsets.validation.offsetMin'
                        ),
                      },
                    }}
                    withError
                  />
                ))}
              </S.OffsetsWrapper>
            )}
        </FlexFieldset>
        <div>
          <Button
            buttonSize="M"
            buttonType="primary"
            type="submit"
            disabled={partitionsValue.length === 0}
          >
            {t('consumerGroups.resetOffsets.actions.submit')}
          </Button>
        </div>
      </StyledForm>
    </FormProvider>
  );
};

export default Form;
