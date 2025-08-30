'use client';

import { Header } from '@/components/header';
import { NewMatchForm } from '@/components/new-match-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function NewMatchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        router.replace('/login');
    } else {
        setIsMounted(true);
    }
  }, [router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex flex-col items-center page-transition">
         <div className="w-full max-w-lg mb-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Start a New Match</CardTitle>
            <CardDescription>
              Enter the names of the two players to begin tracking the score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewMatchForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
