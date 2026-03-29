export type CameraType = "traffic" | "corporate" | "residential" | "bar_restaurant";
export type CameraStatus = "active" | "inactive";

export type Camera = {
  id: string;
  name: string;
  type: CameraType;
  lat: number;
  lng: number;
  ownerName: string;
  ownerEmail: string;
  coverageDirection: string;
  lastVerified: string;
  status: CameraStatus;
  placeholderImage: string;
  notes: string | null;
};
