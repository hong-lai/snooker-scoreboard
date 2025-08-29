import { Header } from '@/components/header';
import { NewMatchForm } from '@/components/new-match-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewMatchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex justify-center">
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
