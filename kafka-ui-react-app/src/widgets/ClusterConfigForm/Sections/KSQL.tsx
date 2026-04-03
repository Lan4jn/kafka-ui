import React from 'react';
import Input from 'components/common/Input/Input';
import { useFormContext } from 'react-hook-form';
import SectionHeader from 'widgets/ClusterConfigForm/common/SectionHeader';
import SSLForm from 'widgets/ClusterConfigForm/common/SSLForm';
import Credentials from 'widgets/ClusterConfigForm/common/Credentials';
import { useTranslation } from 'components/contexts/LocaleContext';

const KSQL = () => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();
  const ksql = watch('ksql');
  const toggleConfig = () => {
    setValue('ksql', ksql ? undefined : { url: '', isAuth: false }, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  return (
    <>
      <SectionHeader
        title={t('clusterConfig.ksql.title')}
        adding={!ksql}
        addButtonText={t('clusterConfig.ksql.addButtonText')}
        onClick={toggleConfig}
      />
      {ksql && (
        <>
          <Input
            label={t('clusterConfig.common.url')}
            name="ksql.url"
            type="text"
            placeholder={t('clusterConfig.ksql.placeholders.url')}
            withError
          />
          <Credentials
            prefix="ksql"
            title={t('clusterConfig.ksql.fields.isSecuredWithAuth')}
          />
          <SSLForm
            prefix="ksql.keystore"
            title={t('clusterConfig.ksql.keystore.title')}
          />
        </>
      )}
    </>
  );
};
export default KSQL;
