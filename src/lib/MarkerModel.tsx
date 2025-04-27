import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import { BehaviorSubject, Subscription } from 'rxjs';
import PencilSlash from '../assets/pencil-slash.svg';
import { BaseModel, UUID } from './BaseModel';
import { LinkModel } from './LinkModel';
import DotMarker, { MarkerColorType } from './DotMarker';

const customDivIcon = (content: HTMLDivElement) =>
  L.divIcon({
    className: '',
    html: content,
    iconSize: [20, 40],
    iconAnchor: [6, 6],
    popupAnchor: [0, -25],
  });

export type PositionType = [number, number];

export class MarkerModel extends BaseModel {
  private subscriptions: Subscription[] = [];

  private iconColor: BehaviorSubject<MarkerColorType>;

  public in: UUID | null = null;

  public out: UUID | null = null;

  public origin: L.Marker;

  public position: BehaviorSubject<PositionType>;

  public idx: BehaviorSubject<number>;

  public usable: BehaviorSubject<boolean>;

  constructor(position: PositionType, idx: number) {
    super();

    this.position = new BehaviorSubject<PositionType>(position);
    this.idx = new BehaviorSubject<number>(idx);
    this.usable = new BehaviorSubject<boolean>(true);
    this.iconColor = new BehaviorSubject<MarkerColorType>('blue');

    this.origin = L.marker(position, {
      draggable: true,
      contextmenu: true,
      contextmenuItems: [
        {
          text: 'Удалить',
          callback: this.handleRemove,
          iconCls: 'fa-solid fa-trash-can',
        },
        {
          text: 'Прокладывать',
          callback: this.handleUsableChange(true),
          iconCls: 'fa-solid fa-pencil',
        },
        {
          text: 'Не прокладывать',
          callback: this.handleUsableChange(false),
          icon: PencilSlash,
        },
      ],
    })
      .on('dragend', this.handleDragEnd)
      .on('click', this.handleClick);

    this.origin.on('add', this.checkSelected);
    this.origin.on('add', this.subscribe);
    this.origin.on('remove', () => {
      this.subscriptions.forEach((s) => s.unsubscribe());
    });
  }

  private subscribe = (): void => {
    this.subscriptions.push(this.position.subscribe(this.handlePositionChange));
    this.subscriptions.push(this.idx.subscribe(this.handleIdxChange));
    this.subscriptions.push(this.iconColor.subscribe(this.handleColorChange));
    this.subscriptions.push(this.usable.subscribe(this.watchUsableChange));
  };

  private renderIcon = (label: string, color: MarkerColorType): void => {
    const markerNode = document.createElement('div');

    const root = createRoot(markerNode);
    root.render(<DotMarker label={label} color={color} />);

    const icon = customDivIcon(markerNode);
    this.origin.setIcon(icon);
  };

  private handleDragEnd = (e: L.DragEndEvent): void => {
    const { lat, lng } = e.target.getLatLng();
    this.position.next([lat, lng]);
  };

  private handlePositionChange = (position: PositionType) => this.origin.setLatLng(position);

  private handleIdxChange = (idx: number) => this.renderIcon(idx.toString(), this.iconColor.value);

  private findLink = (id: UUID | null): LinkModel | undefined => {
    const map = this.getParentMapModel();

    return map.getLinks().find((l) => l.getID() === id);
  };

  private handleClick = (): void => {
    const map = this.getParentMapModel();

    if (map.selected.value === this) {
      map.selected.next(null);
    } else {
      map.selected.next(this);
    }
  };

  private selectColor = (isSelected: boolean, usable: boolean): MarkerColorType => {
    if (isSelected) {
      return 'red';
    }

    if (usable) {
      return 'blue';
    }

    return 'grey';
  };

  private checkSelected = (): void => {
    const map = this.getParentMapModel();

    this.subscriptions.push(
      map.selected.subscribe((selected) => {
        const color = this.selectColor(selected === this, this.usable.value);
        this.iconColor.next(color);
      })
    );
  };

  private watchUsableChange = (usable: boolean): void => {
    const map = this.getParentMapModel();
    const selected = map?.selected.value;

    const color = this.selectColor(selected === this, usable);
    this.iconColor.next(color);
  };

  private handleRemove = (): void => {
    const map = this.getParentMapModel();

    map.removeMarker(this.getID());
  };

  private handleColorChange = (color: MarkerColorType) => this.renderIcon(this.idx.value.toString(), color);

  private handleUsableChange = (newValue: boolean) => () => {
    this.usable.next(newValue);
    const map = this.getParentMapModel();

    map.selected.next(null);
  };

  public getInitMarker = (): LinkModel | undefined => this.findLink(this.in);

  public getEndMarker = (): LinkModel | undefined => this.findLink(this.out);

  public getPrev = (): MarkerModel | undefined => {
    const map = this.getParentMapModel();
    const link = map.getLinks().find((l) => l.getID() === this.in);

    return link?.getInitMarker();
  };

  public getNext = (): MarkerModel | undefined => {
    const map = this.getParentMapModel();
    const link = map.getLinks().find((l) => l.getID() === this.out);

    return link?.getEndMarker();
  };

  public serialize() {
    return {
      ...super.serialize(),
      in: this.in,
      out: this.out,
      idx: this.idx.value,
      position: this.position.value,
      usable: this.usable.value,
    };
  }

  public deserialize(data: ReturnType<this['serialize']>): void {
    super.deserialize(data);

    this.in = data.id;
    this.out = data.out;
    this.idx.next(data.idx);
    this.position.next(data.position);
    this.usable.next(data.usable);
  }
}
