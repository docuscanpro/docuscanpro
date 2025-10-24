import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Capture from "./pages/Capture";
import OCR from "./pages/OCR";
import Translate from "./pages/Translate";
import Convert from "./pages/Convert";
import Sign from "./pages/Sign";
import MyDocuments from "./pages/MyDocuments";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/ocr" element={<OCR />} />
            <Route path="/translate" element={<Translate />} />
            <Route path="/convert" element={<Convert />} />
            <Route path="/sign" element={<Sign />} />
            <Route path="/mydocuments" element={<MyDocuments />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
