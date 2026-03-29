import { useCallback, useState } from "react";
import MapView from "./components/MapView";

export default function App() {
  const [loading, setLoading] = useState(false);

  const handleLoadingChange = useCallback((value: boolean) => {
    setLoading(value);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <header className="fixed top-0 left-0 right-0 h-12 z-10 bg-gray-900 flex items-center px-4 border-b border-gray-700">
        <span className="text-white font-semibold tracking-wide">SightLine</span>
        {loading && (
          <span className="ml-3 text-gray-400 text-sm">Loading cameras…</span>
        )}
      </header>
      <div className="pt-12 h-full">
        <MapView onLoadingChange={handleLoadingChange} />
      </div>
    </div>
  );
}
