import { useState } from "react";
import { ThemeProvider, useFonts } from "./theme";
import { DatasetPage } from "./pages/DatasetPage";
import { ABTestPage } from "./pages/ABTestPage";
import { RCAResultsPage } from "./pages/RCAResultsPage";

// ─── App Router ───────────────────────────────────────────────────────────────

function AppMain() {
  const [page, setPage] = useState("dataset");
  const [selectedDataset, setSelectedDataset] = useState("");

  if (page === "dataset") {
    return (
      <DatasetPage
        onDatasetReady={(ds) => {
          setSelectedDataset(ds);
          setPage("abtest");
        }}
      />
    );
  }
  return <ABTestPage selectedDataset={selectedDataset} />;
}

function App() {
  useFonts();
  const params = new URLSearchParams(window.location.search);
  const isRCA = params.get('view') === 'rca';
  return (
    <ThemeProvider>
      {isRCA
        ? <RCAResultsPage
            results={(() => { const s = localStorage.getItem('rcaResults'); return s ? JSON.parse(s) : null; })()}
            dataset={params.get('dataset') || ''}
          />
        : <AppMain />}
    </ThemeProvider>
  );
}

export default App;
