import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

const updateOrderSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid order update payload.' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.id)
      .select('id,status')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
