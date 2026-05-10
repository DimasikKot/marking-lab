import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "material-icons/iconfont/material-icons.css";

import { ToasterUI } from "@/shared/components/ToasterUI";
import { PrivateRoute } from "@/shared/components/PrivateRoute";

import { Home } from "@/pages/main/Home";
import { NotFound } from "@/pages/main/NotFound";
import { Components } from "@/pages/main/Components";

import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";

import { Project } from "@/pages/projects/Project";
import { Projects } from "@/pages/projects/Projects";
import { File } from "@/pages/file/File";
import { Model } from "@/pages/projects/Model";

import { ComparisonFiles } from "@/pages/comparisons/ComparisonFiles";
import { ComparisonModels } from "@/pages/comparisons/ComparisonModels";

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

            <Route
              path="/projects/:projectId/files/:fileId"
              element={<File />}
            />

            <Route
              path="/projects/:projectId/models/:modelId"
              element={<Model />}
            />

            <Route
              path="/projects/:projectId/ComparisonFiles/compare=:ids"
              element={<ComparisonFiles />}
            />

            <Route
              path="/projects/:projectId/ComparisonModels/compare=:ids"
              element={<ComparisonModels />}
            />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}
