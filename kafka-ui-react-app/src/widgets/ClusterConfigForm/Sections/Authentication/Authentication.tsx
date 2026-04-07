import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AUTH_OPTIONS, SECURITY_PROTOCOL_OPTIONS } from 'lib/constants';
import ControlledSelect from 'components/common/Select/ControlledSelect';
import SectionHeader from 'widgets/ClusterConfigForm/common/SectionHeader';
import { useTranslation } from 'components/contexts/LocaleContext';

import AuthenticationMethods from './AuthenticationMethods';

const Authentication: React.FC = () => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext();
  const hasAuth = !!watch('auth');
  const authMethod = watch('auth.method');
  const hasSecurityProtocolField =
    authMethod && !['Delegation tokens', 'mTLS'].includes(authMethod);

  const toggle = () =>
    setValue('auth', hasAuth ? undefined : {}, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

  return (
    <>
      <SectionHeader
        title={t('clusterConfig.authentication.title')}
        adding={!hasAuth}
        addButtonText={t('clusterConfig.authentication.addButtonText')}
        onClick={toggle}
      />
      {hasAuth && (
        <>
          <ControlledSelect
            name="auth.method"
            label={t('clusterConfig.authentication.fields.method')}
            placeholder={t('clusterConfig.authentication.placeholders.method')}
            options={AUTH_OPTIONS}
          />
          {hasSecurityProtocolField && (
            <ControlledSelect
              name="auth.securityProtocol"
              label={t('clusterConfig.authentication.fields.securityProtocol')}
              placeholder={t(
                'clusterConfig.authentication.placeholders.securityProtocol'
              )}
              options={SECURITY_PROTOCOL_OPTIONS}
            />
          )}
          <AuthenticationMethods method={authMethod} />
        </>
      )}
    </>
  );
};

export default Authentication;
