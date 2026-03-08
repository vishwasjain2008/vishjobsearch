import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase } from "lucide-react";

const Auth: React.FC = () => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground">JobSearch AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Your intelligent job search assistant</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 h-9 text-sm" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required className="mt-1 h-9 text-sm" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}Create Account
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground">Your profile and resume are stored securely.</p>
      </div>
    </div>
  );
};

export default Auth;
