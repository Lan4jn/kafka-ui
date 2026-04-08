import React from 'react';
import * as S from 'components/Topics/Topic/Messages/Filters/Filters.styled';
import { Button } from 'components/common/Button/Button';
import { useTranslation } from 'components/contexts/LocaleContext';

interface InfoModalProps {
  toggleIsOpen(): void;
}

const InfoModal: React.FC<InfoModalProps> = ({ toggleIsOpen }) => {
  const { t } = useTranslation();

  return (
    <S.InfoModal>
      <S.InfoParagraph>
        <b>{t('topics.messages.filters.info.variablesTitle')}</b>{' '}
        {t('topics.messages.filters.info.variablesBody')}
      </S.InfoParagraph>
      <S.InfoParagraph>
        <b>{t('topics.messages.filters.info.jsonParsingTitle')}</b>
      </S.InfoParagraph>
      <S.InfoParagraph>
        {t('topics.messages.filters.info.jsonParsingBody')}
      </S.InfoParagraph>
      <S.InfoParagraph>
        <b>{t('topics.messages.filters.info.sampleTitle')}</b>
      </S.InfoParagraph>
      <ol aria-label="info-list">
        <S.ListItem>
          <code>keyAsText != null && keyAsText ~&quot;([Gg])roovy&quot;</code> -
          {t('topics.messages.filters.info.sampleRegex')}
        </S.ListItem>
        <S.ListItem>
          <code>
            value.name == &quot;iS.ListItemax&quot; && value.age &gt; 30
          </code>{' '}
          - {t('topics.messages.filters.info.sampleValueJson')}
        </S.ListItem>
        <S.ListItem>
          <code>value == null && valueAsText != null</code> -{' '}
          {t('topics.messages.filters.info.sampleNullAndText')}
        </S.ListItem>
        <S.ListItem>
          <code>
            headers.sentBy == &quot;some system&quot; &&
            headers[&quot;sentAt&quot;] == &quot;2020-01-01&quot;
          </code>
          {' - '}
          {t('topics.messages.filters.info.sampleHeaders')}
        </S.ListItem>
        <S.ListItem>
          {t('topics.messages.filters.info.multilineTitle')}
          <S.InfoParagraph>
            <pre>
              def name = value.name
              <br />
              def age = value.age
              <br />
              name == &quot;iliax&quot; && age == 30
              <br />
            </pre>
          </S.InfoParagraph>
        </S.ListItem>
      </ol>
      <S.ButtonContainer>
        <Button
          buttonSize="M"
          buttonType="secondary"
          type="button"
          onClick={toggleIsOpen}
        >
          {t('common.actions.ok')}
        </Button>
      </S.ButtonContainer>
    </S.InfoModal>
  );
};

export default InfoModal;
