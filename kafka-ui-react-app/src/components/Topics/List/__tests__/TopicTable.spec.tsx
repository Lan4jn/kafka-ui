import React from 'react';
import { render, WithRoute } from 'lib/testHelpers';
import { screen, within } from '@testing-library/react';
import { CleanUpPolicy, TopicsResponse } from 'generated-sources';
import { externalTopicPayload, topicsPayload } from 'lib/fixtures/topics';
import ClusterContext from 'components/contexts/ClusterContext';
import userEvent from '@testing-library/user-event';
import {
  useClearTopicMessages,
  useDeleteTopic,
  useRecreateTopic,
  useTopics,
} from 'lib/hooks/api/topics';
import TopicTable from 'components/Topics/List/TopicTable';
import { clusterTopicsPath } from 'lib/paths';
import { en } from 'locales/en';
import { useUserInfo } from 'lib/hooks/useUserInfo';

const clusterName = 'test-cluster';

jest.mock('lib/hooks/redux', () => ({
  ...jest.requireActual('lib/hooks/redux'),
  useAppDispatch: jest.fn(),
}));

const getButtonByName = (name: string) => screen.getByRole('button', { name });

jest.mock('lib/hooks/api/topics', () => ({
  ...jest.requireActual('lib/hooks/api/topics'),
  useDeleteTopic: jest.fn(),
  useRecreateTopic: jest.fn(),
  useTopics: jest.fn(),
  useClearTopicMessages: jest.fn(),
}));
jest.mock('lib/hooks/useUserInfo', () => ({
  useUserInfo: jest.fn(),
}));

const deleteTopicMock = jest.fn();
const recreateTopicMock = jest.fn();
const clearTopicMessages = jest.fn();
const defaultRoles = new Map();

