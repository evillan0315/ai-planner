import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getMuiTheme } from './theme';
import { AppLayout } from './components/ui/layouts/AppLayout'; // UPDATED IMPORT PATH AND NAME
import { themeAtom } from './stores/themeStore';
import { useStore } from '@nanostores/react';
import { useMemo, Suspense, lazy } from 'react';
import { initAuth } from './stores/authStore';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary'; // Import the new ErrorBoundary
import GlobalDialogManager from '@/components/ui/dialogs/GlobalDialogManager'; // ADD IMPORT

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const PlannerLandingPage = lazy(() => import('./pages/PlannerLandingPage'));
const PlannerList = lazy(() => import('./components/planner/PlannerList'));
const PlannerDedicatedPage = lazy(() => import('./pages/PlannerDedicatedPage')); // ADDED
const PromptGeneratorPage = lazy(() => import('./components/generator/PromptGeneratorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const CodejectorLandingPage = lazy(() => import('./pages/CodejectorLandingPage')); // ADDED
const CodejectorPage = lazy(() => import('./pages/CodejectorPage')); // ADDED

// Initialize authentication store on app start
initAuth();

function App() {
  const { theme: currentThemeMode } = useStore(themeAtom);
  // Ensure currentThemeMode is never undefined for getMuiTheme
  // Provide 'light' as a fallback if currentThemeMode is momentarily undefined.
  const muiTheme = useMemo(() => getMuiTheme(currentThemeMode || 'dark'), [currentThemeMode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ErrorBoundary> 
        <AppLayout> 
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<Loading />}>
                <HomePage />
              </Suspense>
            } /> 
            <Route path="/planner" element={
              <Suspense fallback={<Loading />}>
                <PlannerLandingPage />
              </Suspense>
            } />
            <Route path="/planner/list" element={
              <Suspense fallback={<Loading />}>
                <PlannerList />
              </Suspense>
            } /> 
            <Route path="/planner-generator" element={
              <Suspense fallback={<Loading />}>
                <PlannerDedicatedPage />
              </Suspense>
            }/>
            <Route path="/planner-generator/:planId" element={
               <Suspense fallback={<Loading />}>
                <PlannerDedicatedPage />
              </Suspense>
            } />
            <Route path="/prompt-generator" element={
               <Suspense fallback={<Loading />}>
                <PromptGeneratorPage />
              </Suspense>
            } />

            
            {/* CODEJECTOR ROUTES (NEW) */}
            <Route path="/codejector" element={
              <Suspense fallback={<Loading />}>
                <CodejectorLandingPage />
              </Suspense>
            } />
            <Route path="/codejector/editor" element={
              <Suspense fallback={<Loading />}>
                <CodejectorPage />
              </Suspense>
            } />
            <Route path="/login" element={
              <Suspense fallback={<Loading />}>
                <LoginPage />
              </Suspense>
            } />
            <Route
              path="/auth/callback"
              element={
                <Suspense fallback={<Loading />}>
                  <AuthCallback />
                </Suspense>
              }
            />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
      {/* Global Dialog Manager for Alert/Confirm/Prompt functionality */}
      <GlobalDialogManager /> 
    </ThemeProvider>
  );
}

export default App;
