import L from 'leaflet';
import { BehaviorSubject } from 'rxjs';
import { BaseModel, UUID } from './BaseModel';
import { LinkModel } from './LinkModel';
import { MarkerModel, PositionType } from './MarkerModel';

export class MapModel extends BaseModel {
  private models: (MarkerModel | LinkModel)[] = [];

  private isMenuShown = false;

  public selected: BehaviorSubject<MarkerModel | null>;

  public origin: L.Map;

  constructor(element: string | HTMLElement) {
    super();

    this.selected = new BehaviorSubject<MarkerModel | null>(null);
    this.origin = L.map(element).setView([51.505, -0.09], 13);
    this.parent = this;

    this.origin.on('contextmenu.hide', this.handleMenuHide);
    this.origin.on('contextmenu.show', this.handleMenuShow);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.origin);
  }

  private handleMenuShow = () => {
    // to prevent duplication of menu items when contextmenu event is triggered twice
    if (!this.isMenuShown) {
      this.isMenuShown = true;
    } else {
      // TODO: add correct typings
      // eslint-disable-next-line
      return (this.origin as any).contextmenu.hide();
    }

    // eslint-disable-next-line
    const handler = () => (this.origin as any).contextmenu.hide();
    document.addEventListener('click', handler, { once: true });
  };

  private handleMenuHide = () => (this.isMenuShown = false);

  public getMarkers = (): MarkerModel[] => this.models.filter((m) => m instanceof MarkerModel);

  public getLinks = (): LinkModel[] => this.models.filter((m) => m instanceof LinkModel);

  private add = (models: (MarkerModel | LinkModel)[]): void => {
    models.forEach((m) => {
      m.setParent(this);
      m.origin.addTo(this.origin);
      this.models.push(m);
    });

    this.selected.next(null);
  };

  private removeModel = (id: UUID): void => {
    const model = this.models.find((m) => m.getID() === id);

    if (model) {
      this.origin.removeLayer(model.origin);
      this.models = this.models.filter((m) => m.getID() !== id);
    } else {
      console.warn('Attemp to delete unexisiting item', id);
    }

    this.selected.next(null);
  };

  public addMarkerBetween = (link: LinkModel): void => {
    const fromMarker = link.getInitMarker() as MarkerModel;
    const toMarker = link.getEndMarker() as MarkerModel;

    const markers = this.getMarkers();
    const idx = fromMarker.idx.value + 1;

    markers.forEach((m) => {
      if (m.idx.value >= idx) {
        m.idx.next(m.idx.value + 1);
      }
    });

    const { lat, lng } = link.origin.getCenter();
    const newMarker = new MarkerModel([lat, lng], idx);

    const inLink = new LinkModel(fromMarker, newMarker);
    const outLink = new LinkModel(newMarker, toMarker);

    this.removeModel(link.getID());
    this.add([newMarker, inLink, outLink]);
  };

  public addMarkerToEnd = (position: PositionType): void => {
    const markers = this.getMarkers();

    const idx = Math.max(0, ...markers.map((m) => m.idx.value)) + 1;

    const marker = new MarkerModel(position, idx);
    this.add([marker]);

    if (markers.length > 0) {
      const prev = markers.find((m) => m.idx.value === idx - 1);

      if (prev) {
        const link = new LinkModel(prev, marker);
        this.add([link]);
      }
    }
  };

  public removeMarker = (id: UUID): void => {
    const markers = this.getMarkers();
    const marker = markers.find((m) => m.getID() === id);

    if (marker) {
      if (marker.in && !marker.out) {
        this.removeModel(marker.in);
      }

      if (!marker.in && marker.out) {
        this.removeModel(marker.out);
        markers.forEach((m) => m.idx.next(m.idx.value - 1));
      }

      if (marker.in && marker.out) {
        markers.forEach((m) => {
          if (m.idx.value > marker.idx.value) {
            m.idx.next(m.idx.value - 1);
          }
        });

        const prev = marker.getPrev();
        const next = marker.getNext();

        if (prev && next) {
          const link = new LinkModel(prev, next);
          this.add([link]);
        }

        this.removeModel(marker.in);
        this.removeModel(marker.out);
      }

      this.removeModel(id);
    } else {
      console.warn('Attemp to delete unexisiting item', id);
    }
  };

  public hideMarkers = () => {
    this.selected.next(null);
    this.getMarkers().forEach((marker) => marker.origin.remove());
    this.getLinks().forEach((link) => link.centerMarker?.remove());
  };

  public showMarkers = () => {
    this.getMarkers().forEach((marker) => marker.origin.addTo(this.origin));
    this.getLinks().forEach((link) => link.centerMarker?.addTo(this.origin));
  };

  public serialize() {
    return {
      ...super.serialize(),
      markers: this.getMarkers().map((marker) => marker.serialize()),
      links: this.getLinks().map((link) => link.serialize()),
    };
  }

  public deserialize(data: ReturnType<this['serialize']>): void {
    super.deserialize(data);

    const markerModels = data.markers.map((marker, idx) => {
      const model = new MarkerModel(marker.position, idx);
      model.deserialize(marker);

      return model;
    });

    this.add(markerModels);

    const linkModels = data.links.map((link) => {
      const from = markerModels.find((m) => m.getID() === link.from);
      const to = markerModels.find((m) => m.getID() === link.to);

      if (from && to) {
        const model = new LinkModel(from, to);
        model.deserialize(link);
        from.out = model.getID();
        to.in = model.getID();

        return model;
      } else {
        this.models.forEach((m) => this.removeModel(m.getID()));
        throw new Error('Corrupted data');
      }
    });

    this.add(linkModels);
  }
}
