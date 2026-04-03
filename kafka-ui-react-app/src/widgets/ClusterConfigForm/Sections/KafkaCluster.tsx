import React from 'react';
import Input from 'components/common/Input/Input';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormError, InputHint } from 'components/common/Input/Input.styled';
import { ErrorMessage } from '@hookform/error-message';
import CloseCircleIcon from 'components/common/Icons/CloseCircleIcon';
import { Button } from 'components/common/Button/Button';
import PlusIcon from 'components/common/Icons/PlusIcon';
import * as S from 'widgets/ClusterConfigForm/ClusterConfigForm.styled';
import Heading from 'components/common/heading/Heading.styled';
import { InputLabel } from 'components/common/Input/InputLabel.styled';
import Checkbox from 'components/common/Checkbox/Checkbox';
import SectionHeader from 'widgets/ClusterConfigForm/common/SectionHeader';
import SSLForm from 'widgets/ClusterConfigForm/common/SSLForm';
import { useTranslation } from 'components/contexts/LocaleContext';

const KafkaCluster: React.FC = () => {
  const { t } = useTranslation();
  const { control, watch, setValue } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bootstrapServers',
  });

  const hasTrustStore = !!watch('truststore');

  const toggleSection = (section: string) => () =>
    setValue(
      section,
      watch(section)
        ? undefined
        : {
            location: '',
            password: '',
          },
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );

  return (
    <>
      <Heading level={3}>{t('clusterConfig.kafkaCluster.title')}</Heading>
      <Input
        label={t('clusterConfig.kafkaCluster.fields.name')}
        type="text"
        name="name"
        withError
        hint={t('clusterConfig.kafkaCluster.hints.name')}
      />
      <Checkbox
        name="readOnly"
        label={t('clusterConfig.kafkaCluster.fields.readOnly')}
        hint={t('clusterConfig.kafkaCluster.hints.readOnly')}
      />
      <div>
        <InputLabel htmlFor="bootstrapServers">
          {t('clusterConfig.kafkaCluster.fields.bootstrapServers')}
        </InputLabel>
        <InputHint>
          {t('clusterConfig.kafkaCluster.hints.bootstrapServers')}
        </InputHint>
        <S.GroupFieldWrapper>
          {fields.map((field, index) => (
            <S.BootstrapServer key={field.id}>
              <div>
                <Input
                  name={`bootstrapServers.${index}.host`}
                  placeholder={t('clusterConfig.kafkaCluster.placeholders.host')}
                  type="text"
                  inputSize="L"
                  withError
                />
              </div>
              <div>
                <Input
                  name={`bootstrapServers.${index}.port`}
                  placeholder={t('clusterConfig.kafkaCluster.placeholders.port')}
                  type="number"
                  positiveOnly
                  withError
                />
              </div>
              <S.BootstrapServerActions
                aria-label={t('clusterConfig.actions.removeFromConfig')}
                onClick={() => remove(index)}
              >
                <CloseCircleIcon aria-hidden />
              </S.BootstrapServerActions>
            </S.BootstrapServer>
          ))}
          <FormError>
            <ErrorMessage name="bootstrapServers" />
          </FormError>
          <div>
            <Button
              type="button"
              buttonSize="M"
              buttonType="secondary"
              onClick={() => append({ host: '', port: '' })}
            >
              <PlusIcon />
              {t('clusterConfig.kafkaCluster.actions.addBootstrapServer')}
            </Button>
          </div>
        </S.GroupFieldWrapper>
      </div>
      <hr />
      <SectionHeader
        title={t('clusterConfig.kafkaCluster.truststore.title')}
        addButtonText={t('clusterConfig.kafkaCluster.truststore.addButtonText')}
        adding={!hasTrustStore}
        onClick={toggleSection('truststore')}
      />
      {hasTrustStore && (
        <SSLForm
          prefix="truststore"
          title={t('clusterConfig.kafkaCluster.truststore.title')}
        />
      )}
    </>
  );
};
export default KafkaCluster;
