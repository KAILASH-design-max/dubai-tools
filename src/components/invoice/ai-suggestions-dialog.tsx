"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { FC } from "react";
import { WandSparkles } from "lucide-react";

type AiSuggestionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: string[];
  isLoading: boolean;
};

export const AiSuggestionsDialog: FC<AiSuggestionsDialogProps> = ({
  open,
  onOpenChange,
  suggestions,
  isLoading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <WandSparkles className="text-accent" />
            AI Invoice Design Suggestions
          </DialogTitle>
          <DialogDescription>
            Here are some AI-powered suggestions to improve your invoice design.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[95%]" />
            </div>
          ) : (
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
