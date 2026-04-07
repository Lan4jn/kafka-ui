import React from 'react';
import Overview from 'components/Connect/Details/Overview/Overview';
import { connector, tasks } from 'lib/fixtures/kafkaConnect';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib/testHelpers';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';
import { useConnector, useConnectorTasks } from 'lib/hooks/api/kafkaConnect';

jest.mock('lib/hooks/api/kafkaConnect', () => ({
  useConnector: jest.fn(),
  useConnectorTasks: jest.fn(),
}));

describe('Overview', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('is empty when no connector', () => {
    (useConnector as jest.Mock).mockImplementation(() => ({
      data: undefined,
    }));
    (useConnectorTasks as jest.Mock).mockImplementation(() => ({
      data: undefined,
    }));

    render(<Overview />);
    expect(screen.queryByText('Worker')).not.toBeInTheDocument();
  });

  describe('when connector is loaded', () => {
    beforeEach(() => {
      (useConnector as jest.Mock).mockImplementation(() => ({
        data: connector,
      }));
    });
    beforeEach(() => {
      (useConnectorTasks as jest.Mock).mockImplementation(() => ({
        data: tasks,
      }));
    });

    it('renders metrics', () => {
      render(<Overview />);

      expect(screen.getByText('Worker')).toBeInTheDocument();
      expect(
        screen.getByText(connector.status.workerId as string)
      ).toBeInTheDocument();

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(
        screen.getByText(connector.config['connector.class'] as string)
      ).toBeInTheDocument();

      expect(screen.getByText('Tasks Running')).toBeInTheDocument();
      expect(screen.getByText(2)).toBeInTheDocument();
      expect(screen.getByText('Tasks Failed')).toBeInTheDocument();
      expect(screen.getByText(1)).toBeInTheDocument();
    });

    it('renders localized metric labels in Chinese', async () => {
      localStorage.setItem('locale', 'zh-CN');

      render(<Overview />);

      expect(screen.getByText('Worker')).toBeInTheDocument();
      expect(screen.getByText('类型')).toBeInTheDocument();
      expect(screen.getByText('类')).toBeInTheDocument();
      expect(
        screen.queryByText(GLOSSARY_TERMS.CONNECTOR)
      ).not.toBeInTheDocument();

      await userEvent.hover(screen.getByText('类'));

      expect(
        await screen.findByText(GLOSSARY_TERMS.CONNECTOR)
      ).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
      expect(screen.getByText('运行中的任务')).toBeInTheDocument();
      expect(screen.getByText('失败的任务')).toBeInTheDocument();
    });
  });
});
