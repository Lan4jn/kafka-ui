import React from 'react';
import Input from 'components/common/Input/Input';
import Checkbox from 'components/common/Checkbox/Checkbox';
import Fileupload from 'widgets/ClusterConfigForm/common/Fileupload';
import SSLForm from 'widgets/ClusterConfigForm/common/SSLForm';
import Credentials from 'widgets/ClusterConfigForm/common/Credentials';
import { useTranslation } from 'components/contexts/LocaleContext';

const AuthenticationMethods: React.FC<{ method: string }> = ({ method }) => {
  const { t } = useTranslation();

  switch (method) {
    case 'SASL/JAAS':
      return (
        <>
          <Input
            type="text"
            name="auth.props.saslJaasConfig"
            label={t('clusterConfig.authentication.methods.saslJaasConfig')}
            withError
          />
          <Input
            type="text"
            name="auth.props.saslMechanism"
            label={t('clusterConfig.authentication.methods.saslMechanism')}
            withError
          />
        </>
      );
    case 'SASL/GSSAPI':
      return (
        <>
          <Input
            label={t('clusterConfig.authentication.methods.kerberosServiceName')}
            type="text"
            name="auth.props.saslKerberosServiceName"
            withError
          />
          <Checkbox
            name="auth.props.storeKey"
            label={t('clusterConfig.authentication.methods.storeKey')}
          />
          <Fileupload
            name="auth.props.keyTabFile"
            label={t('clusterConfig.authentication.methods.keyTab')}
          />
          <Input
            type="text"
            name="auth.props.principal"
            label={t('clusterConfig.authentication.methods.principal')}
            withError
          />
        </>
      );
    case 'SASL/OAUTHBEARER':
      return (
        <Input
          label={t(
            'clusterConfig.authentication.methods.unsecuredLoginStringClaimSub'
          )}
          type="text"
          name="auth.props.unsecuredLoginStringClaim_sub"
          withError
        />
      );
    case 'SASL/PLAIN':
    case 'SASL/SCRAM-256':
    case 'SASL/SCRAM-512':
    case 'SASL/LDAP':
      return <Credentials prefix="auth.props" />;
    case 'Delegation tokens':
      return (
        <>
          <Input
            label={t('clusterConfig.authentication.methods.tokenId')}
            type="text"
            name="auth.props.tokenId"
            withError
          />
          <Input
            label={t('clusterConfig.authentication.methods.tokenValue')}
            type="text"
            name="auth.props.tokenValue"
            withError
          />
        </>
      );
    case 'SASL/AWS IAM':
      return (
        <Input
          label={t('clusterConfig.authentication.methods.awsProfileName')}
          type="text"
          name="auth.props.awsProfileName"
          withError
        />
      );
    case 'mTLS':
      return (
        <SSLForm prefix="auth.keystore" title={t('clusterConfig.common.keystore')} />
      );
    default:
      return null;
  }
};

export default AuthenticationMethods;
