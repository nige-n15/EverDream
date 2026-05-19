import { build } from 'vite';
try {
  await build({ mode: 'production' });
  console.log('BUILD DONE');
  process.exit(0);
} catch (e) {
  console.error('BUILD FAILED:', e.message || e);
  process.exit(1);
}
