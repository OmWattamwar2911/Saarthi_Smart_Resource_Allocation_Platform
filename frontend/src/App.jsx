import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import RoutesConfig from "./routes";

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <RoutesConfig />
      </div>
    </div>
  );
}

export default App;
