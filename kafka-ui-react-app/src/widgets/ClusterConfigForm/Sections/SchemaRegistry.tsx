import React from 'react';
import Input from 'components/common/Input/Input';
import { useFormContext } from 'react-hook-form';
import SectionHeader from 'widgets/ClusterConfigForm/common/SectionHeader';
import SSLForm from 'widgets/ClusterConfigForm/common/SSLForm';
import Credentials from 'widgets/ClusterConfigForm/common/Credentials';
import { useTranslation } from 'components/contexts/LocaleContext';

const SchemaRegistry = () => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();
  const schemaRegistry = watch('schemaRegistry');
  const toggleConfig = () => {
    setValue(
      'schemaRegistry',
      schemaRegistry ? undefined : { url: '', isAuth: false },
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );
  };
  return (
    <>
      <SectionHeader
        title={t('clusterConfig.schemaRegistry.title')}
        adding={!schemaRegistry}
        addButtonText={t('clusterConfig.schemaRegistry.addButtonText')}
        onClick={toggleConfig}
      />
      {schemaRegistry && (
        <>
          <Input
            label={t('clusterConfig.common.url')}
            name="schemaRegistry.url"
            type="text"
            placeholder={t('clusterConfig.schemaRegistry.placeholders.url')}
            withError
          />
          <Credentials
            prefix="schemaRegistry"
            title={t('clusterConfig.schemaRegistry.fields.isSecuredWithAuth')}
          />
          <SSLForm
            prefix="schemaRegistry.keystore"
            title={t('clusterConfig.common.keystore')}
          />
        </>
      )}
    </>
  );
};
export default SchemaRegistry;
