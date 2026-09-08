import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='4f44fc55badf17e3b8d852ba27273e09c071fcf6';
const hist=execFileSync('git',['show',`${BASE}:00_DOCUMENTACION/ESTADO_CONSOLIDADO_F98_4_Z6_CS21A90.md`],{encoding:'utf8',maxBuffer:10*1024*1024});
const review=execFileSync('git',['show',`${BASE}:00_DOCUMENTACION/ENDPOINT_MANUAL_REVIEW_CS21A211C_2026-09-02.md`],{encoding:'utf8',maxBuffer:10*1024*1024});
const report=fs.readFileSync('00_DOCUMENTACION/REBECA_ROUTE_PROVENANCE_AUDIT_2026-09-08.md','utf8');
const must=(c,m)=>{if(!c) throw new Error(m);};

const historical=['agentGetCommercialConfig','agentResolveContactContext'];
const snapshotOnly=['agentGetPaymentStatus','agentGetRoutingDirectory','agentSubmitEnrollmentRequest','agentUpdateProspectProgress','agentReportPayment'];
for(const s of historical) must(hist.includes(s),`historical CS21A90 contract missing ${s}`);
for(const s of [...historical,...snapshotOnly]) must(review.toLowerCase().includes(s.toLowerCase()),`CS21A211C inventory missing ${s}`);
must(review.includes('QA_HEAD_20260901_215804Z'),'CS21A211C snapshot id changed');
must(review.includes('3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6'),'CS21A211C aggregate changed');
for(const s of snapshotOnly) must(!hist.includes(s),`route unexpectedly gained historical CS21A90 contract: ${s}`);
for(const marker of ['SNAPSHOT_INVENTORY_PRESENT','CONTRACT_NOT_VERSIONED','CURRENT_HANDLER_SOURCE_BLOCKED','no debe extenderse por analogía','STOP R1']) must(report.includes(marker),`report marker missing ${marker}`);
console.log('REBECA_ROUTE_PROVENANCE=PASS_E0');
console.log('HISTORICAL_CONTRACT=2');
console.log('SNAPSHOT_ONLY_CONTRACT=5');
console.log('R1=STOP_PENDING_REHEARSAL_HANDLER_SOURCE');
