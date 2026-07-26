import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="p-6 text-h1 font-semibold">Cotiza — en construcción</div>
    </AuthProvider>
  );
}
