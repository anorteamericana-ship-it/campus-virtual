// CS21A202 · Fail-closed source-truth guard for browser QA changes.
// Does not grant approval to English LAB code changes; those need a dedicated verified contract.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const changedPath='/tmp/source-truth-changed.txt';
const inCI=Boolean(process.env.GITHUB_ACTIONS);
if (inCI) assert(fs.existsSync(changedPath),'Missing CI changed-file manifest: fail closed');
const changes=fs.existsSync(changedPath)?fs.readFileSync(changedPath,'utf8').split(/\r?\n/).filter(Boolean):[];
const forbiddenEnglishLAB=changes.filter(p=>/^(?:src|styles)\/english_lab/i.test(p));
assert.equal(forbiddenEnglishLAB.length,0,
  'English LAB application/CSS changes require their own verified source-truth contract; do not reuse browser QA approval.');
const browserChanges=changes.filter(p=>/^scripts\/.*browser.*\.mjs$/i.test(p));
assert(browserChanges.every(p=>p==='scripts/virtual_review_browser.mjs'),
  'Unknown browser test changed; extend strict contract after independent review.');

const path='scripts/virtual_review_browser.mjs';
const source=fs.readFileSync(path,'utf8');
execFileSync(process.execPath,['--check',path],{stdio:'pipe',timeout:20000});

function requireText(fragment,reason){assert(source.includes(fragment),reason);}
requireText("const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173'",
  'Isolated local origin is the default');
requireText("const session = syntheticSession(scenario.role)","All test accounts are synthetic");
requireText("token: 'qa-readonly-token'","Never use real credentials in synthetic QA");
requireText("const page = await context.newPage()","Each scenario has isolated browser context");
requireText("await page.route('**/*', async route => {","Outbound Apps Script traffic must be intercepted");
requireText("/script\\.google\\.com\\/macros|script\\.googleusercontent\\.com/i.test(url)",
  'Required Apps Script redirection/hosts are mocked');
requireText("body: JSON.stringify(mockPayload(fn, session))","Only QA JSON fixtures may substitute backend data");
requireText("await page.goto(`${baseURL}/campus.html`","Browser must load actual served application");
requireText("await route.continue()","Other assets must load unmodified, not get replaced");
assert.equal((source.match(/\broute\.fulfill\s*\(/g)||[]).length,1,
  'Exactly one mock fulfill, inside Apps Script interception');
assert(!/\b(?:page|context)\.(?:addScriptTag|addStyleTag)\s*\(/.test(source),
  'No injection of a synthetic application in place of shipped code');
assert(!/\b(?:route|response)\.fulfill\s*\(\s*\{[^}]*contentType\s*:\s*['"]text\/html/s.test(source),
  'No HTML response substitution');
assert(!/\b(?:localStorage|sessionStorage)\.setItem\s*\(\s*['"]an_usuario['"]\s*,\s*[^J]/.test(source),
  'Session must be created only from synthetic JSON');

// Student navigation must test both the invariant route ID AND the visible language.
requireText('button[data-nav-id="','Nav must be selected by stable route ID');
requireText('scenario.expectedLabel','Visible EN/ES label must be asserted');
requireText("lang === 'es' || lang === 'en'","Selected UI locale must be testable");
requireText("state.icanStandaloneMenuCount","Unfinished I CAN navigation must stay hidden");
requireText("state.tasksStandaloneMenuCount","Unfinished Tasks navigation must stay hidden");
requireText("const failures =","Browser review must retain failure tracking");
console.log('CS21A202 SOURCE TRUTH PASS: isolated synthetic sessions, Apps Script intercepted, no served HTML injection, route-ID + EN/ES assertions; English LAB app unchanged.');
