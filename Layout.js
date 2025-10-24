
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Camera,
  FileText,
  Languages,
  Image,
  PenTool,
  FolderOpen,
  Home,
  Menu,
  X,
  Settings, // New icon for Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false); // Dark mode state

  const navigationItems = [
    { title: "Início", url: createPageUrl("Dashboard"), icon: Home },
    { title: "Capturar", url: createPageUrl("Capture"), icon: Camera },
    { title: "OCR", url: createPageUrl("OCR"), icon: FileText },
    { title: "Traduzir", url: createPageUrl("Translate"), icon: Languages },
    { title: "Converter", url: createPageUrl("Convert"), icon: Image },
    { title: "Assinar", url: createPageUrl("Sign"), icon: PenTool },
    { title: "Documentos", url: createPageUrl("MyDocuments"), icon: FolderOpen },
  ];

  const isActive = (url) => location.pathname === url;

  // Effect to apply/remove 'dark' class to the document root element
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">DocuScan Pro</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Processamento Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle Button for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="text-lg"
            >
              {darkMode ? '🌞' : '🌙'}
            </Button>
            {/* Mobile Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-700 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-b-3xl shadow-2xl p-4 space-y-2 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                  isActive(item.url)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
            {/* Settings link for mobile menu */}
            <Link
              to={createPageUrl("Settings")}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                isActive(createPageUrl("Settings"))
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Configurações</span>
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">DocuScan Pro</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Processamento Inteligente</p>
              </div>
            </div>
            {/* Dark Mode Toggle Button for Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="text-lg text-gray-700 dark:text-gray-300"
            >
              {darkMode ? '🌞' : '🌙'}
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.url)
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:transform hover:scale-105"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-t from-gray-50 dark:from-gray-900">
          <Link to={createPageUrl("Settings")} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Configurações</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Preferências</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">U</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Usuário</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gerenciar conta</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-20 lg:pt-0">
        {children}
      </main>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}