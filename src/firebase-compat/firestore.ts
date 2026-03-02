import type { FirebaseApp } from 'firebase/app';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SUPABASE_REVIEWS_TABLE } from '@/lib/supabase/config';

export type DocumentData = Record<string, any>;
export type WhereFilterOp = '==' | '!=' | '<' | '<=' | '>' | '>=';
export type OrderByDirection = 'asc' | 'desc';

const SERVER_TIMESTAMP_TOKEN = '__firestore_server_timestamp__';
const FALLBACK_IMAGE_URL = 'https://i.postimg.cc/zXbR1f2f/download-(6).jpg';
const FALLBACK_STYLE = 'Classic';
const recoverableReadWarnings = new Set<string>();

const FALLBACK_PRODUCTS: DocumentData[] = [
  {
    id: 'prod-men-001',
    slug: 'men-essential-fit',
    name: 'Men Essential Fit',
    description: 'Minimal everyday fit for men.',
    category: 'Men',
    style: FALLBACK_STYLE,
    price: 3200,
    originalPrice: null,
    isFeatured: false,
    images: [{ url: FALLBACK_IMAGE_URL, alt: 'Men Essential Fit', hint: 'fashion product' }],
    availableColors: [{ name: 'Black', hex: '#000000' }],
    sizes: ['M', 'L', 'XL'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-women-001',
    slug: 'women-essential-fit',
    name: 'Women Essential Fit',
    description: 'Minimal everyday fit for women.',
    category: 'Women',
    style: FALLBACK_STYLE,
    price: 3200,
    originalPrice: null,
    isFeatured: true,
    images: [{ url: FALLBACK_IMAGE_URL, alt: 'Women Essential Fit', hint: 'fashion product' }],
    availableColors: [{ name: 'Black', hex: '#000000' }],
    sizes: ['S', 'M', 'L'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-children-001',
    slug: 'children-essential-fit',
    name: 'Children Essential Fit',
    description: 'Minimal everyday fit for children.',
    category: 'Children',
    style: FALLBACK_STYLE,
    price: 2800,
    originalPrice: null,
    isFeatured: false,
    images: [{ url: FALLBACK_IMAGE_URL, alt: 'Children Essential Fit', hint: 'fashion product' }],
    availableColors: [{ name: 'Black', hex: '#000000' }],
    sizes: ['XS', 'S', 'M'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-unisex-001',
    slug: 'unisex-essential-fit',
    name: 'Unisex Essential Fit',
    description: 'Minimal everyday unisex fit.',
    category: 'Unisex',
    style: FALLBACK_STYLE,
    price: 3000,
    originalPrice: null,
    isFeatured: false,
    images: [{ url: FALLBACK_IMAGE_URL, alt: 'Unisex Essential Fit', hint: 'fashion product' }],
    availableColors: [{ name: 'Black', hex: '#000000' }],
    sizes: ['S', 'M', 'L'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-bags-001',
    slug: 'bag-essential-carry',
    name: 'Bag Essential Carry',
    description: 'Minimal everyday bag.',
    category: 'Bags',
    style: FALLBACK_STYLE,
    price: 3500,
    originalPrice: null,
    isFeatured: false,
    images: [{ url: FALLBACK_IMAGE_URL, alt: 'Bag Essential Carry', hint: 'fashion bag' }],
    availableColors: [{ name: 'Black', hex: '#000000' }],
    sizes: ['M'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const FALLBACK_CATEGORIES: DocumentData[] = [
  { id: 'cat-men', name: 'Men' },
  { id: 'cat-women', name: 'Women' },
  { id: 'cat-children', name: 'Children' },
  { id: 'cat-unisex', name: 'Unisex' },
  { id: 'cat-bags', name: 'Bags' },
];

const FALLBACK_STYLES: DocumentData[] = [{ id: 'style-classic', name: FALLBACK_STYLE }];

function toPathObject(path: string) {
  return {
    canonicalString: () => path,
    toString: () => path,
  };
}

function toComparableValue(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function isIsoDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function toTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (typeof value === 'string' && isIsoDateString(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as any).seconds === 'number' &&
    typeof (value as any).nanoseconds === 'number'
  ) {
    return new Timestamp((value as any).seconds, (value as any).nanoseconds);
  }

  return value;
}

function normalizeDocumentData(input: any): any {
  if (Array.isArray(input)) {
    return input.map((item) => normalizeDocumentData(item));
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = normalizeDocumentData(value);
      continue;
    }

    const converted = toTimestamp(value);
    output[key] = converted;

    if (key === 'created_at' && output.createdAt === undefined) {
      output.createdAt = converted;
    }

    if (key === 'updated_at' && output.updatedAt === undefined) {
      output.updatedAt = converted;
    }
  }

  return output;
}

function sanitizeForWrite(input: any): any {
  if (input === undefined) {
    return undefined;
  }

  if (input === null) {
    return null;
  }

  if (input instanceof Timestamp) {
    return input.toDate().toISOString();
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => sanitizeForWrite(item))
      .filter((item) => item !== undefined);
  }

  if (typeof input === 'object') {
    if ((input as any)[SERVER_TIMESTAMP_TOKEN]) {
      return new Date().toISOString();
    }

    const output: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      const cleaned = sanitizeForWrite(value);
      if (cleaned !== undefined) {
        output[key] = cleaned;
      }
    }

    return output;
  }

  return input;
}

function resolveDocumentId(row: Record<string, any>, fallback: string) {
  if (row.id !== undefined && row.id !== null) {
    return String(row.id);
  }

  if (row.slug !== undefined && row.slug !== null) {
    return String(row.slug);
  }

  return fallback;
}

function makeFirestoreError(message: string, code = 'firestore/unknown') {
  return new FirestoreError(message, code);
}

function warnRecoverableRead(message: string) {
  if (recoverableReadWarnings.has(message)) {
    return;
  }

  recoverableReadWarnings.add(message);
  console.warn(message);
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  const message = error.message ?? '';
  return (
    error.code === 'PGRST205' ||
    message.includes('Could not find the table') ||
    message.includes('schema cache')
  );
}

function isPermissionDeniedError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  const code = String(error.code ?? '').toUpperCase();
  const message = String(error.message ?? '').toLowerCase();

  if (code === '42501' || code === '401' || code === '403' || code === 'PGRST301' || code === 'PGRST302') {
    return true;
  }

  return (
    message.includes('permission denied') ||
    message.includes('insufficient permissions') ||
    message.includes('forbidden') ||
    message.includes('not authorized') ||
    message.includes('invalid jwt')
  );
}

function isRecoverableReadError(error: { code?: string; message?: string } | null | undefined) {
  return isMissingTableError(error) || isPermissionDeniedError(error);
}

function makeMissingTableMessage(table: string) {
  return `Supabase table '${table}' is missing. Run docs/supabase-setup.sql in your Supabase SQL editor.`;
}

function makePermissionDeniedMessage(table: string) {
  return `Supabase read denied for table '${table}'. Check RLS select policies and API keys.`;
}

function getFallbackRowsForTable(table: string): DocumentData[] {
  if (table === 'products') {
    return [...FALLBACK_PRODUCTS];
  }

  if (table === 'categories') {
    return [...FALLBACK_CATEGORIES];
  }

  if (table === 'styles') {
    return [...FALLBACK_STYLES];
  }

  return [];
}

function compareValues(a: unknown, b: unknown, op: WhereFilterOp) {
  const left = toComparableValue(a);
  const right = toComparableValue(b);

  switch (op) {
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    case '<':
      return (left as any) < (right as any);
    case '<=':
      return (left as any) <= (right as any);
    case '>':
      return (left as any) > (right as any);
    case '>=':
      return (left as any) >= (right as any);
    default:
      return false;
  }
}

function runFallbackQuery(queryValue: Query<DocumentData>): DocumentData[] {
  let rows = getFallbackRowsForTable(queryValue.__table);

  if (rows.length === 0) {
    return rows;
  }

  for (const filter of queryValue.__filters) {
    rows = rows.filter((row) => compareValues(row?.[filter.fieldPath], filter.value, filter.opStr));
  }

  if (queryValue.__orderBy.length > 0) {
    for (let i = queryValue.__orderBy.length - 1; i >= 0; i -= 1) {
      const order = queryValue.__orderBy[i];
      const direction = order.direction === 'desc' ? -1 : 1;
      rows.sort((a, b) => {
        const left = toComparableValue(a?.[order.fieldPath]);
        const right = toComparableValue(b?.[order.fieldPath]);

        if (left === right) {
          return 0;
        }

        return (left as any) > (right as any) ? direction : -direction;
      });
    }
  }

  if (queryValue.__startAfter) {
    const cursorField = queryValue.__orderBy[0]?.fieldPath ?? 'id';
    const cursorDirection = queryValue.__orderBy[0]?.direction ?? 'asc';
    const cursorSource =
      cursorField === 'id'
        ? queryValue.__startAfter.id
        : queryValue.__startAfter.data()?.[cursorField];
    const cursor = toComparableValue(cursorSource);

    rows = rows.filter((row) => {
      const value = toComparableValue(cursorField === 'id' ? row.id : row?.[cursorField]);
      return cursorDirection === 'asc' ? (value as any) > (cursor as any) : (value as any) < (cursor as any);
    });
  }

  if (typeof queryValue.__limit === 'number') {
    rows = rows.slice(0, queryValue.__limit);
  }

  return rows;
}

function isCollectionReference(value: any): value is CollectionReference<DocumentData> {
  return value?.__kind === 'collection';
}

function isDocumentReference(value: any): value is DocumentReference<DocumentData> {
  return value?.__kind === 'document';
}

function toQuery<T = DocumentData>(
  target: CollectionReference<T> | Query<T>
): Query<T> {
  if (target.__kind === 'query') {
    return target;
  }

  return {
    __kind: 'query',
    type: 'query',
    path: target.path,
    _query: {
      path: toPathObject(target.path),
    },
    __table: target.__table,
    __segments: [...target.__segments],
    __filters: [...target.__filters],
    __orderBy: [...target.__orderBy],
    __limit: target.__limit,
    __startAfter: target.__startAfter,
    __nestedProductId: target.__nestedProductId,
  };
}

function withQueryConstraints<T = DocumentData>(
  base: CollectionReference<T> | Query<T>,
  constraints: QueryConstraint[]
): Query<T> {
  const queryState = toQuery(base);

  for (const constraint of constraints) {
    if (constraint.kind === 'where') {
      queryState.__filters.push(constraint);
      continue;
    }

    if (constraint.kind === 'orderBy') {
      queryState.__orderBy.push(constraint);
      continue;
    }

    if (constraint.kind === 'limit') {
      queryState.__limit = constraint.count;
      continue;
    }

    if (constraint.kind === 'startAfter') {
      queryState.__startAfter = constraint.snapshot;
    }
  }

  return queryState;
}

function applyWhereConstraint(builder: any, filter: WhereConstraint) {
  const value = toComparableValue(filter.value);

  switch (filter.opStr) {
    case '==':
      return builder.eq(filter.fieldPath, value);
    case '!=':
      return builder.neq(filter.fieldPath, value);
    case '<':
      return builder.lt(filter.fieldPath, value);
    case '<=':
      return builder.lte(filter.fieldPath, value);
    case '>':
      return builder.gt(filter.fieldPath, value);
    case '>=':
      return builder.gte(filter.fieldPath, value);
    default:
      return builder;
  }
}

function applyQueryToBuilder(queryValue: Query<DocumentData>) {
  const supabase = getSupabaseBrowserClient();
  let builder: any = supabase.from(queryValue.__table).select('*');

  if (queryValue.__nestedProductId) {
    const productId = String(queryValue.__nestedProductId);
    builder = builder.or(`productId.eq.${productId},product_id.eq.${productId}`);
  }

  for (const filter of queryValue.__filters) {
    builder = applyWhereConstraint(builder, filter);
  }

  if (queryValue.__orderBy.length === 0 && queryValue.__startAfter) {
    builder = builder.order('id', { ascending: true });
  }

  for (const order of queryValue.__orderBy) {
    builder = builder.order(order.fieldPath, { ascending: order.direction === 'asc' });
  }

  if (queryValue.__startAfter) {
    const cursorField = queryValue.__orderBy[0]?.fieldPath ?? 'id';
    const cursorDirection = queryValue.__orderBy[0]?.direction ?? 'asc';
    const cursorSource = cursorField === 'id' ? queryValue.__startAfter.id : queryValue.__startAfter.data()?.[cursorField];
    const cursorValue = toComparableValue(cursorSource);

    if (cursorValue !== undefined && cursorValue !== null) {
      builder =
        cursorDirection === 'asc'
          ? builder.gt(cursorField, cursorValue)
          : builder.lt(cursorField, cursorValue);
    }
  }

  if (typeof queryValue.__limit === 'number') {
    builder = builder.limit(queryValue.__limit);
  }

  return builder;
}

function collectionFromSegments(pathSegments: string[]) {
  const path = pathSegments.join('/');
  const id = pathSegments[pathSegments.length - 1];

  if (pathSegments.length === 3 && pathSegments[0] === 'products' && pathSegments[2] === 'reviews') {
    return {
      __kind: 'collection' as const,
      type: 'collection' as const,
      id,
      path,
      _query: {
        path: toPathObject(path),
      },
      __table: SUPABASE_REVIEWS_TABLE,
      __segments: pathSegments,
      __filters: [] as WhereConstraint[],
      __orderBy: [] as OrderByConstraint[],
      __limit: undefined,
      __startAfter: undefined,
      __nestedProductId: pathSegments[1],
    };
  }

  return {
    __kind: 'collection' as const,
    type: 'collection' as const,
    id,
    path,
    _query: {
      path: toPathObject(path),
    },
    __table: id,
    __segments: pathSegments,
    __filters: [] as WhereConstraint[],
    __orderBy: [] as OrderByConstraint[],
    __limit: undefined,
    __startAfter: undefined,
    __nestedProductId: undefined,
  };
}

export class Timestamp {
  public readonly seconds: number;
  public readonly nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now() {
    return Timestamp.fromDate(new Date());
  }

  static fromDate(date: Date) {
    const millis = date.getTime();
    const seconds = Math.floor(millis / 1000);
    const nanoseconds = (millis % 1000) * 1_000_000;
    return new Timestamp(seconds, nanoseconds);
  }

  static fromMillis(milliseconds: number) {
    return Timestamp.fromDate(new Date(milliseconds));
  }

  toDate() {
    return new Date(this.toMillis());
  }

  toMillis() {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1_000_000);
  }
}

export class FirestoreError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'firestore/unknown') {
    super(message);
    this.name = 'FirestoreError';
    this.code = code;
  }
}

