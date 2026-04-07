import React, { FC } from 'react';
import { Button } from 'components/common/Button/Button';
import DeleteIcon from 'components/common/Icons/DeleteIcon';
import { useConfirm } from 'lib/hooks/useConfirm';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './Filters.styled';
import { MessageFilters } from './Filters';

export interface Props {
  filters: MessageFilters[];
  onEdit(index: number, filter: MessageFilters): void;
  deleteFilter(index: number): void;
  activeFilterHandler(activeFilter: MessageFilters, index: number): void;
  closeModal(): void;
  onGoBack(): void;
  activeFilter?: MessageFilters;
}

const SavedFilters: FC<Props> = ({
  filters,
  onEdit,
  deleteFilter,
  activeFilterHandler,
  closeModal,
  onGoBack,
  activeFilter,
}) => {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = React.useState(-1);
  const confirm = useConfirm();

  const activateFilter = () => {
    if (selectedFilter > -1) {
      activeFilterHandler(filters[selectedFilter], selectedFilter);
    }
    closeModal();
  };

  const deleteFilterHandler = (index: number) => {
    const filterName = filters[index]?.name;
    const isFilterSelected = activeFilter && activeFilter.name === filterName;

    confirm(
      <>
        <p>
          {t('topics.messages.filters.saved.confirmDelete', {
            name: filterName || '',
          })}
        </p>
        {isFilterSelected && (
          <>
            <br />
            <p>{t('topics.messages.filters.saved.activeWarning')}</p>
          </>
        )}
      </>,
      () => {
        deleteFilter(index);
        setSelectedFilter(-1);
      }
    );
  };

  return (
    <>
      <S.BackToCustomText onClick={onGoBack}>
        {t('topics.messages.filters.saved.back')}
      </S.BackToCustomText>
      <S.SavedFiltersContainer>
        <S.CreatedFilter>
          {t('topics.messages.filters.saved.title')}
        </S.CreatedFilter>
        {filters.length === 0 && (
          <S.NoSavedFilter>
            {t('topics.messages.filters.saved.empty')}
          </S.NoSavedFilter>
        )}
        {filters.map((filter, index) => (
          <S.SavedFilter
            key={Symbol(filter.name).toString()}
            selected={selectedFilter === index}
            onClick={() => setSelectedFilter(index)}
          >
            <S.SavedFilterName>{filter.name}</S.SavedFilterName>
            <S.FilterOptions>
              <S.FilterEdit onClick={() => onEdit(index, filter)}>
                {t('topics.messages.filters.saved.edit')}
              </S.FilterEdit>
              <S.DeleteSavedFilter onClick={() => deleteFilterHandler(index)}>
                <DeleteIcon />
              </S.DeleteSavedFilter>
            </S.FilterOptions>
          </S.SavedFilter>
        ))}
      </S.SavedFiltersContainer>
      <S.FilterButtonWrapper>
        <Button
          buttonSize="M"
          buttonType="secondary"
          type="button"
          onClick={closeModal}
        >
          {t('topics.messages.filters.cancel')}
        </Button>
        <Button
          buttonSize="M"
          buttonType="primary"
          type="button"
          onClick={activateFilter}
          disabled={selectedFilter === -1}
        >
          {t('topics.messages.filters.saved.select')}
        </Button>
      </S.FilterButtonWrapper>
    </>
  );
};

export default SavedFilters;
