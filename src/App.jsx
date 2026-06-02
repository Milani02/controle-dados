import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ProtectedRoute from "./components/ProtectedRoute"; // Importando o nosso guarda de rotas

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota padrão que redireciona automaticamente para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rota Pública - Qualquer pessoa consegue acessar */}
        <Route path="/login" element={<Login />} />
        
        {/* Rota Protegida - O componente verifica o login antes de mostrar o Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;