export interface Firestore {
  app?: FirebaseApp;
  type: 'firestore';
}

interface BaseQueryMeta {
  __table: string;
  __segments: string[];
  __filters: WhereConstraint[];
  __orderBy: OrderByConstraint[];
  __limit?: number;
  __startAfter?: DocumentSnapshot<DocumentData>;
  __nestedProductId?: string;
}

export interface CollectionReference<T = DocumentData> extends BaseQueryMeta {
  __kind: 'collection';
  type: 'collection';
  id: string;
  path: string;
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
  };
}

export interface Query<T = DocumentData> extends BaseQueryMeta {
  __kind: 'query';
  type: 'query';
  path: string;
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
  };
}

export interface DocumentReference<T = DocumentData> {
  __kind: 'document';
  id: string;
  path: string;
  parent: CollectionReference<T>;
  __table: string;
  __segments: string[];
  __nestedProductId?: string;
}

export class DocumentSnapshot<T = DocumentData> {
  constructor(
    public readonly id: string,
    private readonly payload: T | null,
    private readonly existsValue: boolean
  ) {}

  data() {
    return this.payload as T;
  }

  exists() {
    return this.existsValue;
  }
}

export class QuerySnapshot<T = DocumentData> {
  constructor(public readonly docs: Array<DocumentSnapshot<T>>) {}
}

