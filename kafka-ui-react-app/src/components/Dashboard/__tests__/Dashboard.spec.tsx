import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from 'components/Dashboard/Dashboard';
import { render } from 'lib/testHelpers';
import { useClusters } from 'lib/hooks/api/clusters';
import { useGetUserInfo } from 'lib/hooks/api/roles';
import { GlobalSettingsContext } from 'components/contexts/GlobalSettingsContext';
import { Cluster, ServerStatus } from 'generated-sources';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

jest.mock('lib/hooks/api/clusters', () => ({
  useClusters: jest.fn(),
}));

jest.mock('lib/hooks/api/roles', () => ({
  useGetUserInfo: jest.fn(),
}));

const mockClusters: Cluster[] = [
  {
    name: 'test-cluster',
    status: ServerStatus.ONLINE,
    brokerCount: 1,
    onlinePartitionCount: 1,
    topicCount: 1,
    bytesInPerSec: 1,
    bytesOutPerSec: 1,
    version: '1.0',
  },
];

describe('Dashboard', () => {
  beforeEach(() => {
    (useClusters as jest.Mock).mockImplementation(() => ({
      data: mockClusters,
      isFetched: true,
    }));
    (useGetUserInfo as jest.Mock).mockImplementation(() => ({
      data: { rbacEnabled: false },
    }));
  });

  it('shows Broker tooltip for the dashboard brokers column label', async () => {
    render(
      <GlobalSettingsContext.Provider value={{ hasDynamicConfig: false }}>
        <Dashboard />
      </GlobalSettingsContext.Provider>
    );

    const header = screen.getByRole('columnheader', {
      name: 'Brokers count',
    });
    expect(header).toBeInTheDocument();
    const label = screen.getByText('Brokers count');

    await userEvent.hover(label);
    expect(await screen.findByText(GLOSSARY_TERMS.BROKER)).toBeInTheDocument();
  });
});
