import React from 'react';
import New from 'components/Schemas/New/New';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterSchemaNewPath } from 'lib/paths';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const clusterName = 'local';
const subjectValue = 'subject';
const schemaValue = 'schema';

describe('New Component', () => {
  const renderComponent = async () => {
    localStorage.setItem('locale', 'zh-CN');
    render(
      <WithRoute path={clusterSchemaNewPath()}>
        <New />
      </WithRoute>,
      {
        initialEntries: [clusterSchemaNewPath(clusterName)],
      }
    );
  };

  beforeEach(async () => {
    await act(renderComponent);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders component', async () => {
    expect(screen.getByText('创建')).toBeInTheDocument();
    expect(screen.getByText('Schema 注册表')).toBeInTheDocument();
    expect(screen.getByText('主题 *')).toBeInTheDocument();
    expect(screen.getByText('Schema *')).toBeInTheDocument();
    expect(screen.getByText('Schema 类型 *')).toBeInTheDocument();
  });

  it('submit button will be disabled while form fields are not filled', () => {
    const submitBtn = screen.getByRole('button', { name: /提交/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button will be enabled when form fields are filled', async () => {
    const subject = screen.getByPlaceholderText('Schema 名称');
    const schema = screen.getAllByRole('textbox')[1];
    const schemaTypeSelect = screen.getByRole('listbox');

    await userEvent.type(subject, subjectValue);
    await userEvent.type(schema, schemaValue);
    await userEvent.selectOptions(schemaTypeSelect, ['AVRO']);

    const submitBtn = screen.getByRole('button', { name: /提交/i });
    expect(submitBtn).toBeEnabled();
  });
});
