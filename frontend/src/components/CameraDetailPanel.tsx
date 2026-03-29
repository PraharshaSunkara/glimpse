import type { Camera } from "../types/camera";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  camera: Camera;
  onClose: () => void;
  onRequestCamera: (camera: Camera) => void;
};

export default function CameraDetailPanel({ camera, onClose, onRequestCamera }: Props) {
  const badgeClass =
    camera.status === "inactive"
      ? "bg-gray-600 text-gray-200"
      : TYPE_BADGE_CLASSES[camera.type];

  return (
    <div className="fixed top-12 left-0 bottom-0 w-80 bg-gray-800 border-r border-gray-700 shadow-2xl z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
          {TYPE_LABELS[camera.type]}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors ml-2 mt-0.5"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Camera name */}
      <h2 className="text-white font-bold text-base px-4 pb-3 leading-snug">
        {camera.name}
      </h2>

      {/* Placeholder image */}
      <div className="mx-4 mb-4 rounded overflow-hidden bg-gray-700 h-40 flex-shrink-0">
        <img
          src={`/camera-images/${camera.placeholderImage}`}
          alt={camera.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Details */}
      <div className="px-4 flex-1 overflow-y-auto space-y-3">
        <DetailRow label="Owner" value={camera.ownerName} />
        <DetailRow label="Coverage" value={camera.coverageDirection} />
        <DetailRow label="Last Verified" value={formatDate(camera.lastVerified)} />
        <div className="flex gap-2">
          <span className="text-gray-400 text-xs w-24 flex-shrink-0 pt-0.5">Status</span>
          <span className="flex items-center gap-1.5 text-gray-200 text-xs">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                camera.status === "active" ? "bg-green-400" : "bg-gray-500"
              }`}
            />
            {camera.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
        {camera.notes !== null && (
          <DetailRow label="Notes" value={camera.notes} />
        )}
      </div>

      {/* Request button */}
      <div className="p-4 flex-shrink-0">
        <button
          onClick={() => onRequestCamera(camera)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded transition-colors"
        >
          Request This Camera
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 text-xs w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-gray-200 text-xs leading-relaxed">{value}</span>
    </div>
  );
}
