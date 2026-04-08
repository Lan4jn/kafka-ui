import React from 'react';
import { MessageFilters } from 'components/Topics/Topic/Messages/Filters/Filters';
import { FilterEdit } from 'components/Topics/Topic/Messages/Filters/FilterModal';
import { useTranslation } from 'components/contexts/LocaleContext';

import AddEditFilterContainer from './AddEditFilterContainer';
import * as S from './Filters.styled';

export interface EditFilterProps {
  editFilter: FilterEdit;
  toggleEditModal(): void;
  editSavedFilter(filter: FilterEdit): void;
}

const EditFilter: React.FC<EditFilterProps> = ({
  editFilter,
  toggleEditModal,
  editSavedFilter,
}) => {
  const { t } = useTranslation();
  const onSubmit = (values: MessageFilters) => {
    editSavedFilter({ index: editFilter.index, filter: values });
    toggleEditModal();
  };
  return (
    <>
      <S.FilterTitle>{t('topics.messages.filters.editTitle')}</S.FilterTitle>
      <AddEditFilterContainer
        cancelBtnHandler={() => toggleEditModal()}
        submitBtnText={t('common.actions.save')}
        inputDisplayNameDefaultValue={editFilter.filter.name}
        inputCodeDefaultValue={editFilter.filter.code}
        submitCallback={onSubmit}
      />
    </>
  );
};

export default EditFilter;
