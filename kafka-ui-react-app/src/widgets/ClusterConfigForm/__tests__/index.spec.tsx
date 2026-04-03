import React from 'react';
import ClusterConfigForm from 'widgets/ClusterConfigForm';
import { render } from 'lib/testHelpers';
import { screen } from '@testing-library/react';
import { useAppConfigFilesUpload, useUpdateAppConfig, useValidateAppConfig } from 'lib/hooks/api/appConfig';

jest.mock('components/contexts/LocaleContext', () => ({
  ...jest.requireActual('components/contexts/LocaleContext'),
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('lib/hooks/api/appConfig', () => ({
  useAppConfigFilesUpload: jest.fn(),
  useUpdateAppConfig: jest.fn(),
  useValidateAppConfig: jest.fn(),
}));

describe('ClusterConfigForm', () => {
  beforeEach(() => {
    (useAppConfigFilesUpload as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    });
    (useUpdateAppConfig as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    });
    (useValidateAppConfig as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders localized structure with translation keys', () => {
    render(
      <ClusterConfigForm
        initialValues={{
          name: 'local',
          readOnly: true,
          bootstrapServers: [{ host: 'localhost', port: '9092' }],
          truststore: { location: '/tmp/truststore.jks', password: 'secret' },
          auth: {
            method: 'SASL/GSSAPI',
            securityProtocol: 'SASL_SSL',
            props: {
              saslKerberosServiceName: 'kafka',
              keyTabFile: '',
              principal: 'user@LOCAL',
            },
          },
          schemaRegistry: {
            url: 'http://localhost:8081',
            isAuth: true,
            username: 'schema-user',
            password: 'secret',
          },
          kafkaConnect: [
            {
              name: 'connect-1',
              address: 'http://localhost:8083',
              isAuth: true,
              username: 'connect-user',
              password: 'secret',
            },
          ],
          ksql: {
            url: 'http://localhost:8088',
            isAuth: true,
            username: 'ksql-user',
            password: 'secret',
          },
          metrics: {
            type: 'JMX',
            port: '9997',
            isAuth: true,
            username: 'metrics-user',
            password: 'secret',
          },
          customAuth: {},
        }}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'clusterConfig.kafkaCluster.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'clusterConfig.kafkaCluster.fields.name' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: 'clusterConfig.kafkaCluster.fields.readOnly',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('clusterConfig.kafkaCluster.placeholders.host')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'clusterConfig.kafkaCluster.actions.addBootstrapServer',
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', {
        name: 'clusterConfig.actions.removeFromConfig',
      }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'clusterConfig.authentication.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('clusterConfig.authentication.fields.method')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'clusterConfig.schemaRegistry.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'clusterConfig.kafkaConnect.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'clusterConfig.ksql.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'clusterConfig.metrics.title' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'clusterConfig.actions.reset' }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'clusterConfig.actions.validate' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'clusterConfig.actions.submit' })
    ).toBeInTheDocument();
  });
});
