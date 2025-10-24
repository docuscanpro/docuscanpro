import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout.jsx";

// Importa todas as suas páginas
import Dashboard from "./pages/Dashboard.jsx";
import Capture from "./pages/Capture.jsx";
import OCR from "./pages/OCR.jsx";
import Translate from "./pages/Translate.jsx";
import Convert from "./pages/Convert.jsx";
import Sign from "./pages/Sign.jsx";
import MyDocuments from "./pages/MyDocuments.jsx";
import Settings from "./pages/Settings.jsx";
import Share from "./pages/Share.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Layout> {/* Seu Layout envolve todas as páginas */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/ocr" element={<OCR />} />
          <Route path="/translate" element={<Translate />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/sign" element={<Sign />} />
          <Route path="/mydocuments" element={<MyDocuments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/share" element={<Share />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
