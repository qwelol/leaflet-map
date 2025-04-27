import { useCallback, useEffect, useId, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { MapModel } from '../lib/MapModel';
import AwesomeButton from './Button';
import PencilSplash from './PencilSplash';

const STORAGE_KEY = 'map';

const Page = styled.div({
  display: 'flex',
  gap: '16px',
  height: '100vh',
});

const Map = styled.div({
  width: '70%',
  height: '100%',
  userSelect: 'none',
});

const ActionBar = styled.div({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  width: '30%',
});

const Row = styled.div({
  display: 'flex',
  gap: '8px',
});

const Layout: React.FC = () => {
  const mapId = useId();
  const checkboxId = useId();

  const [isAddAction, setIsAddAction] = useState(false);
  const [isMarkersShown, setIsMarkersShown] = useState(true);
  const [hasSelectedMarker, setHasSelectedMarker] = useState(false);
  const map = useRef<MapModel | null>(null);

  const handleAddNode = useCallback((e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    map.current?.addMarkerToEnd([lat, lng]);
  }, []);

  const handleDeletedNode = useCallback(() => {
    const selected = map.current?.selected.value;

    if (selected) {
      map.current?.removeMarker(selected.getID());
    }
  }, []);

  const handleAddLink = () => setIsAddAction((a) => !a);

  const handleChangeUsable = useCallback((value: boolean) => {
    const selected = map.current?.selected.value;

    if (selected) {
      selected.usable.next(value);
    }
  }, []);

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsMarkersShown(checked);

    if (checked) {
      map.current?.showMarkers();
    } else {
      setIsAddAction(false);
      map.current?.hideMarkers();
    }
  };

  useEffect(() => {
    if (!map.current) {
      map.current = new MapModel(mapId);
      const preloadedState = sessionStorage.getItem(STORAGE_KEY);

      if (preloadedState) {
        try {
          map.current.deserialize(JSON.parse(preloadedState));
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, [mapId]);

  useEffect(() => {
    const mapInstance = map.current;

    if (isAddAction) {
      mapInstance?.origin.on('click', handleAddNode);
      mapInstance?.origin.dragging.disable();
    }

    return () => {
      mapInstance?.origin.off('click', handleAddNode);
      mapInstance?.origin.dragging.enable();
    };
  }, [isAddAction, handleAddNode]);

  useEffect(() => {
    const subscription = map.current?.selected.subscribe((selected) => {
      if (selected) {
        setHasSelectedMarker(true);
      } else {
        setHasSelectedMarker(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map.current?.serialize()));

      return null;
    });
  }, []);

  return (
    <Page>
      <Map id={mapId} />
      <ActionBar>
        <Row>
          <input type='checkbox' id={checkboxId} checked={isMarkersShown} onChange={handleCheck}></input>
          <label htmlFor={checkboxId}>Показывать опорные узлы</label>
        </Row>
        <Row>
          <AwesomeButton
            type='success'
            text='Узел'
            icon='fa-solid fa-plus'
            pressed={isAddAction}
            disabled={!isMarkersShown}
            onClick={handleAddLink}
          />
          <AwesomeButton
            type='danger'
            text='Узел'
            icon='fa-solid fa-trash-can'
            disabled={!hasSelectedMarker}
            onClick={handleDeletedNode}
          />
        </Row>
        <Row>
          <AwesomeButton
            type='info'
            text='Прокладывать'
            icon='fa-solid fa-pencil'
            disabled={!hasSelectedMarker}
            onClick={() => handleChangeUsable(true)}
          />
          <AwesomeButton
            type='secondary'
            text='Не прокладывать'
            icon={<PencilSplash />}
            disabled={!hasSelectedMarker}
            onClick={() => handleChangeUsable(false)}
          />
        </Row>
      </ActionBar>
    </Page>
  );
};

export default Layout;
