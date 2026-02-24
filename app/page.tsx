'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Calculator from './components/Calculator';
import WatchlistSidebar from './components/WatchlistSidebar';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get('symbol');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (symbol) {
      setSelectedStock(symbol.toUpperCase());
    }
  }, [symbol]);

  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator selectedStock={selectedStock} />
      </div>
      <div
        className={`app-sidebar ${!sidebarVisible ? 'app-sidebar--hidden' : ''}`}
        data-visible={sidebarVisible}
      >
        <WatchlistSidebar
          onSelect={setSelectedStock}
          onCollapse={() => setSidebarVisible(false)}
        />
      </div>
      {!sidebarVisible && (
        <button
          type="button"
          className="sidebar-expand-tab"
          onClick={() => setSidebarVisible(true)}
          title="Show Watchlist"
          aria-label="Show Watchlist"
        >
          <PanelRightOpen size={18} />
          <span>Watchlist</span>
        </button>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container p-4">Loading calculator...</div>}>
      <HomeContent />
    </Suspense>
  );
}
