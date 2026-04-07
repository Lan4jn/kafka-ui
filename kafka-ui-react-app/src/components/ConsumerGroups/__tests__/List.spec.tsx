import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from 'components/ConsumerGroups/List';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterConsumerGroupsPath } from 'lib/paths';
import { useConsumerGroups } from 'lib/hooks/api/consumers';
import { consumerGroupPayload } from 'lib/fixtures/consumerGroups';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';

jest.mock('lib/hooks/api/consumers', () => ({
  useConsumerGroups: jest.fn(),
}));

describe('ConsumerGroups List glossary tooltip', () => {
  const clusterName = 'cluster1';

  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
    (useConsumerGroups as jest.Mock).mockReturnValue({
      data: {
        pageCount: 1,
        consumerGroups: [consumerGroupPayload],
      },
      isSuccess: true,
      isFetching: false,
    });
  });

  it('shows english original for consumer lag term on hover', async () => {
    render(
      <WithRoute path={clusterConsumerGroupsPath()}>
        <List />
      </WithRoute>,
      {
        initialEntries: [clusterConsumerGroupsPath(clusterName)],
      }
    );

    expect(
      screen.queryByText(GLOSSARY_TERMS.CONSUMER_LAG)
    ).not.toBeInTheDocument();

    await userEvent.hover(screen.getByText('消费积压'));

    expect(screen.getByText(GLOSSARY_TERMS.CONSUMER_LAG)).toBeInTheDocument();
  });
});
