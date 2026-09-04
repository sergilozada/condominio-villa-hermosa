import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login(username, password)) {
      // El login exitoso será manejado por el componente padre
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-[#0e1c37] p-4"
      style={{
        backgroundImage: `url('/brand/portico-villa-hermosa.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#071628]/85 via-[#0e2542]/70 to-[#0d6f78]/45"></div>
      <div className="w-full max-w-md relative">
        <Card className="border-white/25 bg-[#fffefb]/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <img src="/brand/villa-hermosa-icon.png" alt="Condominio Villa Hermosa" className="mx-auto mb-3 h-20 w-20 rounded-2xl border border-[#d9ddd9] shadow-sm" />
            <CardTitle className="brand-display text-3xl font-medium text-[#15284d]">
              Condominio Villa Hermosa
            </CardTitle>
            <CardDescription className="text-[#697386]">
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Iniciar Sesión
              </Button>
            </form>
            
            {/* Test accounts UI removed to avoid exposing credentials */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
