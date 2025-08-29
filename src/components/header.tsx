import Link from 'next/link';
import { Trophy } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-black/20 backdrop-blur-lg text-white shadow-lg">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-300" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            SnookerScoreMate
          </h1>
        </Link>
      </div>
    </header>
  );
}
