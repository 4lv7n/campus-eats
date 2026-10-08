import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

// Throws a friendly error if the string is not a valid MongoDB ObjectId.
export function assertObjectId(id: string, label = 'ID'): Types.ObjectId {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return new Types.ObjectId(id);
}

// Round money to 2 decimals so we never get 0.1 + 0.2 = 0.30000000000000004
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

// Escape user text before putting it in a RegExp (used by search).
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
