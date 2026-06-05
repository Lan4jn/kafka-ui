import React, { useCallback, useMemo, useState } from 'react';
import TopicMessagesContext from 'components/contexts/TopicMessagesContext';
import { SeekDirection, SerdeUsage } from 'generated-sources';
import { useSearchParams } from 'react-router-dom';
import { useSerdes } from 'lib/hooks/api/topicMessages';
import useAppParams from 'lib/hooks/useAppParams';
import { RouteParamsClusterTopic } from 'lib/paths';
import { getDefaultSerdeName } from 'components/Topics/Topic/Messages/getDefaultSerdeName';
import { MESSAGES_PER_PAGE } from 'lib/constants';
import { useTranslation } from 'components/contexts/LocaleContext';

import MessagesTable from './MessagesTable';
import FiltersContainer from './Filters/FiltersContainer';
import { getSeekDirectionOptions, getSeekDirectionOptionsObj } from './options';

const Messages: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();

  const { data: serdes = {} } = useSerdes({
    clusterName,
    topicName,
    use: SerdeUsage.DESERIALIZE,
  });

  React.useEffect(() => {
    if (!searchParams.get('keySerde')) {
      searchParams.set('keySerde', getDefaultSerdeName(serdes.key || []));
    }
    if (!searchParams.get('valueSerde')) {
      searchParams.set('valueSerde', getDefaultSerdeName(serdes.value || []));
    }
    if (!searchParams.get('limit')) {
      searchParams.set('limit', MESSAGES_PER_PAGE);
    }
    setSearchParams(searchParams);
  }, [serdes]);

  const seekDirectionOptionsObj = React.useMemo(
    () => getSeekDirectionOptionsObj(t),
    [t]
  );

  const defaultSeekValue = React.useMemo(
    () => getSeekDirectionOptions(t)[0],
    [t]
  );

  const [seekDirection, setSeekDirection] = React.useState<SeekDirection>(
    (searchParams.get('seekDirection') as SeekDirection) ||
      defaultSeekValue.value
  );

  const [isLive, setIsLive] = useState<boolean>(
    seekDirectionOptionsObj[seekDirection].isLive
  );

  const changeSeekDirection = useCallback(
    (val: string) => {
      switch (val) {
        case SeekDirection.FORWARD:
          setSeekDirection(SeekDirection.FORWARD);
          setIsLive(seekDirectionOptionsObj[SeekDirection.FORWARD].isLive);
          break;
        case SeekDirection.BACKWARD:
          setSeekDirection(SeekDirection.BACKWARD);
          setIsLive(seekDirectionOptionsObj[SeekDirection.BACKWARD].isLive);
          break;
        case SeekDirection.TAILING:
          setSeekDirection(SeekDirection.TAILING);
          setIsLive(seekDirectionOptionsObj[SeekDirection.TAILING].isLive);
          break;
        default:
      }
    },
    [seekDirectionOptionsObj]
  );

  const contextValue = useMemo(
    () => ({
      seekDirection,
      changeSeekDirection,
      isLive,
    }),
    [seekDirection, changeSeekDirection]
  );

  return (
    <TopicMessagesContext.Provider value={contextValue}>
      <FiltersContainer />
      <MessagesTable />
    </TopicMessagesContext.Provider>
  );
};

export default Messages;
