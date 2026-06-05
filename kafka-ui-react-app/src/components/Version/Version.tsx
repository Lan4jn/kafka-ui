import React from 'react';
import WarningIcon from 'components/common/Icons/WarningIcon';
import { useTranslation } from 'components/contexts/LocaleContext';
import { gitCommitPath } from 'lib/paths';
import { useLatestVersion } from 'lib/hooks/api/latestVersion';
import { formatTimestamp } from 'lib/dateTimeHelpers';

import * as S from './Version.styled';

const Version: React.FC = () => {
  const { t } = useTranslation();
  const { data: latestVersionInfo = {} } = useLatestVersion();
  const { buildTime, commitId, isLatestRelease, version } =
    latestVersionInfo.build;
  const { versionTag } = latestVersionInfo?.latestRelease || '';

  const currentVersion =
    isLatestRelease && version?.match(versionTag)
      ? versionTag
      : formatTimestamp(buildTime);

  return (
    <S.Wrapper>
      {!isLatestRelease && (
        <S.OutdatedWarning
          title={t('version.outdated.title', {
            version: versionTag || 'UNKNOWN',
          })}
        >
          <WarningIcon />
        </S.OutdatedWarning>
      )}

      {commitId && (
        <div>
          <S.CurrentCommitLink
            title={t('version.currentCommit')}
            target="__blank"
            href={gitCommitPath(commitId)}
          >
            {commitId}
          </S.CurrentCommitLink>
        </div>
      )}
      <S.CurrentVersion>{currentVersion}</S.CurrentVersion>
    </S.Wrapper>
  );
};

export default Version;
