import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  style: z.string().nullable().optional(),
  price: z.coerce.number().min(0),
  originalPrice: z.coerce.number().nullable().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().min(1),
        hint: z.string().min(1),
        colorName: z.string().optional(),
      })
    )
    .default([]),
  availableColors: z
    .array(
      z.object({
        name: z.string().min(1),
        hex: z.string().min(1),
      })
    )
    .default([]),
  sizes: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

const updateSchema = productSchema.extend({
  id: z.string().min(1),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

function normalizeString(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function makePayload(input: z.infer<typeof productSchema>) {
  return {
    name: normalizeString(input.name),
    slug: normalizeString(input.slug).toLowerCase(),
    description: input.description.trim(),
    category: normalizeString(input.category),
    style: input.style ? normalizeString(input.style) : null,
    price: Number(input.price),
    originalPrice:
      typeof input.originalPrice === 'number' ? Number(input.originalPrice) : null,
    images: input.images,
    availableColors: input.availableColors,
    sizes: input.sizes,
    isFeatured: !!input.isFeatured,
    updatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid product payload.' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const payload = {
      ...makePayload(parsed.data),
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('id,name,slug')
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

export async function PATCH(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid product update payload.' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { id, ...productData } = parsed.data;
    const payload = makePayload(productData);

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('id,name,slug')
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

export async function DELETE(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid delete payload.' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from('products').delete().eq('id', parsed.data.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
