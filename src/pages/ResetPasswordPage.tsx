import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/Logo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check if we have a valid reset session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a recovery flow (user clicked email link)
      const accessToken = searchParams.get('access_token');
      const type = searchParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        // Set the session from the URL parameters
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: searchParams.get('refresh_token') || '',
        });
        
        if (error) {
          setIsValidSession(false);
          toast({
            title: 'Invalid or Expired Link',
            description: 'Please request a new password reset link.',
            variant: 'destructive',
          });
        } else {
          setIsValidSession(true);
        }
      } else if (session) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes (handles the hash fragment from email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams, toast]);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast({
        title: 'Password Requirements',
        description: 'Please meet all password requirements.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please ensure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: 'Password Updated!',
        description: 'Your password has been successfully reset.',
      });

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/sign-in');
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-slate-900">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid session - show error
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
            <p className="text-muted-foreground mb-8">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-accent hover:bg-accent/90">
                <Link to="/forgot-password">
                  Request New Link
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/sign-in">Back to Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-4">Password Reset Complete!</h1>
            <p className="text-muted-foreground mb-8">
              Your password has been successfully updated. You'll be redirected to sign in shortly.
            </p>
            <Button asChild className="w-full bg-accent hover:bg-accent/90">
              <Link to="/sign-in">
                Sign In Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-primary to-slate-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative z-10">
          <Link to="/">
            <Logo size="lg" className="text-white" />
          </Link>
        </div>
        
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-bold text-white mb-6">
              Create Your New <span className="text-gradient-gold">Secure Password</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Choose a strong password to protect your account. We'll never ask for your password via email or phone.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/60 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Secure Reset</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <Link to="/">
                <Logo size="lg" />
              </Link>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Password Reset</span>
              </div>
              <h2 className="text-2xl font-bold">Set New Password</h2>
              <p className="text-muted-foreground mt-2">
                Create a strong password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-50 rounded-lg p-4 space-y-2"
                >
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-muted-foreground'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={cn(
                      'pl-10 pr-10 h-12',
                      confirmPassword && (passwordsMatch ? 'border-green-500' : 'border-red-400')
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-red-500 text-sm">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-accent hover:bg-accent/90 text-white btn-glow"
                disabled={isLoading || !allRequirementsMet || !passwordsMatch}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Password...
                  </div>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link to="/sign-in" className="text-accent hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
