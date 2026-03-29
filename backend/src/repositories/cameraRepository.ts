import type { Camera } from "../types/camera";
import camerasData from "../data/cameras.json";

export class CameraRepository {
  private readonly cameras: Camera[] = camerasData as Camera[];

  getAll(): Camera[] {
    return this.cameras;
  }

  getById(id: string): Camera | null {
    return this.cameras.find((c) => c.id === id) ?? null;
  }
}
