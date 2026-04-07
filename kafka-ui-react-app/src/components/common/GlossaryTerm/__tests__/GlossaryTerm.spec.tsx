import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/dom';
import { render } from 'lib/testHelpers';
import GlossaryTerm from 'components/common/GlossaryTerm';

describe('GlossaryTerm', () => {
  it('renders visible text and shows english original on hover', async () => {
    const english = 'English original';
    const visibleText = 'Visible term';

    render(
      <GlossaryTerm english={english}>
        <span>{visibleText}</span>
      </GlossaryTerm>
    );

    const renderedText = screen.getByText(visibleText);
    expect(renderedText).toBeInTheDocument();
    expect(screen.queryByText(english)).not.toBeInTheDocument();

    await userEvent.hover(renderedText);
    expect(await screen.findByText(english)).toBeInTheDocument();
  });
});
