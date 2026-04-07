import React from 'react';
import { SchemaSubject } from 'generated-sources';
import EditorViewer from 'components/common/EditorViewer/EditorViewer';
import Heading from 'components/common/heading/Heading.styled';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './LatestVersionItem.styled';

interface LatestVersionProps {
  schema: SchemaSubject;
}

const LatestVersionItem: React.FC<LatestVersionProps> = ({
  schema: { id, subject, schema, compatibilityLevel, version, schemaType },
}) => {
  const { t } = useTranslation();

  return (
    <S.Wrapper>
      <div>
        <Heading level={3}>
          {t('schemas.details.latestVersion.actualVersion')}
        </Heading>
        <EditorViewer data={schema} schemaType={schemaType} maxLines={28} />
      </div>
      <div>
        <div>
          <S.MetaDataLabel>
            {t('schemas.details.latestVersion.latestVersion')}
          </S.MetaDataLabel>
          <p>{version}</p>
        </div>
        <div>
          <S.MetaDataLabel>{t('schemas.list.table.id')}</S.MetaDataLabel>
          <p>{id}</p>
        </div>
        <div>
          <S.MetaDataLabel>{t('schemas.list.table.type')}</S.MetaDataLabel>
          <p>{schemaType}</p>
        </div>
        <div>
          <S.MetaDataLabel>{t('schemas.list.table.subject')}</S.MetaDataLabel>
          <p>{subject}</p>
        </div>
        <div>
          <S.MetaDataLabel>
            {t('schemas.details.latestVersion.compatibility')}
          </S.MetaDataLabel>
          <p>{compatibilityLevel}</p>
        </div>
      </div>
    </S.Wrapper>
  );
};

export default LatestVersionItem;
