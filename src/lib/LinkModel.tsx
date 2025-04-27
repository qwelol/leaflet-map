import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import { Subscription } from 'rxjs';
import { BaseModel, UUID } from './BaseModel';
import { MarkerModel } from './MarkerModel';
import { metersToPixels } from './metersToPixels';
import AddMarker from './AddMarker';

const TOO_SHORT_LENGTH_PX = 50;

export class LinkModel extends BaseModel {
  private from: UUID;

  private to: UUID;

  private subscriptions: Subscription[] = [];

  public centerMarker: L.Marker | null = null;

  public origin: L.Polyline;

  constructor(from: MarkerModel, to: MarkerModel) {
    super();

    this.from = from.getID();
    this.to = to.getID();

    from.out = this.getID();
    to.in = this.getID();

    this.origin = L.polyline([from.position.value, to.position.value], {
      color: to.usable.value ? 'blue' : 'grey',
      weight: 2,
      opacity: 0.8,
      dashArray: '5, 5',
    });

    this.origin.on('add', this.addButton);
    this.origin.on('add', this.subscribe(from, to));
    this.origin.on('remove', () => this.centerMarker?.remove());

    this.origin.on('remove', () => {
      this.subscriptions.forEach((s) => s.unsubscribe());
    });
  }

  private subscribe = (from: MarkerModel, to: MarkerModel) => (): void => {
    this.subscriptions.push(from.position.subscribe(this.handlePositionChange));
    this.subscriptions.push(to.position.subscribe(this.handlePositionChange));

    this.subscriptions.push(from.position.subscribe(this.addButton));
    this.subscriptions.push(to.position.subscribe(this.addButton));

    this.subscriptions.push(to.usable.subscribe(this.handleUsableChange));
  };

  private handlePositionChange = (): void => {
    const map = this.getParentMapModel();

    const fromMarker = map.getMarkers().find((m) => m.getID() === this.from);
    const toMarker = map.getMarkers().find((m) => m.getID() === this.to);

    if (fromMarker && toMarker) {
      this.origin.setLatLngs([fromMarker.position.value, toMarker.position.value]);
    }
  };

  private findMarker = (id: UUID): MarkerModel | undefined => {
    const map = this.getParentMapModel();

    return map.getMarkers().find((m) => m.getID() === id);
  };

  private addButton = (): void => {
    const map = this.getParentMapModel();

    const fromMarker = map.getMarkers().find((m) => m.getID() === this.from);
    const toMarker = map.getMarkers().find((m) => m.getID() === this.to);

    if (fromMarker && toMarker) {
      const length = metersToPixels(
        map.origin.distance(fromMarker.position.value, toMarker.position.value),
        fromMarker.position.value[0],
        map.origin.getZoom()
      );

      if (length > TOO_SHORT_LENGTH_PX) {
        const center = this.origin.getCenter();

        if (this.centerMarker) {
          this.centerMarker.setLatLng(center);
        } else {
          const markerNode = document.createElement('div');

          const root = createRoot(markerNode);
          root.render(<AddMarker onClick={this.addMarker} />);

          const buttonIcon = L.divIcon({
            className: '',
            html: markerNode,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
          });

          this.centerMarker = L.marker(center, {
            icon: buttonIcon,
            contextmenu: false,
            contextmenuItems: [],
          }).addTo(map.origin);
        }
      } else if (this.centerMarker) {
        this.centerMarker.remove();
        this.centerMarker = null;
      }
    }
  };

  private addMarker = (): void => {
    const map = this.getParentMapModel();
    map.addMarkerBetween(this);
  };

  private handleUsableChange = (usable: boolean): void => {
    this.origin.setStyle({
      color: usable ? 'blue' : 'grey',
    });
  };

  public getInitMarker = (): MarkerModel | undefined => this.findMarker(this.from);

  public getEndMarker = (): MarkerModel | undefined => this.findMarker(this.to);

  public serialize() {
    return {
      ...super.serialize(),
      from: this.from,
      to: this.to,
    };
  }

  public deserialize(data: ReturnType<this['serialize']>): void {
    super.deserialize(data);

    this.from = data.from;
    this.to = data.to;
  }
}
