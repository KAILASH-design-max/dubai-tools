
"use client";

import { useState, useEffect } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Loader2, Mail, Phone, User as UserIcon } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

export function UserProfileForm({ user }: { user: User }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const userProfileRef = useMemoFirebase(
    () => (firestore ? doc(firestore, `users/${user.uid}/profile/main`) : null),
    [firestore, user.uid]
  );

  const { data: profileData, isLoading } = useDoc<UserProfile>(userProfileRef);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: user.displayName || '',
    email: user.email || '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || user.displayName || '',
        email: profileData.email || user.email || '',
        phoneNumber: profileData.phoneNumber || '',
      });
    }
  }, [profileData, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      // Update Firebase Auth display name
      if (formData.fullName !== user.displayName) {
        await updateProfile(user, { displayName: formData.fullName });
      }

      // Update Firestore profile
      if (userProfileRef) {
        setDocumentNonBlocking(userProfileRef, {
          ...formData,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      toast({
        title: "Profile Updated",
        description: "Your personal profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          Full Name
        </Label>
        <Input 
          id="fullName" 
          value={formData.fullName || ''} 
          onChange={handleInputChange} 
          placeholder="Enter your full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email Address
        </Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email || ''} 
          disabled 
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground italic">Email cannot be changed here.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Phone Number
        </Label>
        <Input 
          id="phoneNumber" 
          type="tel" 
          value={formData.phoneNumber || ''} 
          onChange={handleInputChange} 
          placeholder="+91 00000 00000"
        />
      </div>

      <Button onClick={handleSaveChanges} disabled={isUpdating} className="w-full sm:w-auto">
        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Account Details
      </Button>
    </div>
  );
}
