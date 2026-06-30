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
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProjectionView from "./pages/ProjectionView";
import QuizStats from "./pages/QuizStats";
import Profile from "./pages/Profile";

function Router() {
  return (
    <Switch>
      {/* Páginas de autenticação própria (sem navbar) */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />

      {/* Rotas públicas do aluno (sem navbar) */}
      <Route path="/join" component={JoinSession} />
      <Route path="/student/:id" component={StudentSession} />

      {/* Rotas Kahoot (ecrã completo, sem navbar) */}
      <Route path="/kahoot/host/:id" component={KahootHost} />
      <Route path="/kahoot/play/:id" component={KahootPlayer} />

      {/* Vista de projeção (ecrã completo, sem navbar) */}
      <Route path="/projection/:id" component={ProjectionView} />

      {/* Rotas com layout */}
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/dashboard" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/quiz/new">
        {() => <Layout><QuizEditor id="new" /></Layout>}
      </Route>
      <Route path="/quiz/:id/edit">
        {(params) => <Layout><QuizEditor id={params.id} /></Layout>}
      </Route>
      <Route path="/questions" component={() => <Layout><QuestionBank /></Layout>} />
      <Route path="/session/:id" component={() => <Layout><SessionManager /></Layout>} />
      <Route path="/quiz/:id/stats">
        {(params) => <Layout><QuizStats /></Layout>}
      </Route>
      <Route path="/coordination" component={() => <Layout><Coordination /></Layout>} />
      <Route path="/profile" component={() => <Layout><Profile /></Layout>} />

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
