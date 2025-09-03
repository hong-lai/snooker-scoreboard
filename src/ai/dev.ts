import { config } from 'dotenv';
config();

import '@/ai/flows/convert-image-to-jpeg';
import '@/ai/flows/translate-snooker-score-from-image.ts';
import '@/ai/flows/verify-snooker-score-entry.ts';
import '@/ai/flows/export-matches-to-csv.ts';
