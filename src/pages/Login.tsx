import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useRegions } from '@/hooks/useRegions';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [regionId, setRegionId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { login, loginWithOAuth, signup, setDemoUser } = useAuth();
  const { data: regions, isLoading: regionsLoading, error: regionsError } = useRegions();
  const navigate = useNavigate();

  // Debug regions loading
  console.log('[Login] Regions:', { regions, regionsLoading, regionsError });

  const validateForm = (): string | null => {
    if (!email.trim()) return 'Email je povinný';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Neplatný formát emailu';
    if (!password) return 'Heslo je povinné';
    if (password.length < 6) return 'Heslo musí mať aspoň 6 znakov';
    if (mode === 'signup') {
      if (!fullName.trim()) return 'Meno je povinné';
      if (!regionId) return 'Vyberte kraj (región)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      const { error } = await login(email, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Úspešne prihlásený');
        navigate('/dashboard');
      }
    } else {
      const { error, session } = await signup(email, password, fullName, role, regionId);
      if (error) {
        toast.error(error);
      } else if (session) {
        // Instant login (email confirmation disabled)
        toast.success('Registrácia úspešná!');
        navigate('/dashboard');
      } else {
        // Email confirmation required
        setSignupSuccess(true);
        toast.success('Registrácia úspešná! Skontrolujte svoj email.');
      }
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (role: UserRole) => {
    setDemoUser(role);
    toast.success(`Demo prihlásenie ako ${role}`);
    navigate('/dashboard');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setSignupSuccess(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-stone">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
              <span className="text-2xl font-bold text-primary-foreground">AS</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">ArtStone</h1>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Registrácia úspešná!</h2>
              <p className="text-muted-foreground mb-6">
                Na váš email sme odoslali potvrdzovací odkaz. Kliknite naň pre aktiváciu účtu.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setMode('login');
                  resetForm();
                }}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť na prihlásenie
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-stone">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
            <span className="text-2xl font-bold text-primary-foreground">AS</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">ArtStone</h1>
          <p className="text-muted-foreground mt-2">Interný CRM systém</p>
        </div>

        <Card className="shadow-soft border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="font-display text-xl">
              {mode === 'login' ? 'Prihlásenie' : 'Registrácia'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Zadajte svoje prihlasovacie údaje'
                : 'Vytvorte si nový účet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Celé meno</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ján Novák"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background"
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.sk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background pr-10"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-muted-foreground">Minimálne 6 znakov</p>
                )}
              </div>

              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label>Rola</Label>
                    <Select value={role} onValueChange={(val: UserRole) => setRole(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte rolu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Obchodník</SelectItem>
                        <SelectItem value="manager">Manažér</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kraj (Región)</Label>
                    <Select value={regionId} onValueChange={setRegionId} disabled={regionsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          regionsLoading ? "Načítavam..." :
                            regionsError ? "Chyba pri načítaní" :
                              "Vyberte kraj"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {regionsLoading ? (
                          <SelectItem value="loading" disabled>Načítavam regióny...</SelectItem>
                        ) : regionsError ? (
                          <SelectItem value="error" disabled>Chyba: {regionsError.message}</SelectItem>
                        ) : !regions || regions.length === 0 ? (
                          <SelectItem value="empty" disabled>Žiadne regióny</SelectItem>
                        ) : (
                          regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {regionsError && (
                      <p className="text-xs text-destructive">
                        Nepodarilo sa načítať regióny. Skúste obnoviť stránku.
                      </p>
                    )}
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-pulse">
                    {mode === 'login' ? 'Prihlasujem...' : 'Registrujem...'}
                  </span>
                ) : (
                  <>
                    {mode === 'login' ? (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Prihlásiť sa
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Registrovať sa
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>



            {/* Switch mode */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  resetForm();
                }}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'login'
                  ? 'Nemáte účet? Registrujte sa'
                  : 'Už máte účet? Prihláste sa'}
              </button>
            </div>

            {/* Demo login buttons */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Demo prístup (pre testovanie)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex-col h-auto py-3"
                >
                  <span className="text-xs text-muted-foreground">Admin</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('manager')}
                  className="flex-col h-auto py-3"
                >
                  <span className="text-xs text-muted-foreground">Manažér</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('sales')}
                  className="flex-col h-auto py-3"
                >
                  <span className="text-xs text-muted-foreground">Obchodník</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 ArtStone. Všetky práva vyhradené.
        </p>
      </div>
    </div>
  );
}
