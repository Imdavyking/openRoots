import "./App.css";
import "@tomo-inc/tomo-evm-kit/styles.css";
import Router from "./router";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import NavHeader from "./components/NavHeader";

function App() {
  return (
    <>
      <ToastContainer />
      <NavHeader />
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </>
  );
}

export default App;
