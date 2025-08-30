'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createMatch } from '@/lib/store';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  player1Name: z.string().min(1, 'Player 1 name is required.'),
  player2Name: z.string().min(1, 'Player 2 name is required.'),
});

export function NewMatchForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player1Name: '',
      player2Name: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a match.",
        });
        return;
    }
    setIsSubmitting(true);
    const newMatch = await createMatch(user.uid, values.player1Name, values.player2Name, new Date());
    router.push(`/match/${newMatch.id}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="player1Name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player 1 Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="player2Name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player 2 Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Jane Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating Match...' : 'Start Match'}
        </Button>
      </form>
    </Form>
  );
}