describe('TopicTable Components', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'en');
    (useDeleteTopic as jest.Mock).mockImplementation(() => ({
      mutateAsync: deleteTopicMock,
    }));
    (useClearTopicMessages as jest.Mock).mockImplementation(() => ({
      mutateAsync: clearTopicMessages,
    }));
    (useRecreateTopic as jest.Mock).mockImplementation(() => ({
      mutateAsync: recreateTopicMock,
    }));
    (useUserInfo as jest.Mock).mockReturnValue({
      roles: defaultRoles,
      rbacFlag: false,
    });
  });

  const getComponent = (isReadOnly = false, isTopicDeletionAllowed = true) => (
    <ClusterContext.Provider
      value={{
        isReadOnly,
        hasKafkaConnectConfigured: true,
        hasSchemaRegistryConfigured: true,
        isTopicDeletionAllowed,
      }}
    >
      <WithRoute path={clusterTopicsPath()}>
        <TopicTable />
      </WithRoute>
    </ClusterContext.Provider>
  );

  const renderComponent = (
    currentData: TopicsResponse | undefined = undefined,
    isReadOnly = false,
    isTopicDeletionAllowed = true
  ) => {
    (useTopics as jest.Mock).mockImplementation(() => ({
      data: currentData,
    }));

    return render(getComponent(isReadOnly, isTopicDeletionAllowed), {
      initialEntries: [clusterTopicsPath(clusterName)],
    });
  };

  describe('without data', () => {
    it('renders localized empty table when payload is undefined', () => {
      localStorage.setItem('locale', 'zh-CN');
      renderComponent();
      expect(
        screen.getByRole('row', { name: '未找到主题' })
      ).toBeInTheDocument();
    });

    it('renders localized empty table when payload is empty', () => {
      localStorage.setItem('locale', 'zh-CN');
      renderComponent({ topics: [] });
      expect(
        screen.getByRole('row', { name: '未找到主题' })
      ).toBeInTheDocument();
    });
  });
  describe('with topics', () => {
    it('renders localized table headers', () => {
      localStorage.setItem('locale', 'zh-CN');
      renderComponent({ topics: topicsPayload, pageCount: 1 });
      expect(
        screen.getByRole('columnheader', { name: '主题名称' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: '分区数' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: '未同步副本' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: '副本因子' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: '消息数' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: '大小' })
      ).toBeInTheDocument();
    });

    it('renders correct rows', () => {
      renderComponent({ topics: topicsPayload, pageCount: 1 });
      expect(
        screen.getByRole('link', { name: '__internal.topic' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('row', { name: '__internal.topic 1 0 1 0 0 Bytes' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'external.topic' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('row', { name: 'external.topic 1 0 1 0 1 KB' })
      ).toBeInTheDocument();

      expect(screen.getAllByRole('checkbox').length).toEqual(3);
    });
    describe('Selectable rows', () => {
      it('renders selectable rows', () => {
        renderComponent({ topics: topicsPayload, pageCount: 1 });
        expect(screen.getAllByRole('checkbox').length).toEqual(3);
        // Disable checkbox for internal topic
        expect(screen.getAllByRole('checkbox')[1]).toBeDisabled();
        // Disable checkbox for external topic
        expect(screen.getAllByRole('checkbox')[2]).toBeEnabled();
      });
      it('does not render selectable rows for read-only cluster', () => {
        renderComponent({ topics: topicsPayload, pageCount: 1 }, true);
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      });
      describe('Batch actions bar', () => {
        let payload: TopicsResponse;
        let view: ReturnType<typeof renderComponent>;

        beforeEach(() => {
          payload = {
            topics: [
              externalTopicPayload,
              { ...externalTopicPayload, name: 'test-topic' },
            ],
            totalPages: 1,
          };
          view = renderComponent(payload);
          expect(screen.getAllByRole('checkbox').length).toEqual(3);
          expect(screen.getAllByRole('checkbox')[1]).toBeEnabled();
          expect(screen.getAllByRole('checkbox')[2]).toBeEnabled();
        });
        describe('when only one topic is selected', () => {
          beforeEach(async () => {
            await userEvent.click(screen.getAllByRole('checkbox')[1]);
          });
          it('renders batch actions bar', () => {
            expect(getButtonByName('Delete selected topics')).toBeEnabled();
            expect(getButtonByName('Copy selected topic')).toBeEnabled();
            expect(
              getButtonByName(en['topics.actions.purgeSelectedTopics'])
            ).toBeEnabled();
          });
          it('recomputes permitted actions when rbacFlag changes', async () => {
            expect(
              getButtonByName(en['topics.actions.purgeSelectedTopics'])
            ).toBeEnabled();

            (useUserInfo as jest.Mock).mockReturnValue({
              roles: defaultRoles,
              rbacFlag: true,
            });

            view.rerender(getComponent(payload));

            expect(
              getButtonByName(en['topics.actions.purgeSelectedTopics'])
            ).toBeDisabled();
          });
        });
        describe('when more then one topics are selected', () => {
          beforeEach(async () => {
            await userEvent.click(screen.getAllByRole('checkbox')[1]);
            await userEvent.click(screen.getAllByRole('checkbox')[2]);
          });
          it('renders batch actions bar', () => {
            expect(getButtonByName('Delete selected topics')).toBeEnabled();
            expect(getButtonByName('Copy selected topic')).toBeDisabled();
            expect(
              getButtonByName(en['topics.actions.purgeSelectedTopics'])
            ).toBeEnabled();
          });
          it('handels delete button click', async () => {
            const button = getButtonByName('Delete selected topics');
            await userEvent.click(button);
            expect(
              screen.getByText(
                'Are you sure you want to remove selected topics?'
              )
            ).toBeInTheDocument();
            const confirmBtn = getButtonByName('Confirm');
            expect(confirmBtn).toBeInTheDocument();
            expect(deleteTopicMock).not.toHaveBeenCalled();
            await userEvent.click(confirmBtn);
            expect(deleteTopicMock).toHaveBeenCalledTimes(2);
            expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
            expect(screen.getAllByRole('checkbox')[2]).not.toBeChecked();
          });
          it('handels purge messages button click', async () => {
            const button = getButtonByName(
              en['topics.actions.purgeSelectedTopics']
            );
            await userEvent.click(button);
            expect(
              screen.getByText(en['topics.confirmations.purgeSelectedTopics'])
            ).toBeInTheDocument();
            const confirmBtn = getButtonByName('Confirm');
            expect(confirmBtn).toBeInTheDocument();
            expect(clearTopicMessages).not.toHaveBeenCalled();
            await userEvent.click(confirmBtn);
            expect(clearTopicMessages).toHaveBeenCalledTimes(2);
            expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
            expect(screen.getAllByRole('checkbox')[2]).not.toBeChecked();
          });
        });
      });
    });
    describe('Action buttons', () => {
      const expectDropdownExists = async () => {
        const btn = screen.getByRole('button', {
          name: 'Dropdown Toggle',
        });
        expect(btn).toBeEnabled();
        await userEvent.click(btn);
        expect(screen.getByRole('menu')).toBeInTheDocument();
      };
      it('renders disable action buttons for read-only cluster', () => {
        renderComponent({ topics: topicsPayload, pageCount: 1 }, true);
        const btns = screen.getAllByRole('button', { name: 'Dropdown Toggle' });
        expect(btns[0]).toBeDisabled();
        expect(btns[1]).toBeDisabled();
      });
      it('renders action buttons', async () => {
        await renderComponent({ topics: topicsPayload, pageCount: 1 });
        expect(
          screen.getAllByRole('button', { name: 'Dropdown Toggle' }).length
        ).toEqual(2);
        // Internal topic action buttons are disabled
        const internalTopicRow = screen.getByRole('row', {
          name: '__internal.topic 1 0 1 0 0 Bytes',
        });
        expect(internalTopicRow).toBeInTheDocument();
        expect(
          within(internalTopicRow).getByRole('button', {
            name: 'Dropdown Toggle',
          })
        ).toBeDisabled();
        // External topic action buttons are enabled
        const externalTopicRow = screen.getByRole('row', {
          name: 'external.topic 1 0 1 0 1 KB',
        });
        expect(externalTopicRow).toBeInTheDocument();
        const extBtn = within(externalTopicRow).getByRole('button', {
          name: 'Dropdown Toggle',
        });
        expect(extBtn).toBeEnabled();
        await userEvent.click(extBtn);
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      describe('and clear messages action', () => {
        it('is visible for topic with CleanUpPolicy.DELETE', async () => {
          localStorage.setItem('locale', 'zh-CN');
          renderComponent({
            topics: [
              {
                ...topicsPayload[1],
                cleanUpPolicy: CleanUpPolicy.DELETE,
              },
            ],
          });
          await expectDropdownExists();
          const actionBtn = screen.getAllByRole('menuitem');
          expect(actionBtn[0]).toHaveTextContent('清空消息');
          expect(actionBtn[0]).not.toHaveAttribute('aria-disabled');
        });
        it('is disabled for topic without CleanUpPolicy.DELETE', async () => {
          renderComponent({
            topics: [
              {
                ...topicsPayload[1],
                cleanUpPolicy: CleanUpPolicy.COMPACT,
              },
            ],
          });
          await expectDropdownExists();
          const actionBtn = screen.getAllByRole('menuitem');
          expect(actionBtn[0]).toHaveTextContent(
            en['topics.actions.clearMessages']
          );
          expect(actionBtn[0]).toHaveAttribute('aria-disabled');
        });
        it('works as expected', async () => {
          localStorage.setItem('locale', 'zh-CN');
          renderComponent({
            topics: [
              {
                ...topicsPayload[1],
                cleanUpPolicy: CleanUpPolicy.DELETE,
              },
            ],
          });
          await expectDropdownExists();
          await userEvent.click(screen.getByText('清空消息'));
          expect(
            screen.getByText('确定要清空主题消息吗？')
          ).toBeInTheDocument();
          await userEvent.click(screen.getByRole('button', { name: '确认' }));
          expect(clearTopicMessages).toHaveBeenCalled();
        });
      });

      describe('and remove topic action', () => {
        it('is visible only when topic deletion allowed for cluster', async () => {
          renderComponent({ topics: [topicsPayload[1]] });
          await expectDropdownExists();
          const actionBtn = screen.getAllByRole('menuitem');
          expect(actionBtn[2]).toHaveTextContent('Remove Topic');
          expect(actionBtn[2]).not.toHaveAttribute('aria-disabled');
        });
        it('is disabled when topic deletion is not allowed for cluster', async () => {
          renderComponent({ topics: [topicsPayload[1]] }, false, false);
          await expectDropdownExists();
          const actionBtn = screen.getAllByRole('menuitem');
          expect(actionBtn[2]).toHaveTextContent('Remove Topic');
          expect(actionBtn[2]).toHaveAttribute('aria-disabled');
        });
        it('works as expected', async () => {
          renderComponent({ topics: [topicsPayload[1]] });
          await expectDropdownExists();
          await userEvent.click(screen.getByText('Remove Topic'));
          expect(
            screen.getByText(en['confirmation.title'])
          ).toBeInTheDocument();
          await userEvent.click(
            screen.getByRole('button', { name: 'Confirm' })
          );
          expect(deleteTopicMock).toHaveBeenCalled();
        });
      });
      describe('and recreate topic action', () => {
        it('works as expected', async () => {
          renderComponent({ topics: [topicsPayload[1]] });
          await expectDropdownExists();
          await userEvent.click(screen.getByText('Recreate Topic'));
          expect(
            screen.getByText(en['confirmation.title'])
          ).toBeInTheDocument();
          await userEvent.click(
            screen.getByRole('button', { name: 'Confirm' })
          );
          expect(recreateTopicMock).toHaveBeenCalled();
        });
      });
    });
  });
});
