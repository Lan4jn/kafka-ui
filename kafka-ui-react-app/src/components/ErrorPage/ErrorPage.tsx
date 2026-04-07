import React from 'react';
import { Button } from 'components/common/Button/Button';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './ErrorPage.styled';

interface Props {
  status?: number;
  text?: string;
  btnText?: string;
}

const ErrorPage: React.FC<Props> = ({ status = 404, text, btnText }) => {
  const { t } = useTranslation();
  return (
    <S.Wrapper>
      <S.Status>{status}</S.Status>
      <S.Text>{text || t('errorPage.text')}</S.Text>
      <Button buttonType="primary" buttonSize="M" to="/">
        {btnText || t('errorPage.button')}
      </Button>
    </S.Wrapper>
  );
};

export default ErrorPage;
