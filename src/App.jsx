import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/lib/themeContext';
import CommandPallette from '@/components/CommandPalette';
import Layout from '@/components/layout/Layout';
import Workspace from '@/pages/Workspace';
import Files from '@/pages/Files';
import Notes from '@/pages/Notes';
import Chat from '@/pages/Chat';
import SearchPage from '@/pages/SearchPage';
import KnowledgeGraph from '@/pages/KnowledgeGraph';
import Analytics from '@/pages/Analytics';
import DataSources from '@/pages/DataSources';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Workspace />} />
        <Route path="/files" element={<Files />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/graph" element={<KnowledgeGraph />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/data-sources" element={<DataSources />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
            <CommandPalette />
          </Router>
          <Toaster />
          <SonnerToaster position="bottom-right" />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
