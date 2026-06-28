import { NextResponse } from 'next/server';
import { MongooseError, Error as MongooseErrorTypes } from 'mongoose';

export function handleMongooseError(error: unknown): NextResponse | null {
  if (error instanceof MongooseErrorTypes.ValidationError) {
    const messages = Object.values(error.errors).map(e => e.message);
    return NextResponse.json({ error: 'Validation failed', details: messages }, { status: 400 });
  }
  
  if (error instanceof MongooseErrorTypes.CastError) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }
  
  if (typeof error === 'object' && error !== null && (error as any).code === 11000) {
    return NextResponse.json({ error: 'Duplicate entry' }, { status: 409 });
  }
  
  return null;
}
