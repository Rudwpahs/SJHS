import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('39 Pages deploy verifies current source and uploads dist',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
  assert.match(workflow,/actions\/setup-node@v4/);
  assert.match(workflow,/npm run verify/);
  assert.match(workflow,/path:\s*dist/);
  assert.doesNotMatch(workflow,/cp index\.html sjhs-payload-\*\.js/);
});

test('40 package does not advertise stale payload recovery',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.scripts['recover-source'],undefined);
});
