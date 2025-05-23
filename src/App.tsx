import { Routes, Route } from 'react-router-dom';
import Home from './page/home';
import Draw from './page/draw';
function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/draw" element={<Draw />} />
      </Routes>
  );
}

export default App;