interface WhereConstraint {
  kind: 'where';
  fieldPath: string;
  opStr: WhereFilterOp;
  value: unknown;
}

interface LimitConstraint {
  kind: 'limit';
  count: number;
}

interface OrderByConstraint {
  kind: 'orderBy';
  fieldPath: string;
  direction: OrderByDirection;
}

interface StartAfterConstraint {
  kind: 'startAfter';
  snapshot: DocumentSnapshot<DocumentData>;
}

type QueryConstraint =
  | WhereConstraint
  | LimitConstraint
  | OrderByConstraint
  | StartAfterConstraint;

export interface SetOptions {
  merge?: boolean;
}

export function getFirestore(app?: FirebaseApp): Firestore {
  return {
    app,
    type: 'firestore',
  };
}

export function collection(
  parent: Firestore | DocumentReference<DocumentData>,
  ...pathSegments: string[]
): CollectionReference<DocumentData> {
  const basePath = isDocumentReference(parent) ? parent.path.split('/') : [];
  const segments = [...basePath, ...pathSegments];

  if (segments.length === 0 || segments.length % 2 === 0) {
    throw new Error('Invalid collection path.');
  }

  return collectionFromSegments(segments);
}

export function doc(
  parent: Firestore | CollectionReference<DocumentData>,
  ...pathSegments: string[]
): DocumentReference<DocumentData> {
  const basePath = isCollectionReference(parent) ? parent.path.split('/') : [];
  const segments = [...basePath, ...pathSegments];

  if (segments.length < 2 || segments.length % 2 !== 0) {
    throw new Error('Invalid document path.');
  }

  const id = segments[segments.length - 1];
  const parentSegments = segments.slice(0, -1);
  const parentCollection = collectionFromSegments(parentSegments);

  return {
    __kind: 'document',
    id,
    path: segments.join('/'),
    parent: parentCollection,
    __table: parentCollection.__table,
    __segments: segments,
    __nestedProductId: parentCollection.__nestedProductId,
  };
}

