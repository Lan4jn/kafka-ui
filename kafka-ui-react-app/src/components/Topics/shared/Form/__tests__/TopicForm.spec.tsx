import React, { PropsWithChildren } from 'react';
import { render } from 'lib/testHelpers';
import { screen } from '@testing-library/dom';
import { FormProvider, useForm } from 'react-hook-form';
import TopicForm, { Props } from 'components/Topics/shared/Form/TopicForm';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

const isSubmitting = false;
const onSubmit = jest.fn();

const renderComponent = (props: Props = { isSubmitting, onSubmit }) => {
  const Wrapper: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
    const methods = useForm();
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

  return render(
    <Wrapper>
      <TopicForm {...props} />
    </Wrapper>
  );
};

const expectByRoleAndNameToBeInDocument = (
  role: string,
  accessibleName: string
) => {
  expect(screen.getByRole(role, { name: accessibleName })).toBeInTheDocument();
};

describe('TopicForm', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
  });

  it('renders', async () => {
    await act(async () => {
      renderComponent();
    });

    expectByRoleAndNameToBeInDocument('textbox', '主题名称 *');

    expectByRoleAndNameToBeInDocument('spinbutton', '分区数 *');
    expectByRoleAndNameToBeInDocument('spinbutton', '副本因子');

    expectByRoleAndNameToBeInDocument('spinbutton', '最小同步副本数');
    expectByRoleAndNameToBeInDocument('listbox', '清理策略');

    expectByRoleAndNameToBeInDocument('spinbutton', '数据保留时长（毫秒）');
    expectByRoleAndNameToBeInDocument('button', '12 小时');
    expectByRoleAndNameToBeInDocument('button', '2 天');
    expectByRoleAndNameToBeInDocument('button', '7 天');
    expectByRoleAndNameToBeInDocument('button', '4 周');

    expectByRoleAndNameToBeInDocument('listbox', '磁盘最大大小（GB）');
    expectByRoleAndNameToBeInDocument('spinbutton', '最大消息大小（字节）');

    expectByRoleAndNameToBeInDocument('heading', '自定义参数');

    expectByRoleAndNameToBeInDocument('button', '创建主题');
  });

  it('submits', async () => {
    await act(async () => {
      renderComponent({
        isSubmitting,
        onSubmit: onSubmit.mockImplementation((e) => e.preventDefault()),
      });
    });

    await userEvent.type(screen.getByPlaceholderText('主题名称'), 'topicName');
    await userEvent.click(screen.getByRole('button', { name: '创建主题' }));

    expect(onSubmit).toBeCalledTimes(1);
  });
});
