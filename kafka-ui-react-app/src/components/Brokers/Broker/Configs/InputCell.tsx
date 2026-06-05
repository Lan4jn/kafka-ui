import React, { useEffect } from 'react';
import { CellContext } from '@tanstack/react-table';
import CheckmarkIcon from 'components/common/Icons/CheckmarkIcon';
import EditIcon from 'components/common/Icons/EditIcon';
import CancelIcon from 'components/common/Icons/CancelIcon';
import { useConfirm } from 'lib/hooks/useConfirm';
import { Action, BrokerConfig, ResourceType } from 'generated-sources';
import { Button } from 'components/common/Button/Button';
import Input from 'components/common/Input/Input';
import { ActionButton } from 'components/common/ActionComponent';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './Configs.styled';

interface InputCellProps extends CellContext<BrokerConfig, unknown> {
  onUpdate: (name: string, value?: string) => void;
}

const InputCell: React.FC<InputCellProps> = ({ row, getValue, onUpdate }) => {
  const initialValue = `${getValue<string | number>()}`;
  const [isEdit, setIsEdit] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);
  const { t } = useTranslation();

  const confirm = useConfirm();

  const onSave = () => {
    if (value !== initialValue) {
      confirm(t('brokers.configs.confirmChangeValue'), async () => {
        onUpdate(row?.original?.name, value);
      });
    }
    setIsEdit(false);
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return isEdit ? (
    <S.ValueWrapper>
      <Input
        type="text"
        inputSize="S"
        value={value}
        aria-label={t('brokers.configs.aria.inputValue')}
        onChange={({ target }) => setValue(target?.value)}
      />
      <S.ButtonsWrapper>
        <Button
          buttonType="primary"
          buttonSize="S"
          aria-label={t('brokers.configs.aria.confirmAction')}
          onClick={onSave}
        >
          <CheckmarkIcon /> {t('brokers.configs.actions.save')}
        </Button>
        <Button
          buttonType="primary"
          buttonSize="S"
          aria-label={t('brokers.configs.aria.cancelAction')}
          onClick={() => setIsEdit(false)}
        >
          <CancelIcon /> {t('brokers.configs.actions.cancel')}
        </Button>
      </S.ButtonsWrapper>
    </S.ValueWrapper>
  ) : (
    <S.ValueWrapper
      style={
        row?.original?.source === 'DYNAMIC_BROKER_CONFIG'
          ? { fontWeight: 600 }
          : { fontWeight: 400 }
      }
    >
      <S.Value title={initialValue}>{initialValue}</S.Value>
      <ActionButton
        buttonType="primary"
        buttonSize="S"
        aria-label={t('brokers.configs.aria.editAction')}
        onClick={() => setIsEdit(true)}
        permission={{
          resource: ResourceType.CLUSTERCONFIG,
          action: Action.EDIT,
        }}
      >
        <EditIcon /> {t('brokers.configs.actions.edit')}
      </ActionButton>
    </S.ValueWrapper>
  );
};

export default InputCell;
