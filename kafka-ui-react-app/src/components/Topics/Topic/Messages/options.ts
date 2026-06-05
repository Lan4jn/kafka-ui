import { SeekDirection, SeekType } from 'generated-sources';

export const getSeekDirectionOptionsObj = (t: (key: string) => string) => ({
  [SeekDirection.FORWARD]: {
    value: SeekDirection.FORWARD,
    label: t('topics.messages.seekDirection.oldestFirst'),
    isLive: false,
  },
  [SeekDirection.BACKWARD]: {
    value: SeekDirection.BACKWARD,
    label: t('topics.messages.seekDirection.newestFirst'),
    isLive: false,
  },
  [SeekDirection.TAILING]: {
    value: SeekDirection.TAILING,
    label: t('topics.messages.seekDirection.liveMode'),
    isLive: true,
  },
});

export const getSeekDirectionOptions = (t: (key: string) => string) =>
  Object.values(getSeekDirectionOptionsObj(t));

export const getSeekTypeOptions = (t: (key: string) => string) => [
  {
    value: SeekType.OFFSET,
    label: t('topics.messages.filters.seekType.offset'),
  },
  {
    value: SeekType.TIMESTAMP,
    label: t('topics.messages.filters.seekType.timestamp'),
  },
];
