import React from 'react';
import { render, WithRoute } from 'lib/testHelpers';
import { screen } from '@testing-library/react';
import { clusterConsumerGroupResetOffsetsPath } from 'lib/paths';
import ResetOffsets from 'components/ConsumerGroups/Details/ResetOffsets/ResetOffsets';
import { consumerGroupPayload } from 'lib/fixtures/consumerGroups';
import { useConsumerGroupDetails } from 'lib/hooks/api/consumers';

jest.mock('lib/hooks/api/consumers', () => ({
  useConsumerGroupDetails: jest.fn(),
}));

jest.mock(
  'components/ConsumerGroups/Details/ResetOffsets/Form',
  () => () => <div>ResetOffsetsFormMock</div>
);

const clusterName = 'local';
const consumerGroupID = 'group-id';

describe('ResetOffsets', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useConsumerGroupDetails as jest.Mock).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      data: consumerGroupPayload,
    });
  });

  it('renders localized back link', () => {
    render(
      <WithRoute path={clusterConsumerGroupResetOffsetsPath()}>
        <ResetOffsets />
      </WithRoute>,
      {
        initialEntries: [
          clusterConsumerGroupResetOffsetsPath(clusterName, consumerGroupID),
        ],
      }
    );

    expect(
      screen.getByRole('link', { name: '消费者组' })
    ).toBeInTheDocument();
    expect(screen.getByText('ResetOffsetsFormMock')).toBeInTheDocument();
  });
});
