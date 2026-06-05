import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, EventSourceMock, WithRoute } from 'lib/testHelpers';
import Messages from 'components/Topics/Topic/Messages/Messages';
import { SeekDirection, SeekType } from 'generated-sources';
import userEvent from '@testing-library/user-event';
import { clusterTopicMessagesPath } from 'lib/paths';
import { useSerdes } from 'lib/hooks/api/topicMessages';
import { serdesPayload } from 'lib/fixtures/topicMessages';
import { useTopicDetails } from 'lib/hooks/api/topics';
import { externalTopicPayload } from 'lib/fixtures/topics';

jest.mock('lib/hooks/api/topicMessages', () => ({
  useSerdes: jest.fn(),
}));

jest.mock('lib/hooks/api/topics', () => ({
  useTopicDetails: jest.fn(),
}));

describe('Messages', () => {
  const searchParams = `?filterQueryType=STRING_CONTAINS&attempt=0&limit=100&seekDirection=${SeekDirection.FORWARD}&seekType=${SeekType.OFFSET}&seekTo=0::9`;
  const renderComponent = (param: string = searchParams) => {
    const query = new URLSearchParams(param).toString();
    const path = `${clusterTopicMessagesPath()}?${query}`;
    return render(
      <WithRoute path={clusterTopicMessagesPath()}>
        <Messages />
      </WithRoute>,
      {
        initialEntries: [path],
      }
    );
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'zh-CN');
    Object.defineProperty(window, 'EventSource', {
      value: EventSourceMock,
    });
    (useSerdes as jest.Mock).mockImplementation(() => ({
      data: serdesPayload,
    }));
    (useTopicDetails as jest.Mock).mockImplementation(() => ({
      data: externalTopicPayload,
    }));
  });
  describe('component rendering default behavior with the search params', () => {
    beforeEach(() => {
      renderComponent();
    });
    it('should check default seekDirection if it actually take the value from the url', () => {
      expect(screen.getAllByRole('listbox')[3]).toHaveTextContent('最早优先');
    });

    it('should check the SeekDirection select changes with live option', async () => {
      const seekDirectionSelect = screen.getAllByRole('listbox')[3];
      const seekDirectionOption = screen.getAllByRole('option')[3];

      expect(seekDirectionOption).toHaveTextContent('最早优先');

      const labelValue1 = '最新优先';
      await userEvent.click(seekDirectionSelect);
      await userEvent.selectOptions(seekDirectionSelect, [labelValue1]);
      expect(seekDirectionOption).toHaveTextContent(labelValue1);

      const labelValue0 = '最早优先';
      await userEvent.click(seekDirectionSelect);
      await userEvent.selectOptions(seekDirectionSelect, [labelValue0]);
      expect(seekDirectionOption).toHaveTextContent(labelValue0);

      const labelValue2 = '实时模式';
      await userEvent.click(seekDirectionSelect);

      const options = screen.getAllByRole('option');
      const liveModeLi = options.find(
        (option) => option.getAttribute('value') === SeekDirection.TAILING
      );
      expect(liveModeLi).toBeInTheDocument();
      if (!liveModeLi) return; // to make TS happy
      await userEvent.selectOptions(seekDirectionSelect, [liveModeLi]);
      expect(seekDirectionOption).toHaveTextContent(labelValue2);

      await waitFor(() => {
        expect(screen.getByRole('contentLoader')).toBeInTheDocument();
      });
    });

    it('renders localized seek direction options', async () => {
      const seekDirectionSelect = screen.getAllByRole('listbox')[3];

      await userEvent.click(seekDirectionSelect);

      expect(screen.getAllByText('最早优先').length).toBeGreaterThan(0);
      expect(screen.getByText('最新优先')).toBeInTheDocument();
      expect(screen.getByText('实时模式')).toBeInTheDocument();
    });
  });

  describe('Component rendering with custom Url search params', () => {
    it('reacts to a change of seekDirection in the url which make the select pick up different value', () => {
      renderComponent(
        searchParams.replace(SeekDirection.FORWARD, SeekDirection.BACKWARD)
      );
      expect(screen.getAllByRole('listbox')[3]).toHaveTextContent('最新优先');
    });
  });
});