export function query<T = DocumentData>(
  base: CollectionReference<T> | Query<T>,
  ...constraints: QueryConstraint[]
): Query<T> {
  return withQueryConstraints(base, constraints);
}

export function where(fieldPath: string, opStr: WhereFilterOp, value: unknown): WhereConstraint {
  return {
    kind: 'where',
    fieldPath,
    opStr,
    value,
  };
}

export function orderBy(fieldPath: string, direction: OrderByDirection = 'asc'): OrderByConstraint {
  return {
    kind: 'orderBy',
    fieldPath,
    direction,
  };
}

export function limit(count: number): LimitConstraint {
  return {
    kind: 'limit',
    count,
  };
}

export function startAfter(snapshot: DocumentSnapshot<DocumentData>): StartAfterConstraint {
  return {
    kind: 'startAfter',
    snapshot,
  };
}

export function serverTimestamp() {
  return { [SERVER_TIMESTAMP_TOKEN]: true };
}

export async function getDocs<T = DocumentData>(
  target: CollectionReference<T> | Query<T>
): Promise<QuerySnapshot<T>> {
  const queryValue = toQuery(target as any);
  const builder = applyQueryToBuilder(queryValue as Query<DocumentData>);
  const { data, error } = await builder;

  if (error) {
    if (isRecoverableReadError(error)) {
      warnRecoverableRead(
        isMissingTableError(error)
          ? makeMissingTableMessage(queryValue.__table)
          : makePermissionDeniedMessage(queryValue.__table)
      );
      const fallbackRows = runFallbackQuery(queryValue as Query<DocumentData>);
      const fallbackDocs = fallbackRows.map((row, index) => {
        const id = resolveDocumentId(row, `${queryValue.__table}-fallback-${index}`);
        return new DocumentSnapshot<T>(id, normalizeDocumentData(row), true);
      });
      return new QuerySnapshot<T>(fallbackDocs);
    }

    throw makeFirestoreError(error.message, error.code ?? 'firestore/query-failed');
  }

  let rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    rows = runFallbackQuery(queryValue as Query<DocumentData>);
  }

  const docs = rows.map((row, index) => {
    const id = resolveDocumentId(row, `${queryValue.__table}-${index}`);
    return new DocumentSnapshot<T>(id, normalizeDocumentData(row), true);
  });

  return new QuerySnapshot<T>(docs);
}

