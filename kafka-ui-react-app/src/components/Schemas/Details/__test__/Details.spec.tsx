import React from 'react';
import Details from 'components/Schemas/Details/Details';
import { render, WithRoute } from 'lib/testHelpers';
import { clusterSchemaPath } from 'lib/paths';
import { screen } from '@testing-library/dom';
import {
  schemasInitialState,
  schemaVersion,
  schemaVersionWithNonAsciiChars,
} from 'redux/reducers/schemas/__test__/fixtures';
import fetchMock from 'fetch-mock';
import ClusterContext, {
  ContextProps,
  initialValue as contextInitialValue,
} from 'components/contexts/ClusterContext';
import { RootState } from 'redux/interfaces';
import { act } from '@testing-library/react';

import { versionPayload, versionEmptyPayload } from './fixtures';

jest.mock('components/contexts/LocaleContext', () => ({
  ...jest.requireActual('components/contexts/LocaleContext'),
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

const clusterName = 'testClusterName';
const schemasAPILatestUrl = `/api/clusters/${clusterName}/schemas/${schemaVersion.subject}/latest`;
const schemasAPIVersionsUrl = `/api/clusters/${clusterName}/schemas/${schemaVersion.subject}/versions`;

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockHistoryPush,
}));

const renderComponent = (
  initialState: RootState['schemas'] = schemasInitialState,
  context: ContextProps = contextInitialValue
) =>
  render(
    <WithRoute path={clusterSchemaPath()}>
      <ClusterContext.Provider value={context}>
        <Details />
      </ClusterContext.Provider>
    </WithRoute>,
    {
      initialEntries: [clusterSchemaPath(clusterName, schemaVersion.subject)],
      preloadedState: {
        schemas: initialState,
      },
    }
  );

describe('Details', () => {
  afterEach(() => {
    fetchMock.reset();
  });

  describe('fetch failed', () => {
    it('renders pageloader', async () => {
      const schemasAPILatestMock = fetchMock.getOnce(schemasAPILatestUrl, 404);
      const schemasAPIVersionsMock = fetchMock.getOnce(
        schemasAPIVersionsUrl,
        404
      );
      await act(() => {
        renderComponent();
      });
      expect(schemasAPILatestMock.called(schemasAPILatestUrl)).toBeTruthy();
      expect(schemasAPIVersionsMock.called(schemasAPIVersionsUrl)).toBeTruthy();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText(schemaVersion.subject)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'schemas.details.actions.edit' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('schemas.details.actions.remove')
      ).not.toBeInTheDocument();
    });
  });

  describe('fetch success', () => {
    describe('has schema versions', () => {
      it('renders component with schema info', async () => {
        const schemasAPILatestMock = fetchMock.getOnce(
          schemasAPILatestUrl,
          schemaVersion
        );
        const schemasAPIVersionsMock = fetchMock.getOnce(
          schemasAPIVersionsUrl,
          versionPayload
        );
        await act(() => {
          renderComponent();
        });
        expect(schemasAPILatestMock.called()).toBeTruthy();
        expect(schemasAPIVersionsMock.called()).toBeTruthy();
        expect(
          screen.getByRole('link', { name: 'schemas.list.title' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', {
            name: 'schemas.details.actions.compareVersions',
          })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: 'schemas.details.actions.edit' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', { name: 'schemas.details.oldVersions' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'schemas.list.table.version' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('columnheader', { name: 'schemas.list.table.type' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    describe('fetch success schema with non ascii characters', () => {
      describe('has schema versions', () => {
        it('renders component with schema info', async () => {
          const schemasAPILatestMock = fetchMock.getOnce(
            schemasAPILatestUrl,
            schemaVersionWithNonAsciiChars
          );
          const schemasAPIVersionsMock = fetchMock.getOnce(
            schemasAPIVersionsUrl,
            versionPayload
          );
          await act(() => {
            renderComponent();
          });
          expect(schemasAPILatestMock.called()).toBeTruthy();
          expect(schemasAPIVersionsMock.called()).toBeTruthy();
          expect(
            screen.getByRole('link', { name: 'schemas.details.actions.edit' })
          ).toBeInTheDocument();
          expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
          expect(screen.getByRole('table')).toBeInTheDocument();
        });
      });
    });

    describe('empty schema versions', () => {
      beforeEach(async () => {
        const schemasAPILatestMock = fetchMock.getOnce(
          schemasAPILatestUrl,
          schemaVersion
        );
        const schemasAPIVersionsMock = fetchMock.getOnce(
          schemasAPIVersionsUrl,
          versionEmptyPayload
        );
        await act(() => {
          renderComponent();
        });
        expect(schemasAPILatestMock.called()).toBeTruthy();
        expect(schemasAPIVersionsMock.called()).toBeTruthy();
      });

      // seems like incorrect behaviour
      it('renders versions table with 0 items', () => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });
});
