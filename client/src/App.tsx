import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import QuizEditor from "./pages/QuizEditor";
import QuestionBank from "./pages/QuestionBank";
import SessionManager from "./pages/SessionManager";
import JoinSession from "./pages/JoinSession";
import StudentSession from "./pages/StudentSession";
import Coordination from "./pages/Coordination";
import KahootHost from "./pages/KahootHost";
import KahootPlayer from "./pages/KahootPlayer";

function Router() {
  return (
    <Switch>
      {/* Rotas públicas do aluno (sem navbar) */}
      <Route path="/join" component={JoinSession} />
      <Route path="/student/:id" component={StudentSession} />

      {/* Rotas Kahoot (ecrã completo, sem navbar) */}
      <Route path="/kahoot/host/:id" component={KahootHost} />
      <Route path="/kahoot/play/:id" component={KahootPlayer} />

      {/* Rotas com layout */}
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/dashboard" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/quiz/new" component={() => <Layout><QuizEditor /></Layout>} />
      <Route path="/quiz/:id/edit" component={() => <Layout><QuizEditor /></Layout>} />
      <Route path="/questions" component={() => <Layout><QuestionBank /></Layout>} />
      <Route path="/session/:id" component={() => <Layout><SessionManager /></Layout>} />
      <Route path="/coordination" component={() => <Layout><Coordination /></Layout>} />

      <Route path="/404" component={() => <Layout><NotFound /></Layout>} />
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
