'use client';

import { useAuth, useUser } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, ShieldAlert, Key } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SecuritySettings() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!auth || !user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Reset Email Sent",
        description: `A password reset link has been sent to ${user.email}. Please check your inbox.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send reset email. Please try again later.",
      });
    }
  };

  return (
    <div className="space-y-8 py-4">
      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <AlertTitle className="font-bold text-primary">Security Overview</AlertTitle>
        <AlertDescription className="text-xs">
          Your account security is protected by Firebase Authentication. We recommend using a strong, unique password for your Dubai Tools account.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password Management
          </h3>
          <p className="text-xs text-muted-foreground">
            Need to change your password? Click the button below, and we'll send a secure reset link to your registered email address: <strong>{user?.email}</strong>.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleResetPassword} 
          className="w-full sm:w-auto hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Mail className="mr-2 h-4 w-4" />
          Send Password Reset Email
        </Button>
      </div>

      <div className="pt-4 space-y-2 border-t border-dashed">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Account Access</h3>
        <p className="text-[10px] text-muted-foreground">
          For your protection, certain sensitive actions may require you to re-authenticate or verify your email address.
        </p>
      </div>
    </div>
  );
}
