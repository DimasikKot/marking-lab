import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "material-icons/iconfont/material-icons.css";

import { PrivateRoute } from "@/shared/components/PrivateRoute.tsx"; // Лучше всегда писать абсолютный путь
import { Home, NotFound, Components } from "@/pages/main/index";
import { Login, Register } from "@/pages/auth/index.ts";
import {
  Project,
  Projects,
  File,
  Model,
  Experiment,
} from "@/pages/projects/index.ts";
import { ToasterUI } from "@/shared/components/ToasterUI";

export function App() {
  return (
    <Router>
      <ToasterUI />

      <div className="bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/components" element={<Components />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Защищенные маршруты, пересылает на страницу `/login` */}
          <Route element={<PrivateRoute />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<Project />} />

            <Route path="/projects/:projectId/files" element={<Project />} />
            <Route
              path="/projects/:projectId/files/:fileId"
              element={<File />}
            />
            <Route
              path="/projects/:projectId/files/:fileId/:page"
              element={<File />}
            />

            <Route path="/projects/:projectId/models" element={<Project />} />
            <Route
              path="/projects/:projectId/models/:modelId"
              element={<Model />}
            />

            <Route
              path="/projects/:projectId/experiments"
              element={<Project />}
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
