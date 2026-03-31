import { useState, Dispatch, SetStateAction } from "react";
import type { Camera } from "../types/camera";

export type SendRequestParams = {
  cameraIds: string[];
  incidentDescription: string;
  incidentDate: string;
  incidentTimeFrom: string;
  incidentTimeTo: string;
};

const TYPE_LABELS: Record<Camera["type"], string> = {
  traffic: "Traffic",
  corporate: "Corporate",
  residential: "Residential",
  bar_restaurant: "Bar / Restaurant",
};

const TYPE_BADGE_CLASSES: Record<Camera["type"], string> = {
  traffic: "bg-blue-700 text-blue-100",
  corporate: "bg-amber-700 text-amber-100",
  residential: "bg-green-800 text-green-100",
  bar_restaurant: "bg-purple-800 text-purple-100",
};

type Props = {
  camerasInZone: Camera[];
  zoneAreaKm2: number;
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  onClose: () => void;
  onSend: (params: SendRequestParams) => void;
};

export default function FinalizationModal({
  camerasInZone,
  zoneAreaKm2,
  selectedIds,
  setSelectedIds,
  onClose,
  onSend,
}: Props) {
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTimeFrom, setIncidentTimeFrom] = useState("");
  const [incidentTimeTo, setIncidentTimeTo] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");

  function toggleCamera(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const selectedCameras = camerasInZone.filter((c) => selectedIds.has(c.id));
  const selectedCount = selectedCameras.length;
  const emailCount = selectedCameras.filter((c) => c.status === "active").length;

  const typeCounts = selectedCameras.reduce<Partial<Record<Camera["type"], number>>>(
    (acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const typeBreakdownParts: string[] = [];
  if (typeCounts.traffic) typeBreakdownParts.push(`${typeCounts.traffic} traffic`);
  if (typeCounts.corporate) typeBreakdownParts.push(`${typeCounts.corporate} corporate`);
  if (typeCounts.residential) typeBreakdownParts.push(`${typeCounts.residential} residential`);
  if (typeCounts.bar_restaurant)
    typeBreakdownParts.push(`${typeCounts.bar_restaurant} bar/restaurant`);
  const typeBreakdown = typeBreakdownParts.join(" · ") || "—";

  const canSend = incidentDescription.trim().length > 0 && selectedCount > 0;

  function handleSend() {
    if (!canSend) return;
    onSend({
      cameraIds: Array.from(selectedIds),
      incidentDescription: incidentDescription.trim(),
      incidentDate,
      incidentTimeFrom,
      incidentTimeTo,
    });
  }

  return (
    <div className="fixed left-0 bottom-0 w-[400px] bg-gray-800 border-r border-gray-700 z-10 flex flex-col top-12">

      {/* Section 1 — Summary stats */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-white font-bold text-lg mb-4">Dispatch Footage Requests</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Cameras Selected" value={String(selectedCount)} />
          <StatCard label="Emails Going Out" value={String(emailCount)} />
          <StatCard label="Coverage Area" value={`${zoneAreaKm2.toFixed(2)} km²`} />
          <StatCard label="Type Breakdown" value={typeBreakdown} small />
        </div>
      </div>

      {/* Section 2 — Incident form */}
      <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">Incident Date</label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-gray-400 text-xs">Time From</label>
              <input
                type="time"
                value={incidentTimeFrom}
                onChange={(e) => setIncidentTimeFrom(e.target.value)}
                className="bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-gray-400 text-xs">Time To</label>
              <input
                type="time"
                value={incidentTimeTo}
                onChange={(e) => setIncidentTimeTo(e.target.value)}
                className="bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">Incident Description</label>
          <textarea
            value={incidentDescription}
            onChange={(e) => setIncidentDescription(e.target.value)}
            placeholder="Describe the incident..."
            rows={3}
            className="bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Section 3 — Camera grid (scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {camerasInZone.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No cameras in zone.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {camerasInZone.map((camera) => {
              const isSelected = selectedIds.has(camera.id);
              return (
                <div
                  key={camera.id}
                  className={`relative rounded-lg overflow-hidden bg-gray-700 border transition-all ${
                    isSelected ? "border-blue-500 opacity-100" : "border-gray-600 opacity-40"
                  }`}
                >
                  {/* Image */}
                  <div className="h-24 bg-gray-600">
                    <img
                      src={`/camera-images/${camera.placeholderImage}`}
                      alt={camera.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-white text-xs font-semibold leading-snug truncate mb-1">
                      {camera.name}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_BADGE_CLASSES[camera.type]}`}
                    >
                      {TYPE_LABELS[camera.type]}
                    </span>
                    <p className="text-gray-400 text-[10px] mt-1 truncate">{camera.ownerName}</p>
                  </div>

                  {/* Toggle checkbox */}
                  <button
                    onClick={() => toggleCamera(camera.id)}
                    aria-label={isSelected ? "Deselect camera" : "Select camera"}
                    className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-gray-800/80 border-gray-400"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="1.5,5 4,7.5 8.5,2" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4 — Footer */}
      <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            canSend
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Send Requests
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-gray-700/60 rounded-lg px-4 py-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-white font-bold ${small ? "text-xs leading-relaxed" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}