async function getDocSnapshot<T = DocumentData>(docRef: DocumentReference<T>) {
  const supabase = getSupabaseBrowserClient();
  let builder: any = supabase.from(docRef.__table).select('*').eq('id', docRef.id).limit(1);

  if (docRef.__nestedProductId) {
    const productId = String(docRef.__nestedProductId);
    builder = builder.or(`productId.eq.${productId},product_id.eq.${productId}`);
  }

  const { data, error } = await builder.maybeSingle();

  if (error) {
    if (isRecoverableReadError(error)) {
      warnRecoverableRead(
        isMissingTableError(error)
          ? makeMissingTableMessage(docRef.__table)
          : makePermissionDeniedMessage(docRef.__table)
      );
      return new DocumentSnapshot<T>(docRef.id, null, false);
    }

    throw makeFirestoreError(error.message, error.code ?? 'firestore/get-failed');
  }

  if (!data) {
    return new DocumentSnapshot<T>(docRef.id, null, false);
  }

  return new DocumentSnapshot<T>(resolveDocumentId(data, docRef.id), normalizeDocumentData(data), true);
}

export function onSnapshot<T = DocumentData>(
  target: CollectionReference<T> | Query<T> | DocumentReference<T>,
  next: ((snapshot: QuerySnapshot<T>) => void) | ((snapshot: DocumentSnapshot<T>) => void),
  error?: (error: FirestoreError) => void
) {
  const supabase = getSupabaseBrowserClient();
  let isClosed = false;

  const table = isDocumentReference(target)
    ? target.__table
    : toQuery(target as any).__table;

  const emit = async () => {
    if (isClosed) {
      return;
    }

    try {
      if (isDocumentReference(target)) {
        const snapshot = await getDocSnapshot(target as DocumentReference<T>);
        (next as (snapshot: DocumentSnapshot<T>) => void)(snapshot);
      } else {
        const snapshot = await getDocs(target as CollectionReference<T> | Query<T>);
        (next as (snapshot: QuerySnapshot<T>) => void)(snapshot);
      }
    } catch (caught) {
      if (error) {
        const normalizedError =
          caught instanceof FirestoreError
            ? caught
            : makeFirestoreError(caught instanceof Error ? caught.message : String(caught));
        error(normalizedError);
      }
    }
  };

  void emit();

  const channel = supabase
    .channel(`firestore-compat-${table}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      () => {
        void emit();
      }
    )
    .subscribe();

  const pollInterval = setInterval(() => {
    void emit();
  }, 20_000);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    void supabase.removeChannel(channel);
  };
}

export async function addDoc(
  colRef: CollectionReference<DocumentData>,
  data: DocumentData
) {
  const supabase = getSupabaseBrowserClient();
  const payload = sanitizeForWrite(data);

  if (colRef.__nestedProductId) {
    if (payload.productId === undefined) {
      payload.productId = colRef.__nestedProductId;
    }

    if (payload.product_id === undefined) {
      payload.product_id = colRef.__nestedProductId;
    }
  }

  const { data: inserted, error } = await supabase
    .from(colRef.__table)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw makeFirestoreError(
        makeMissingTableMessage(colRef.__table),
        'firestore/missing-table'
      );
    }

    throw makeFirestoreError(error.message, error.code ?? 'firestore/insert-failed');
  }

  const id = resolveDocumentId(inserted ?? {}, `new-${Date.now()}`);
  return doc(colRef, id);
}

export async function setDoc(
  docRef: DocumentReference<DocumentData>,
  data: DocumentData,
  options?: SetOptions
) {
  const payload = sanitizeForWrite(data);

  if (options?.merge) {
    return updateDoc(docRef, payload);
  }

  const supabase = getSupabaseBrowserClient();
  const completePayload = {
    ...payload,
    id: docRef.id,
  };

  if (docRef.__nestedProductId) {
    if (completePayload.productId === undefined) {
      completePayload.productId = docRef.__nestedProductId;
    }

    if (completePayload.product_id === undefined) {
      completePayload.product_id = docRef.__nestedProductId;
    }
  }

  const { error } = await supabase.from(docRef.__table).upsert(completePayload);

  if (error) {
    if (isMissingTableError(error)) {
      throw makeFirestoreError(
        makeMissingTableMessage(docRef.__table),
        'firestore/missing-table'
      );
    }

    throw makeFirestoreError(error.message, error.code ?? 'firestore/set-failed');
  }
}

export async function updateDoc(docRef: DocumentReference<DocumentData>, data: DocumentData) {
  const supabase = getSupabaseBrowserClient();
  const payload = sanitizeForWrite(data);

  let builder: any = supabase.from(docRef.__table).update(payload).eq('id', docRef.id);

  if (docRef.__nestedProductId) {
    const productId = String(docRef.__nestedProductId);
    builder = builder.or(`productId.eq.${productId},product_id.eq.${productId}`);
  }

  const { error } = await builder;

  if (error) {
    if (isMissingTableError(error)) {
      throw makeFirestoreError(
        makeMissingTableMessage(docRef.__table),
        'firestore/missing-table'
      );
    }

    throw makeFirestoreError(error.message, error.code ?? 'firestore/update-failed');
  }
}

export async function deleteDoc(docRef: DocumentReference<DocumentData>) {
  const supabase = getSupabaseBrowserClient();

  let builder: any = supabase.from(docRef.__table).delete().eq('id', docRef.id);

  if (docRef.__nestedProductId) {
    const productId = String(docRef.__nestedProductId);
    builder = builder.or(`productId.eq.${productId},product_id.eq.${productId}`);
  }

  const { error } = await builder;

  if (error) {
    if (isMissingTableError(error)) {
      throw makeFirestoreError(
        makeMissingTableMessage(docRef.__table),
        'firestore/missing-table'
      );
    }

    throw makeFirestoreError(error.message, error.code ?? 'firestore/delete-failed');
  }
}
