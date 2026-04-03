import React from 'react';
import { render, WithRoute } from 'lib/testHelpers';
import { screen } from '@testing-library/react';
import { ConsumerGroupOffsetsResetType } from 'generated-sources';
import { clusterConsumerGroupResetOffsetsPath } from 'lib/paths';
import Form from 'components/ConsumerGroups/Details/ResetOffsets/Form';
import { useResetConsumerGroupOffsetsMutation } from 'lib/hooks/api/consumers';

jest.mock('lib/hooks/api/consumers', () => ({
  useResetConsumerGroupOffsetsMutation: jest.fn(),
}));

const clusterName = 'local';
const consumerGroupID = 'group-id';

describe('ResetOffsets Form', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useResetConsumerGroupOffsetsMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it('renders localized fields and placeholders', async () => {
    render(
      <WithRoute path={clusterConsumerGroupResetOffsetsPath()}>
        <Form
          defaultValues={{
            resetType: ConsumerGroupOffsetsResetType.OFFSET,
            topic: 'topic-a',
            partitions: [0],
            partitionsOffsets: [{ partition: 0 }],
            resetToTimestamp: new Date().getTime(),
          }}
          topics={['topic-a']}
          partitions={[
            {
              topic: 'topic-a',
              partition: 0,
              currentOffset: 0,
              endOffset: 0,
              consumerLag: 0,
            },
          ]}
        />
      </WithRoute>,
      {
        initialEntries: [
          clusterConsumerGroupResetOffsetsPath(clusterName, consumerGroupID),
        ],
      }
    );

    expect(screen.getByText('主题')).toBeInTheDocument();
    expect(screen.getByText('重置类型')).toBeInTheDocument();
    expect(screen.getByText('分区')).toBeInTheDocument();
    expect(screen.getByText('按偏移量')).toBeInTheDocument();
    expect(screen.getByText('选择分区')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '重置偏移量' })
    ).toBeInTheDocument();
  });
});
