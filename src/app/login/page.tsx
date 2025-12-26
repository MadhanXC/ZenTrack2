'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useUser, useFirebase, setDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';

function AuthForm() {
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [accessCode, setAccessCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('signin');


  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setAccessCode('');
  }

  const handleAuthAction = async (e: React.FormEvent, action: 'signIn' | 'signUp') => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (action === 'signUp') {
        if (!name) {
            setError('Please enter your name.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (accessCode !== process.env.NEXT_PUBLIC_SIGNUP_ACCESS_CODE) {
            setError('Invalid access code.');
            return;
        }
    }

    setLoading(true);
    setError(null);
    try {
      if (action === 'signUp') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Also create a user profile document in Firestore
        const userDocRef = doc(firestore, 'users', userCredential.user.uid);
        setDocumentNonBlocking(userDocRef, {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: name,
        }, { merge: true });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // The onAuthStateChanged listener in the provider will handle the redirect.
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2">
        <LineChart className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight">ZenTrack</span>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => handleAuthAction(e, 'signIn')}>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email-in">Email</Label>
                  <Input
                    id="email-in"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="password-in">Password</Label>
                  <Input
                    id="password-in"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? 'Signing In...' : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                Create an account to start tracking your investments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => handleAuthAction(e, 'signUp')}>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Sign Up Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name-up">Name</Label>
                  <Input
                    id="name-up"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="email-up">Email</Label>
                  <Input
                    id="email-up"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="password-up">Password</Label>
                  <Input
                    id="password-up"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="confirm-password-up">Confirm Password</Label>
                  <Input
                    id="confirm-password-up"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="access-code-up">Access Code</Label>
                  <Input
                    id="access-code-up"
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? 'Creating Account...' : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Sign Up
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function LoginPage() {
    return (
        <AuthForm />
    )
}
