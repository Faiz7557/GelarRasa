import 'server-only';
import { NextResponse } from 'next/server';
import { meta } from './db';

export function ok<T>(data: T, init?: { headers?: Record<string, string> }) {
  return NextResponse.json({ data, meta: { as_of: meta().as_of, demo: true } }, init);
}
export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
