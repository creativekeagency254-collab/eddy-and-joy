import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';

const payloadSchema = z.object({
  type: z.enum(['category', 'style']),
  name: z.string().min(1).max(80),
});

function normalizeName(raw: string) {
  return raw.trim().replace(/\s+/g, ' ');
}

function getTableName(type: 'category' | 'style') {
  return type === 'category' ? 'categories' : 'styles';
}

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request payload.' },
        { status: 400 }
      );
    }

    const name = normalizeName(parsed.data.name);
    const tableName = getTableName(parsed.data.type);
    const supabase = getSupabaseServiceClient();

    const { data: existingRow, error: existingError } = await supabase
      .from(tableName)
      .select('id,name')
      .eq('name', name)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json(
        { message: `Failed to query ${tableName}: ${existingError.message}` },
        { status: 500 }
      );
    }

    if (existingRow) {
      return NextResponse.json({ data: existingRow, existing: true });
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from(tableName)
      .insert({ name })
      .select('id,name')
      .single();

    if (insertError) {
      const message = insertError.message || 'Insert failed.';
      return NextResponse.json({ message }, { status: 500 });
    }

    return NextResponse.json({ data: insertedRow, existing: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
