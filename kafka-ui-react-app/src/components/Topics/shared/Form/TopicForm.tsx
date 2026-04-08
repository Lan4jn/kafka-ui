import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { NOT_SET, BYTES_IN_GB } from 'lib/constants';
import { ClusterName, TopicConfigParams, TopicName } from 'redux/interfaces';
import { ErrorMessage } from '@hookform/error-message';
import Select, { SelectOption } from 'components/common/Select/Select';
import Input from 'components/common/Input/Input';
import { Button } from 'components/common/Button/Button';
import { InputLabel } from 'components/common/Input/InputLabel.styled';
import { FormError } from 'components/common/Input/Input.styled';
import { StyledForm } from 'components/common/Form/Form.styled';
import { clusterTopicPath } from 'lib/paths';
import { useNavigate } from 'react-router-dom';
import useAppParams from 'lib/hooks/useAppParams';
import { useTranslation } from 'components/contexts/LocaleContext';

import CustomParams from './CustomParams/CustomParams';
import TimeToRetain from './TimeToRetain';
import * as S from './TopicForm.styled';

export interface Props {
  config?: TopicConfigParams;
  topicName?: TopicName;
  partitionCount?: number;
  replicationFactor?: number;
  inSyncReplicas?: number;
  retentionBytes?: number;
  cleanUpPolicy?: string;
  isEditing?: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.BaseSyntheticEvent) => Promise<void>;
}

export const getCleanUpPolicyValue = (cleanUpPolicy?: string) => {
  if (!cleanUpPolicy) return undefined;

  return ['delete', 'compact', 'compact,delete']
    .find((option) => {
      return (
        option.toString().replace(/,/g, '_') === cleanUpPolicy?.toLowerCase()
      );
    })
    ?.toString();
};

