import { NextResponse } from 'next/server';
import { fetchFx } from '@/lib/fx';
export async function GET(){ try{return NextResponse.json(await fetchFx());}catch(e:any){return NextResponse.json({error:e.message},{status:500});}}
