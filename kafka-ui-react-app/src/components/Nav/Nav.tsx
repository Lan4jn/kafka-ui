import { useClusters } from 'lib/hooks/api/clusters';
import React from 'react';
import { useTranslation } from 'components/contexts/LocaleContext';

import ClusterMenu from './ClusterMenu';
import ClusterMenuItem from './ClusterMenuItem';
import * as S from './Nav.styled';

const Nav: React.FC = () => {
  const clusters = useClusters();
  const { t } = useTranslation();

  return (
    <aside aria-label="Sidebar Menu">
      <S.List>
        <ClusterMenuItem to="/" title={t('nav.dashboard')} isTopLevel />
      </S.List>
      {clusters.isSuccess &&
        clusters.data.map((cluster) => (
          <ClusterMenu
            cluster={cluster}
            key={cluster.name}
            singleMode={clusters.data.length === 1}
          />
        ))}
    </aside>
  );
};

export default Nav;
