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
    name: 'local',
    status: ServerStatus.ONLINE,
    brokerCount: 3,
    onlinePartitionCount: 1,
    topicCount: 2,
    bytesInPerSec: 100,
    bytesOutPerSec: 50,
    version: '3.0',
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

  it('shows Broker tooltip for the Dashboard brokers column label', async () => {
    render(
      <GlobalSettingsContext.Provider value={{ hasDynamicConfig: false }}>
        <Dashboard />
      </GlobalSettingsContext.Provider>
    );

    const header = screen.getByRole('columnheader', { name: 'Broker 数量' });
    expect(header).toBeInTheDocument();

    const label = screen.getByText('Broker 数量');
    await userEvent.hover(label);
    expect(await screen.findByText(GLOSSARY_TERMS.BROKER)).toBeInTheDocument();
  });
});
