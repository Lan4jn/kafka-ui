import userEvent from '@testing-library/user-event';
import { act, screen } from '@testing-library/react';
import { render } from 'lib/testHelpers';
import React from 'react';
import { PreviewFilter } from 'components/Topics/Topic/Messages/Message';
import { serdesPayload } from 'lib/fixtures/topicMessages';
import { useSerdes } from 'lib/hooks/api/topicMessages';
import PreviewModal, {
  InfoModalProps,
} from 'components/Topics/Topic/Messages/PreviewModal';

jest.mock('components/common/Icons/CloseIcon', () => () => 'mock-CloseIcon');

jest.mock('lib/hooks/api/topicMessages', () => ({
  useSerdes: jest.fn(),
}));

beforeEach(async () => {
  localStorage.setItem('locale', 'zh-CN');
  (useSerdes as jest.Mock).mockImplementation(() => ({
    data: serdesPayload,
  }));
});

const toggleInfoModal = jest.fn();
const mockValues: PreviewFilter[] = [
  {
    field: '',
    path: '',
  },
];

const renderComponent = (props?: Partial<InfoModalProps>) => {
  render(
    <PreviewModal
      toggleIsOpen={toggleInfoModal}
      values={mockValues}
      setFilters={jest.fn()}
      {...props}
    />
  );
};

describe('PreviewModal component', () => {
  it('closes PreviewModal', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(toggleInfoModal).toHaveBeenCalledTimes(1);
  });

  it('return if empty inputs', async () => {
    renderComponent();
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('JSON 路径为必填项')).toBeInTheDocument();
    expect(screen.getByText('字段名为必填项')).toBeInTheDocument();
  });

  describe('Input elements', () => {
    const fieldValue = 'type';
    const pathValue = 'schema.type';

    beforeEach(async () => {
      await act(() => {
        renderComponent();
      });
    });

    it('field input', async () => {
      const fieldInput = screen.getByPlaceholderText('字段名');
      expect(fieldInput).toHaveValue('');
      await userEvent.type(fieldInput, fieldValue);
      expect(fieldInput).toHaveValue(fieldValue);
    });

    it('path input', async () => {
      const pathInput = screen.getByPlaceholderText('JSON 路径');
      expect(pathInput).toHaveValue('');
      await userEvent.type(pathInput, pathValue);
      expect(pathInput).toHaveValue(pathValue.toString());
    });
  });

  describe('edit and remove functionality', () => {
    const fieldValue = 'type new';
    const pathValue = 'schema.type.new';

    it('remove values', async () => {
      const setFilters = jest.fn();
      await act(() => {
        renderComponent({ setFilters });
      });
      await userEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(setFilters).toHaveBeenCalledTimes(1);
    });

    it('edit values', async () => {
      const setFilters = jest.fn();
      const toggleIsOpen = jest.fn();
      await act(() => {
        renderComponent({ setFilters });
      });
      userEvent.click(screen.getByRole('button', { name: '编辑' }));
      const fieldInput = screen.getByPlaceholderText('字段名');
      userEvent.type(fieldInput, fieldValue);
      const pathInput = screen.getByPlaceholderText('JSON 路径');
      userEvent.type(pathInput, pathValue);
      userEvent.click(screen.getByRole('button', { name: '保存' }));
      await act(() => {
        renderComponent({ setFilters, toggleIsOpen });
      });
    });
  });
});
