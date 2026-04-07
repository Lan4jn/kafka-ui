import React from 'react';
import LatestVersionItem from 'components/Schemas/Details/LatestVersion/LatestVersionItem';
import { render } from 'lib/testHelpers';
import { screen } from '@testing-library/react';

import { jsonSchema, protoSchema } from './fixtures';

describe('LatestVersionItem', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'zh-CN');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders latest version of json schema', () => {
    render(<LatestVersionItem schema={jsonSchema} />);
    expect(screen.getByText('当前版本')).toBeInTheDocument();
    expect(screen.getByText('最新版本')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('主题')).toBeInTheDocument();
    expect(screen.getByText('兼容级别')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders latest version of compatibility', () => {
    render(<LatestVersionItem schema={protoSchema} />);
    expect(screen.getByText('当前版本')).toBeInTheDocument();
    expect(screen.getByText('最新版本')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('主题')).toBeInTheDocument();
    expect(screen.getByText('兼容级别')).toBeInTheDocument();
    expect(screen.getByText('BACKWARD')).toBeInTheDocument();
  });
});
