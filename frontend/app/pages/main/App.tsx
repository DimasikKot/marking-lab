import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { PrivateRoute } from "@/shared/components/PrivateRoute.tsx"; // Лучше всегда писать абсолютный путь
import { Home, NotFound, Components } from "@/pages/main/index";
import { Login, Register } from "@/pages/auth/index.ts";
import {
  Project,
  Projects,
  File,
  Files,
  Model,
  Models,
  Experiment,
  Experiments,
} from "@/pages/projects/index.ts";
import { CustomToaster } from "@/shared/components/CustomToaster";

export function App() {
  return (
    <Router>
      <CustomToaster />
      <div className="bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="/components" element={<Components />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Защищенные маршруты, пересылает на страницу `/login` */}
          <Route element={<PrivateRoute />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<Project />} />

            <Route path="/projects/:projectId/files" element={<Files />} />
            <Route
              path="/projects/:projectId/files/:fileId"
              element={<File />}
            />

            <Route path="/projects/:projectId/models" element={<Models />} />
            <Route
              path="/projects/:projectId/models/:modelId"
              element={<Model />}
            />

            <Route
              path="/projects/:projectId/experiments"
              element={<Experiments />}
            />
            <Route
              path="/projects/:projectId/experiments/:experimentId"
              element={<Experiment />}
            />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}
