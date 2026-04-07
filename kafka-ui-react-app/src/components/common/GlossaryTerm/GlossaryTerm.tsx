import React, { type ReactNode } from 'react';
import { Placement } from '@floating-ui/react';
import Tooltip from 'components/common/Tooltip/Tooltip';

interface GlossaryTermProps {
  english: string;
  children: ReactNode;
  placement?: Placement;
}

const GlossaryTerm: React.FC<GlossaryTermProps> = ({
  english,
  children,
  placement,
}) => <Tooltip value={children} content={english} placement={placement} />;

export default GlossaryTerm;
