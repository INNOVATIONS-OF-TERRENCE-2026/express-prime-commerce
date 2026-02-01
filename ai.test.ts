/**
 * AI Test - Xenova Transformers.js Sentiment Analysis
 * 
 * Run with: npx tsx ai.test.ts
 * 
 * This tests the GitHub open source AI models running locally
 */

import { pipeline } from '@xenova/transformers';

console.log('🤖 Loading Xenova/transformers.js sentiment analysis model...');
console.log('📦 Model: Xenova/distilbert-base-uncased-finetuned-sst-2-english');
console.log('');

const classifier = await pipeline(
  'sentiment-analysis',
  'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
);

console.log('✅ Model loaded successfully!\n');

// Test sentiment analysis
const testPhrases = [
  'Express Prime is elite.',
  'This product is absolutely amazing! Best purchase ever.',
  'Terrible quality, waste of money.',
  'The shipping was fast and the item works perfectly.',
  'I regret buying this, very disappointed.',
];

console.log('🧪 Running sentiment analysis tests:\n');
console.log('='.repeat(60));

for (const phrase of testPhrases) {
  const result = await classifier(phrase);
  console.log(`\n📝 "${phrase}"`);
  console.log(`   → Sentiment: ${result[0].label}`);
  console.log(`   → Confidence: ${(result[0].score * 100).toFixed(2)}%`);
}

console.log('\n' + '='.repeat(60));
console.log('\n🎉 All tests completed successfully!');
console.log('🚀 GitHub Open Source AI is working in Express Prime Commerce!');
