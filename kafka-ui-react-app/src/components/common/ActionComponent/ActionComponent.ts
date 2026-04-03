import { Placement } from '@floating-ui/react';
import { Action, ResourceType } from 'generated-sources';
import { getCurrentLocale, translateMessage } from 'lib/i18n';

export interface ActionComponentProps {
  permission: {
    resource: ResourceType;
    action: Action | Array<Action>;
    value?: string;
  };
  message?: string;
  placement?: Placement;
}

export function getDefaultActionMessage() {
  return translateMessage(
    'actionComponent.defaultMessage',
    undefined,
    getCurrentLocale()
  );
}
