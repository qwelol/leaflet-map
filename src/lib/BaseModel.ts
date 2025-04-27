import L from 'leaflet';
import { MapModel } from './MapModel';

export type DeserializeDataType<T extends BaseModel> = ReturnType<T['serialize']>;

export type UUID = ReturnType<typeof crypto.randomUUID>;

export class BaseModel {
  private id = crypto.randomUUID();

  protected parent: BaseModel | null = null;

  public origin: L.Map | L.Polyline | L.Marker | null = null;

  constructor() {}

  public getID = () => this.id;

  public setParent = (parent: BaseModel): void => {
    this.parent = parent;
  };

  public getParentMapModel = (): MapModel => {
    if (!this.parent) {
      throw new Error('Using elemen outside of map');
    }

    if (this.parent instanceof MapModel) {
      return this.parent;
    }

    return this.parent.getParentMapModel();
  };

  public serialize() {
    return { id: this.id };
  }

  public deserialize(data: DeserializeDataType<this>) {
    this.id = data.id;
  }
}