const TopicForm: React.FC<Props> = ({
  config,
  retentionBytes,
  topicName,
  isEditing,
  isSubmitting,
  onSubmit,
  cleanUpPolicy,
}) => {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors, isDirty, isValid },
    reset,
  } = useFormContext();
  const navigate = useNavigate();
  const { clusterName } = useAppParams<{ clusterName: ClusterName }>();
  const cleanupPolicyOptions: Array<SelectOption> = [
    {
      value: 'delete',
      label: t('topics.form.cleanupPolicy.delete'),
    },
    {
      value: 'compact',
      label: t('topics.form.cleanupPolicy.compact'),
    },
    {
      value: 'compact,delete',
      label: t('topics.form.cleanupPolicy.compactDelete'),
    },
  ];
  const retentionBytesOptions: Array<SelectOption> = [
    { value: NOT_SET, label: t('topics.form.retentionBytes.notSet') },
    { value: BYTES_IN_GB, label: t('topics.form.retentionBytes.gb1') },
    { value: BYTES_IN_GB * 10, label: t('topics.form.retentionBytes.gb10') },
    { value: BYTES_IN_GB * 20, label: t('topics.form.retentionBytes.gb20') },
    { value: BYTES_IN_GB * 50, label: t('topics.form.retentionBytes.gb50') },
  ];
  const getCleanUpPolicy =
    getCleanUpPolicyValue(cleanUpPolicy) || cleanupPolicyOptions[0].value;

  const getRetentionBytes =
    retentionBytesOptions.find((option: SelectOption) => {
      return option.value === retentionBytes;
    })?.value || retentionBytesOptions[0].value;

  const onCancel = () => {
    reset();
    navigate(clusterTopicPath(clusterName, topicName));
  };

  return (
    <StyledForm onSubmit={onSubmit} aria-label={t('topics.form.ariaLabel')}>
      <fieldset disabled={isSubmitting}>
        <fieldset disabled={isEditing}>
          <S.Column>
            <S.NameField>
              <InputLabel htmlFor="topicFormName">
                {t('topics.form.fields.name')}
              </InputLabel>
              <Input
                id="topicFormName"
                autoFocus
                name="name"
                placeholder={t('topics.form.placeholders.name')}
                defaultValue={topicName}
                autoComplete="off"
              />
              <FormError>
                <ErrorMessage errors={errors} name="name" />
              </FormError>
            </S.NameField>
          </S.Column>

          <S.Column>
            {!isEditing && (
              <div>
                <InputLabel htmlFor="topicFormNumberOfPartitions">
                  {t('topics.form.fields.partitions')}
                </InputLabel>
                <Input
                  id="topicFormNumberOfPartitions"
                  type="number"
                  placeholder={t('topics.form.placeholders.partitions')}
                  min="1"
                  name="partitions"
                  positiveOnly
                  integerOnly
                />
                <FormError>
                  <ErrorMessage errors={errors} name="partitions" />
                </FormError>
              </div>
            )}

            <div>
              <InputLabel
                id="topicFormCleanupPolicyLabel"
                htmlFor="topicFormCleanupPolicy"
              >
                {t('topics.form.fields.cleanupPolicy')}
              </InputLabel>
              <Controller
                defaultValue={cleanupPolicyOptions[0].value}
                control={control}
                name="cleanupPolicy"
                render={({ field: { name, onChange } }) => (
                  <Select
                    id="topicFormCleanupPolicy"
                    aria-labelledby="topicFormCleanupPolicyLabel"
                    name={name}
                    value={getCleanUpPolicy}
                    onChange={onChange}
                    minWidth="250px"
                    options={cleanupPolicyOptions}
                  />
                )}
              />
            </div>
          </S.Column>
        </fieldset>

        <S.Column>
          <div>
            <InputLabel htmlFor="topicFormMinInSyncReplicas">
              {t('topics.form.fields.minInSyncReplicas')}
            </InputLabel>
            <Input
              id="topicFormMinInSyncReplicas"
              type="number"
              placeholder={t('topics.form.placeholders.minInSyncReplicas')}
              min="1"
              name="minInSyncReplicas"
              positiveOnly
              integerOnly
            />
            <FormError>
              <ErrorMessage errors={errors} name="minInSyncReplicas" />
            </FormError>
          </div>
          {!isEditing && (
            <div>
              <InputLabel htmlFor="topicFormReplicationFactor">
                {t('topics.form.fields.replicationFactor')}
              </InputLabel>
              <Input
                id="topicFormReplicationFactor"
                type="number"
                placeholder={t('topics.form.placeholders.replicationFactor')}
                min="1"
                name="replicationFactor"
                positiveOnly
                integerOnly
              />
              <FormError>
                <ErrorMessage errors={errors} name="replicationFactor" />
              </FormError>
            </div>
          )}
        </S.Column>

        <S.Column>
          <div>
            <TimeToRetain isSubmitting={isSubmitting} />
          </div>
        </S.Column>

        <S.Column>
          <div>
            <InputLabel
              id="topicFormRetentionBytesLabel"
              htmlFor="topicFormRetentionBytes"
            >
              {t('topics.form.fields.retentionBytes')}
            </InputLabel>
            <Controller
              control={control}
              name="retentionBytes"
              defaultValue={retentionBytesOptions[0].value}
              render={({ field: { name, onChange } }) => (
                <Select
                  id="topicFormRetentionBytes"
                  aria-labelledby="topicFormRetentionBytesLabel"
                  name={name}
                  value={getRetentionBytes}
                  onChange={onChange}
                  minWidth="100%"
                  options={retentionBytesOptions}
                />
              )}
            />
          </div>

          <div>
            <InputLabel htmlFor="topicFormMaxMessageBytes">
              {t('topics.form.fields.maxMessageBytes')}
            </InputLabel>
            <S.MessageSizeInput
              id="topicFormMaxMessageBytes"
              type="number"
              placeholder={t('topics.form.placeholders.maxMessageBytes')}
              min="1"
              name="maxMessageBytes"
              positiveOnly
              integerOnly
            />
            <FormError>
              <ErrorMessage errors={errors} name="maxMessageBytes" />
            </FormError>
          </div>
        </S.Column>

        <S.CustomParamsHeading>
          {t('topics.form.customParameters')}
        </S.CustomParamsHeading>
        <CustomParams
          config={config}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
        />
        <S.ButtonWrapper>
          <Button
            type="button"
            buttonType="secondary"
            buttonSize="L"
            onClick={onCancel}
          >
            {t('topics.form.actions.cancel')}
          </Button>
          <Button
            type="submit"
            buttonType="primary"
            buttonSize="L"
            disabled={!isValid || isSubmitting || !isDirty}
          >
            {isEditing
              ? t('topics.form.actions.update')
              : t('topics.form.actions.create')}
          </Button>
        </S.ButtonWrapper>
      </fieldset>
    </StyledForm>
  );
};

export default TopicForm;
