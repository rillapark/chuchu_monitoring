import { KrxStatus } from './types';
export function getKrxStatus(now = new Date()):KrxStatus { const d=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Seoul'})); const day=d.getDay(); if(day===0||day===6) return 'CLOSED'; const m=d.getHours()*60+d.getMinutes(); if(m<540) return 'PRE-MARKET'; if(m<=930) return 'OPEN'; if(m<1200) return 'AFTER-HOURS'; return 'CLOSED'; }
