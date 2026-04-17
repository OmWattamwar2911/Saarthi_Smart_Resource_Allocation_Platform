import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import RoutesConfig from "./routes";

function App() {
  const [uiMode, setUiMode] = useState("glass");

  return (
    <div className={`app-shell mode-${uiMode}`}>
      <Sidebar />
      <div className="app-main">
        <Topbar uiMode={uiMode} onModeChange={setUiMode} />
        <div className="main-stage">
          <RoutesConfig />
        </div>
      </div>
    </div>
  );
}

export default App;
