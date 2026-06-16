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

// Rotas sem o layout principal (fluxo do aluno)
const STUDENT_ROUTES = ["/join", "/student/:id"];

function isStudentRoute(path: string) {
  return STUDENT_ROUTES.some((r) => {
    const pattern = r.replace(/:[\w]+/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(path);
  });
}

function Router() {
  return (
    <Switch>
      {/* Rotas públicas do aluno (sem navbar) */}
      <Route path="/join" component={JoinSession} />
      <Route path="/student/:id" component={StudentSession} />

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
