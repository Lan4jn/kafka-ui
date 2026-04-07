import React from 'react';
import { Placement } from '@floating-ui/react';

import Tooltip from 'components/common/Tooltip/Tooltip';

interface GlossaryTermProps {
  english: string;
  children: React.ReactNode;
  placement?: Placement;
}

const GlossaryTerm: React.FC<GlossaryTermProps> = ({ english, children, placement }) => (
  <Tooltip value={<span>{children}</span>} content={english} placement={placement} />
);

export default GlossaryTerm;
