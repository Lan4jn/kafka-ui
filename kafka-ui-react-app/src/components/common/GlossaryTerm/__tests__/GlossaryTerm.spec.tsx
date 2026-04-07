import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { render } from 'lib/testHelpers';
import { GLOSSARY_TERMS } from 'lib/glossaryTerms';
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

  it('uses glossary constants to show English translation for Chinese term', async () => {
    render(
      <GlossaryTerm english={GLOSSARY_TERMS.CONSUMER_GROUP}>
        消费者组
      </GlossaryTerm>
    );

    const renderedText = screen.getByText('消费者组');
    expect(renderedText).toBeInTheDocument();

    await userEvent.hover(renderedText);
    expect(await screen.findByText(GLOSSARY_TERMS.CONSUMER_GROUP)).toBeInTheDocument();
  });
});
