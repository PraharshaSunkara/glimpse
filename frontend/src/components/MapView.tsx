import { useEffect, useState } from "react";
import DeckGL from "deck.gl";
import { ScatterplotLayer, PolygonLayer, PathLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Camera } from "../types/camera";
import CameraDetailPanel from "./CameraDetailPanel";
import FinalizationModal from "./FinalizationModal";
import type { SendRequestParams } from "./FinalizationModal";
import { booleanPointInPolygon, point, area } from "@turf/turf";
import type { Feature, Polygon } from "geojson";

const INITIAL_VIEW_STATE = {
  latitude: 32.7847,
  longitude: -96.797,
  zoom: 14,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type Color = [number, number, number];

const TYPE_COLORS: Record<Camera["type"], Color> = {
  traffic: [46, 117, 182],
  corporate: [176, 112, 0],
  residential: [45, 106, 45],
  bar_restaurant: [107, 63, 160],
};

const INACTIVE_COLOR: Color = [136, 136, 136];

function getCameraColor(camera: Camera): Color {
  if (camera.status === "inactive") return INACTIVE_COLOR;
  return TYPE_COLORS[camera.type];
}

type Props = {
  onLoadingChange: (loading: boolean) => void;
};

export default function MapView({ onLoadingChange }: Props) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [drawMode, setDrawMode] = useState<"rectangle" | "polygon" | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null);
  const [drawnZone, setDrawnZone] = useState<Feature<Polygon> | null>(null);
  const [camerasInZone, setCamerasInZone] = useState<Camera[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    onLoadingChange(true);
    fetch("/api/cameras")
      .then((res) => res.json())
      .then((data: Camera[]) => setCameras(data))
      .finally(() => onLoadingChange(false));
  }, [onLoadingChange]);

  // Cancel drawing on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && drawMode !== null) {
        setDrawMode(null);
        setDrawingPoints([]);
        setHoverCoord(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawMode]);

  function completeZone(ring: [number, number][]) {
    const feature: Feature<Polygon> = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: {},
    };
    setDrawnZone(feature);
    const inZone = cameras.filter((c) =>
      booleanPointInPolygon(point([c.lng, c.lat]), feature)
    );
    setCamerasInZone(inZone);
    setDrawMode(null);
    setDrawingPoints([]);
    setHoverCoord(null);
    setShowModal(true);
  }

  function handleDrawButtonClick(mode: "rectangle" | "polygon") {
    if (drawMode === mode) {
      setDrawMode(null);
      setDrawingPoints([]);
      setHoverCoord(null);
    } else {
      setDrawMode(mode);
      setDrawingPoints([]);
      setHoverCoord(null);
      setDrawnZone(null);
      setCamerasInZone([]);
    }
  }

  function handleMapClick(info: { coordinate?: number[] | null }) {
    if (!drawMode || !info.coordinate) return;
    const [lng, lat] = info.coordinate as [number, number];

    if (drawMode === "rectangle") {
      if (drawingPoints.length === 0) {
        setDrawingPoints([[lng, lat]]);
      } else {
        const [x1, y1] = drawingPoints[0];
        completeZone([[x1, y1], [lng, y1], [lng, lat], [x1, lat], [x1, y1]]);
      }
    } else {
      setDrawingPoints((prev) => [...prev, [lng, lat]]);
    }
  }

  function handleModalClose() {
    setShowModal(false);
    setDrawnZone(null);
    setCamerasInZone([]);
    setDrawMode(null);
  }

  function handleSend(params: SendRequestParams) {
    console.log("Send request params:", params);
  }

  // Build the rubber-band preview path shown while cursor moves
  function getPreviewPath(): [number, number][] | null {
    if (drawMode === "rectangle" && drawingPoints.length === 1 && hoverCoord) {
      const [x1, y1] = drawingPoints[0];
      const [x2, y2] = hoverCoord;
      return [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
    }
    if (drawMode === "polygon" && drawingPoints.length >= 1) {
      const pts: [number, number][] = hoverCoord
        ? [...drawingPoints, hoverCoord]
        : drawingPoints;
      return pts.length >= 2 ? pts : null;
    }
    return null;
  }

  const previewPath = getPreviewPath();
  const zoneAreaKm2 = drawnZone ? area(drawnZone) / 1_000_000 : 0;

  const cameraLayer = new ScatterplotLayer<Camera>({
    id: "cameras",
    data: cameras,
    getPosition: (c) => [c.lng, c.lat],
    getFillColor: getCameraColor,
    getRadius: 1,
    radiusMinPixels: 10,
    radiusMaxPixels: 20,
    radiusUnits: "pixels",
    pickable: drawMode === null,
    onClick: ({ object }) => {
      if (object) setSelectedCamera(object);
    },
  });

  const zoneLayer =
    drawnZone !== null
      ? new PolygonLayer({
          id: "drawn-zone",
          data: [drawnZone],
          getPolygon: (f: Feature<Polygon>) => f.geometry.coordinates,
          getFillColor: [59, 130, 246, 38] as [number, number, number, number],
          getLineColor: [59, 130, 246, 200] as [number, number, number, number],
          lineWidthMinPixels: 2,
          filled: true,
          stroked: true,
          pickable: false,
        })
      : null;

  const drawingPathLayer =
    previewPath && previewPath.length >= 2
      ? new PathLayer({
          id: "drawing-preview",
          data: [{ path: previewPath }],
          getPath: (d: { path: [number, number][] }) => d.path,
          getColor: [59, 130, 246, 200] as [number, number, number, number],
          getWidth: 2,
          widthMinPixels: 2,
          pickable: false,
        })
      : null;

  const drawingVertexLayer =
    drawMode !== null && drawingPoints.length > 0
      ? new ScatterplotLayer({
          id: "drawing-vertices",
          data: drawingPoints,
          getPosition: (p: [number, number]) => p,
          getFillColor: [59, 130, 246, 255] as [number, number, number, number],
          getLineColor: [255, 255, 255, 200] as [number, number, number, number],
          getRadius: 5,
          radiusUnits: "pixels",
          stroked: true,
          lineWidthMinPixels: 1,
          pickable: false,
        })
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers: any[] = [
    cameraLayer,
    zoneLayer,
    drawingPathLayer,
    drawingVertexLayer,
  ].filter(Boolean);

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        onClick={handleMapClick}
        onHover={(info) => {
          if (drawMode !== null && info.coordinate) {
            setHoverCoord(info.coordinate as [number, number]);
          }
        }}
        getCursor={
          drawMode !== null
            ? () => "crosshair"
            : ({ isHovering }: { isHovering: boolean }) =>
                isHovering ? "pointer" : "grab"
        }
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>

      {/* Draw tool buttons */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => handleDrawButtonClick("rectangle")}
          className={`w-10 h-10 rounded shadow-lg flex items-center justify-center transition-colors ${
            drawMode === "rectangle"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
          title="Draw rectangle zone"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="14" height="10" rx="1" />
          </svg>
        </button>

        <button
          onClick={() => handleDrawButtonClick("polygon")}
          className={`w-10 h-10 rounded shadow-lg flex items-center justify-center transition-colors ${
            drawMode === "polygon"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
          title="Draw polygon zone"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="9,2 16,7 13,15 5,15 2,7" />
          </svg>
        </button>
      </div>

      {/* Finish polygon button */}
      {drawMode === "polygon" && drawingPoints.length >= 3 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() =>
              completeZone([...drawingPoints, drawingPoints[0]])
            }
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded shadow-lg transition-colors"
          >
            Finish polygon
          </button>
        </div>
      )}

      {selectedCamera !== null && (
        <CameraDetailPanel
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
          onRequestCamera={(camera) => {
            console.log("Request camera:", camera);
          }}
        />
      )}

      {showModal && drawnZone !== null && (
        <FinalizationModal
          camerasInZone={camerasInZone}
          zoneAreaKm2={zoneAreaKm2}
          onClose={handleModalClose}
          onSend={handleSend}
        />
      )}
    </div>
  );
}
