import React from 'react';
import { Button } from 'components/common/Button/Button';
import { ConfirmContext } from 'components/contexts/ConfirmContext';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './ConfirmationModal.styled';

const ConfirmationModal: React.FC = () => {
  const context = React.useContext(ConfirmContext);
  const { t } = useTranslation();
  const isOpen = context?.content && context?.confirm;

  if (!isOpen) return null;

  return (
    <S.Wrapper role="dialog" aria-label={t('confirmation.aria.dialog')}>
      <S.Overlay onClick={context.cancel} aria-hidden="true" role="button" />
      <S.Modal>
        <S.Header>{t('confirmation.title')}</S.Header>
        <S.Content>{context.content}</S.Content>
        <S.Footer>
          <Button
            buttonType="secondary"
            buttonSize="M"
            onClick={context.cancel}
            type="button"
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            buttonType={context.dangerButton ? 'danger' : 'primary'}
            buttonSize="M"
            onClick={context.confirm}
            type="button"
          >
            {t('common.actions.confirm')}
          </Button>
        </S.Footer>
      </S.Modal>
    </S.Wrapper>
  );
};

export default ConfirmationModal;
