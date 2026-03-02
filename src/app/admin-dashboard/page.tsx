'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useFirebaseApp, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash, Edit, Copy, Star, PlusCircle, LogOut, ShoppingBag, Package, CheckCircle2, Check, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_CATEGORY_NAMES = ['Men', 'Women', 'Children', 'Unisex', 'Bags'];
const DEFAULT_STYLE_NAMES = ['Classic'];

const COLOR_PALETTE = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Stone', hex: '#A8A29E' },
  { name: 'Gray', hex: '#808080' }, { name: 'Red', hex: '#FF0000' }, { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Blue', hex: '#0000FF' }, { name: 'Sky', hex: '#87CEEB' }, { name: 'Green', hex: '#008000' },
  { name: 'Lime', hex: '#00FF00' }, { name: 'Yellow', hex: '#FFFF00' }, { name: 'Orange', hex: '#FFA500' },
  { name: 'Brown', hex: '#A52A2A' }, { name: 'Beige', hex: '#F5F5DC' }, { name: 'Purple', hex: '#800080' },
  { name: 'Indigo', hex: '#4B0082' }, { name: 'Sage', hex: '#9C9F84' }, { name: 'Olive', hex: '#808000' },
  { name: 'Terracotta', hex: '#E2725B' }, { name: 'Ochre', hex: '#CC7722' }, { name: 'Sand', hex: '#C2B280' },
  { name: 'Taupe', hex: '#483C32' }, { name: 'Charcoal', hex: '#36454F' }, { name: 'Slate', hex: '#708090' },
  { name: 'Navy', hex: '#000080' }, { name: 'Maroon', hex: '#800000' }, { name: 'Forest', hex: '#228B22' },
  { name: 'Zinc', hex: '#71717A' }, { name: 'Teal', hex: '#008080' }, { name: 'Emerald', hex: '#50C878' }
];

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  style: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  originalPrice: z.coerce.number().optional().nullable(),
  imageUrl1: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageUrl2: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageUrl3: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageUrl4: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sizes: z.array(z.string()).optional(),
  availableColors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
  isFeatured: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;
type Category = { id: string; name: string };
type Style = { id: string; name: string };
const SITE_URL = 'https://www.eddjos.com';

function mergeNamedOptions<T extends { id: string; name: string }>(
  existing: T[] | undefined,
  optimistic: T[],
  defaults: string[],
  prefix: string
) {
  const bucket = new Map<string, T>();

  for (const item of existing || []) {
    const normalized = item.name.trim().toLowerCase();
    if (!normalized) continue;
    bucket.set(normalized, item);
  }

  for (const item of optimistic) {
    const normalized = item.name.trim().toLowerCase();
    if (!normalized) continue;
    bucket.set(normalized, item);
  }

  for (const defaultName of defaults) {
    const normalized = defaultName.trim().toLowerCase();
    if (!normalized || bucket.has(normalized)) continue;
    bucket.set(normalized, { id: `${prefix}-${normalized.replace(/\s+/g, '-')}`, name: defaultName } as T);
  }

  return Array.from(bucket.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getCategoryPath(category: string) {
  const normalized = category.trim().toLowerCase();
  if (!normalized) return '/';

  const categoryRouteMap: Record<string, string> = {
    men: '/men',
    women: '/women',
    children: '/children',
    unisex: '/unisex',
    bags: '/bags',
  };

  return categoryRouteMap[normalized] || `/${normalized.replace(/\s+/g, '-')}`;
}

function toTitleCaseSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DashboardContent({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingStyle, setIsSavingStyle] = useState(false);
  const [optimisticCategories, setOptimisticCategories] = useState<Category[]>([]);
  const [optimisticStyles, setOptimisticStyles] = useState<Style[]>([]);

  const productsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const categoriesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const stylesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'styles') : null, [firestore]);
  const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const { data: styles, isLoading: isLoadingStyles } = useCollection<Style>(stylesQuery);
  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return { totalSales: 0, pendingOrders: 0, totalRevenue: 0 };
    return orders.reduce((acc, order) => {
      acc.totalSales += order.products.reduce((sum, p) => sum + p.quantity, 0);
      acc.totalRevenue += order.totalAmount;
      if (order.status === 'pending') acc.pendingOrders++;
      return acc;
    }, { totalSales: 0, pendingOrders: 0, totalRevenue: 0 });
  }, [orders]);

  const sortedCategories = useMemo(
    () => mergeNamedOptions<Category>(categories || undefined, optimisticCategories, DEFAULT_CATEGORY_NAMES, 'cat'),
    [categories, optimisticCategories]
  );
  const sortedStyles = useMemo(
    () => mergeNamedOptions<Style>(styles || undefined, optimisticStyles, DEFAULT_STYLE_NAMES, 'style'),
    [styles, optimisticStyles]
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', slug: '', description: '', category: '', style: '',
      price: 0, originalPrice: null, imageUrl1: '', imageUrl2: '',
      imageUrl3: '', imageUrl4: '', sizes: [], availableColors: [],
      isFeatured: false,
    },
  });

  const nameValue = form.watch('name');
  const slugValue = form.watch('slug');
  const descriptionValue = form.watch('description');
  const categoryValue = form.watch('category');
  const isFeaturedValue = form.watch('isFeatured');

  const productPath = slugValue?.trim() ? `/products/${slugValue.trim()}` : '/products/{slug}';
  const categoryPath = categoryValue?.trim() ? getCategoryPath(categoryValue) : '/{category}';
  const seoTitlePreview = slugValue?.trim()
    ? `${toTitleCaseSlug(slugValue.trim())} | Kenyan Clothing & Fashion - Eddjos`
    : 'Product Name | Kenyan Clothing & Fashion - Eddjos';
  const seoDescriptionPreview = (descriptionValue?.trim()
    ? descriptionValue.trim()
    : 'Shop premium Kenyan clothing at Eddjos. Discover quality outfits in Nairobi and across Kenya for men, women, unisex, children, and bags.'
  ).slice(0, 160);

  const featuredPlacements = [
    {
      label: 'Product Details Page',
      value: `${SITE_URL}${productPath}`,
      active: true,
    },
    {
      label: 'Category Listing Page',
      value: `${SITE_URL}${categoryPath}`,
      active: !!categoryValue?.trim(),
    },
    {
      label: 'Homepage Featured Products',
      value: `${SITE_URL}/`,
      active: !!isFeaturedValue,
    },
  ];

  const searchQuickLinks = [
    { label: 'Shop Men', href: `${SITE_URL}/men` },
    { label: 'Shop Women', href: `${SITE_URL}/women` },
    { label: 'Shop Unisex', href: `${SITE_URL}/unisex` },
    { label: 'Shop Bags', href: `${SITE_URL}/bags` },
  ];

  useEffect(() => {
    if (!editingProduct && nameValue) {
      const generatedSlug = nameValue.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      form.setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, editingProduct, form.setValue]);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firebaseApp) return;

    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setUploadProgress(0);

    uploadTask.on('state_changed',
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => {
            console.error("Upload failed", error);
            setUploading(false);
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                setUploadedUrl(downloadURL);
                setUploading(false);
                const imageFields: ('imageUrl1' | 'imageUrl2' | 'imageUrl3' | 'imageUrl4')[] = ['imageUrl1', 'imageUrl2', 'imageUrl3', 'imageUrl4'];
                const firstEmptyField = imageFields.find(field => !form.getValues(field));
                if (firstEmptyField) {
                    form.setValue(firstEmptyField, downloadURL, { shouldValidate: true });
                }
            });
        }
    );
  };

  const copyUrlToClipboard = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl).then(() => toast({ title: "Copied to Clipboard!" }));
  };

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name, slug: editingProduct.slug, description: editingProduct.description,
        category: editingProduct.category, style: editingProduct.style || '', price: editingProduct.price,
        originalPrice: editingProduct.originalPrice, imageUrl1: editingProduct.images?.[0]?.url || '',
        imageUrl2: editingProduct.images?.[1]?.url || '', imageUrl3: editingProduct.images?.[2]?.url || '',
        imageUrl4: editingProduct.images?.[3]?.url || '', sizes: editingProduct.sizes || [],
        availableColors: editingProduct.availableColors || [], isFeatured: editingProduct.isFeatured || false,
      });
    } else {
      form.reset();
    }
  }, [editingProduct, form]);

  const onSubmit = (data: ProductFormData) => {
    if (!firestore) return;
    
    const images = [data.imageUrl1, data.imageUrl2, data.imageUrl3, data.imageUrl4]
        .filter((url): url is string => !!url)
        .map(url => ({ url, alt: data.name, hint: 'product image' }));
    
    const productData = {
      ...data,
      style: data.style || null,
      originalPrice: data.originalPrice || null,
      images: images,
      isFeatured: data.isFeatured ?? false,
      updatedAt: serverTimestamp(),
    };

    if (editingProduct) {
      updateDocumentNonBlocking(doc(firestore, 'products', editingProduct.id), productData);
      toast({ title: 'Product Updated' });
    } else {
      addDocumentNonBlocking(collection(firestore, 'products'), { ...productData, createdAt: serverTimestamp() });
      toast({ title: 'Product Added' });
    }
    
    setIsDialogOpen(false);
    setEditingProduct(null);
  };
  
  const handleDelete = (productId: string) => {
    if (!firestore) return;
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteDocumentNonBlocking(doc(firestore, 'products', productId));
      toast({ title: 'Product Deleted' });
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }
  
  const openNewDialog = () => {
    setEditingProduct(null);
    form.reset({
      name: '', slug: '', description: '', category: '', style: '',
      price: 0, originalPrice: null, imageUrl1: '', imageUrl2: '',
      imageUrl3: '', imageUrl4: '', sizes: [], availableColors: [],
      isFeatured: false,
    });
    setIsDialogOpen(true);
  }
  
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    setIsSavingCategory(true);
    try {
      const response = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', name }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to add category.');
      }

      const newRecord: Category = {
        id: String(result?.data?.id || `cat-${name.toLowerCase().replace(/\s+/g, '-')}`),
        name: String(result?.data?.name || name),
      };

      setOptimisticCategories((current) => {
        const normalized = newRecord.name.trim().toLowerCase();
        return [...current.filter((item) => item.name.trim().toLowerCase() !== normalized), newRecord];
      });
      form.setValue('category', newRecord.name, { shouldValidate: true });
      setNewCategoryName('');
      setIsCategoryDialogOpen(false);
      toast({ title: 'Category Added', description: `${newRecord.name} is now available.` });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to add category.';
      toast({ variant: 'destructive', title: 'Category Add Failed', description: message });
    } finally {
      setIsSavingCategory(false);
    }
  };
  
  const handleAddStyle = async () => {
    const name = newStyleName.trim();
    if (!name) return;

    setIsSavingStyle(true);
    try {
      const response = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'style', name }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to add style.');
      }

      const newRecord: Style = {
        id: String(result?.data?.id || `style-${name.toLowerCase().replace(/\s+/g, '-')}`),
        name: String(result?.data?.name || name),
      };

      setOptimisticStyles((current) => {
        const normalized = newRecord.name.trim().toLowerCase();
        return [...current.filter((item) => item.name.trim().toLowerCase() !== normalized), newRecord];
      });
      form.setValue('style', newRecord.name, { shouldValidate: true });
      setNewStyleName('');
      setIsStyleDialogOpen(false);
      toast({ title: 'Style Added', description: `${newRecord.name} is now available.` });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to add style.';
      toast({ variant: 'destructive', title: 'Style Add Failed', description: message });
    } finally {
      setIsSavingStyle(false);
    }
  };
  
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'orders', orderId), { status });
    toast({ title: 'Order Status Updated' });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-black tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground mt-1 text-sm uppercase font-semibold tracking-widest">Store Management</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" onClick={onLogout} className="rounded-full"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
            <Button onClick={openNewDialog} className="rounded-full shadow-lg"><PlusCircle className="h-4 w-4 mr-2" /> Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-2xl"><ShoppingBag className="text-blue-600" /></div>
                      <div>
                          <p className="text-sm font-bold text-muted-foreground uppercase">Revenue</p>
                          <h3 className="text-2xl font-black">Ksh {stats.totalRevenue.toLocaleString()}</h3>
                      </div>
                  </div>
              </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-2xl"><Package className="text-orange-600" /></div>
                      <div>
                          <p className="text-sm font-bold text-muted-foreground uppercase">Pending</p>
                          <h3 className="text-2xl font-black">{stats.pendingOrders} Orders</h3>
                      </div>
                  </div>
              </CardContent>
          </Card>
          <Card className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-2xl"><CheckCircle2 className="text-green-600" /></div>
                      <div>
                          <p className="text-sm font-bold text-muted-foreground uppercase">Total Sold</p>
                          <h3 className="text-2xl font-black">{stats.totalSales} Items</h3>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold">Product Name</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold">URL Slug</FormLabel><FormControl><Input {...field} value={field.value || ''} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>

              <FormField control={form.control} name="isFeatured" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 border-black p-4 bg-gray-50">
                    <div className="space-y-0.5"><FormLabel className="text-base font-bold">Feature on Homepage</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
              )}/>

              <div className="rounded-2xl border-2 border-black p-4 md:p-5 bg-white space-y-4">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider">Visibility & Search Preview</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preview where this product is visible on the website and how it may appear in search results.
                  </p>
                </div>
                <div className="space-y-2">
                  {featuredPlacements.map((placement) => (
                    <div key={placement.label} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide">{placement.label}</p>
                        <p className="text-[11px] text-muted-foreground break-all">{placement.value}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full shrink-0",
                        placement.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      )}>
                        {placement.active ? 'Active' : 'Off'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border p-4 bg-gray-50">
                  <p className="text-[11px] text-green-700">{SITE_URL}{productPath}</p>
                  <p className="text-lg leading-tight text-blue-700 mt-1">{seoTitlePreview}</p>
                  <p className="text-sm text-gray-700 mt-1">{seoDescriptionPreview}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchQuickLinks.map((link) => (
                      <div key={link.label} className="rounded-lg border bg-white p-2">
                        <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                        <p className="text-[11px] text-muted-foreground break-all">{link.href}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Category</FormLabel>
                       <div className="flex gap-2">
                        <FormControl>
                          <select
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="flex h-10 w-full items-center rounded-xl border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="" disabled>Select category</option>
                            {sortedCategories.map((cat) => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setIsCategoryDialogOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Main category pages: Men, Women, Children, Unisex, Bags.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {sortedCategories.map((cat) => (
                          <button
                            key={`pick-cat-${cat.id}`}
                            type="button"
                            onClick={() => field.onChange(cat.name)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                              (field.value || '').trim().toLowerCase() === cat.name.trim().toLowerCase()
                                ? "bg-black text-white border-black"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="style" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Style</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <select
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="flex h-10 w-full items-center rounded-xl border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">No style</option>
                            {sortedStyles.map((sty) => (
                              <option key={sty.id} value={sty.name}>{sty.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setIsStyleDialogOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {sortedStyles.map((sty) => (
                          <button
                            key={`pick-style-${sty.id}`}
                            type="button"
                            onClick={() => field.onChange(sty.name)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                              (field.value || '').trim().toLowerCase() === sty.name.trim().toLowerCase()
                                ? "bg-black text-white border-black"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            {sty.name}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Price (Ksh)</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} className="rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="originalPrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Original Price (Discount)</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} className="rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
              </div>

               <Separator />
              
               <div className="space-y-4">
                <h3 className="text-lg font-black uppercase tracking-wider">Images</h3>
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-2xl space-y-4">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="rounded-xl" />
                    {uploading && <Progress value={uploadProgress} className="h-2" />}
                    {uploadedUrl && (
                        <div className="flex items-center gap-2"><Input readOnly value={uploadedUrl} className="text-xs rounded-xl" /><Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={copyUrlToClipboard}><Copy className="h-4 w-4" /></Button></div>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <FormField control={form.control} name="imageUrl1" render={({ field }) => ( <FormItem><FormControl><Input {...field} value={field.value || ''} placeholder="Image 1 URL (Main)" className="rounded-xl" /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="imageUrl2" render={({ field }) => ( <FormItem><FormControl><Input {...field} value={field.value || ''} placeholder="Image 2 URL" className="rounded-xl" /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="imageUrl3" render={({ field }) => ( <FormItem><FormControl><Input {...field} value={field.value || ''} placeholder="Image 3 URL" className="rounded-xl" /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="imageUrl4" render={({ field }) => ( <FormItem><FormControl><Input {...field} value={field.value || ''} placeholder="Image 4 URL" className="rounded-xl" /></FormControl></FormItem> )}/>
                </div>
              </div>

              <Separator />

              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="font-bold">Description</FormLabel><FormControl><Textarea {...field} rows={4} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)}/>
              
              <FormField control={form.control} name="availableColors" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Available Colors</FormLabel>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-4 border rounded-2xl bg-gray-50">
                    {COLOR_PALETTE.map((color) => {
                      const isSelected = field.value?.some(c => c.hex === color.hex);
                      return (
                        <button
                          key={`${color.name}-${color.hex}`}
                          type="button"
                          title={color.name}
                          onClick={() => {
                            const current = field.value || [];
                            const updated = isSelected 
                              ? current.filter(c => c.hex !== color.hex)
                              : [...current, color];
                            field.onChange(updated);
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center relative",
                            isSelected ? "border-black scale-110 shadow-md" : "border-transparent hover:border-gray-300"
                          )}
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && <Check className={cn("h-4 w-4", color.name === 'White' || color.name === 'Beige' || color.name === 'Ivory' || color.name === 'Yellow' ? "text-black" : "text-white")} />}
                        </button>
                      );
                    })}
                  </div>
                  <FormDescription>Select all colors available for this product.</FormDescription>
                </FormItem>
              )} />

              <FormField control={form.control} name="sizes" render={() => (
                <FormItem>
                    <FormLabel className="font-bold">Available Sizes</FormLabel>
                    <div className="flex flex-wrap gap-4 p-4 border rounded-2xl">
                    {AVAILABLE_SIZES.map((size) => (
                        <FormField key={size} control={form.control} name="sizes" render={({ field }) => (
                        <FormItem key={size} className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl><Checkbox checked={field.value?.includes(size)} onCheckedChange={(c) => field.onChange(c ? [...(field.value || []), size] : (field.value || []).filter(v => v !== size))} /></FormControl>
                            <FormLabel className="font-normal">{size}</FormLabel>
                        </FormItem>
                        )}/>
                    ))}
                    </div>
                </FormItem>
              )}/>

              <Button type="submit" size="lg" className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl">{editingProduct ? 'Update Product' : 'Create Product'}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
              <Input placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="rounded-xl" disabled={isSavingCategory} />
              <DialogFooter><Button onClick={handleAddCategory} className="rounded-full" disabled={!newCategoryName.trim() || isSavingCategory}>{isSavingCategory ? 'Adding...' : 'Add Category'}</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>New Style</DialogTitle></DialogHeader>
              <Input placeholder="Style Name" value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)} className="rounded-xl" disabled={isSavingStyle} />
              <DialogFooter><Button onClick={handleAddStyle} className="rounded-full" disabled={!newStyleName.trim() || isSavingStyle}>{isSavingStyle ? 'Adding...' : 'Add Style'}</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingProducts && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        {products?.map(product => (
          <Card key={product.id} className="group border-2 border-black rounded-3xl overflow-hidden hover:shadow-xl transition-all relative">
            <div className="aspect-[4/5.5] relative bg-gray-100">
                {product.images?.[0]?.url && (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-4 left-4 z-10 pointer-events-none max-w-[80%]">
                    <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-md">
                        {product.description}
                    </p>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-20">
                    <Button variant="secondary" size="icon" className="rounded-full h-9 w-9 shadow-md" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" className="rounded-full h-9 w-9 shadow-md" onClick={() => handleDelete(product.id)}><Trash className="h-4 w-4" /></Button>
                </div>
                {product.isFeatured && <div className="absolute top-2 left-2 bg-yellow-400 p-1.5 rounded-full shadow-md z-20"><Star className="h-4 w-4 fill-black" /></div>}
            </div>
            <CardContent className="p-4 bg-white">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold truncate text-sm flex-grow">{product.name}</h3>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full uppercase font-bold">{product.category}</span>
              </div>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-lg font-black">Ksh {product.price.toLocaleString()}</p>
                {typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                  <p className="text-xs text-red-600 line-through font-bold">Ksh {product.originalPrice.toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-16" />

      <h2 className="text-3xl font-black mb-8">Order History</h2>
      <Card className="border-2 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 border-b-2 border-black">
              <TableRow>
                <TableHead className="font-bold text-black uppercase tracking-tighter">Date</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-tighter">Customer & Contact</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-tighter">Delivery Address</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-tighter">Items Ordered</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-tighter">Total</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-tighter">Payment</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-tighter text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOrders && <TableRow><TableCell colSpan={7} className="text-center h-32">Loading orders...</TableCell></TableRow>}
              {orders?.map(order => (
                <TableRow key={order.id} className="hover:bg-gray-50/50">
                  <TableCell className="whitespace-nowrap font-medium">{order.createdAt ? format((order.createdAt as Timestamp).toDate(), 'PP') : 'N/A'}</TableCell>
                  <TableCell>
                    <div className="font-black text-sm">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground flex flex-col">
                        <span>{order.customerPhone}</span>
                        <span className="truncate max-w-[200px]">{order.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2 max-w-[250px]">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium leading-relaxed">{order.shippingAddress?.description || 'No address provided'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold space-y-1">
                        {order.products.map((p, idx) => (
                          <div key={idx} className="bg-gray-100 px-2 py-1 rounded-md mb-1">
                            {p.name} <span className="text-muted-foreground ml-1">x{p.quantity}</span>
                          </div>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-lg">Ksh {order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 font-bold uppercase tracking-wide",
                        order.paymentStatus === 'success'
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {order.paymentStatus || 'recorded'}
                      </div>
                      <div className="text-muted-foreground break-all">
                        {order.paymentReference || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select value={order.status} onValueChange={(s) => handleUpdateOrderStatus(order.id, s as any)}>
                      <SelectTrigger className="w-[120px] h-9 text-xs ml-auto rounded-full font-bold border-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoadingOrders && orders?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground">No orders recorded yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const ADMIN_SESSION_KEY = 'eddyjoy_admin_session';

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const adminCredentials = useMemo(
    () =>
      [
        {
          email: (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase(),
          password: (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Mmm@29315122').trim(),
        },
        {
          email: (process.env.NEXT_PUBLIC_ADMIN_EMAIL_2 || 'joy@admin.com').trim().toLowerCase(),
          password: (process.env.NEXT_PUBLIC_ADMIN_PASSWORD_2 || 'Eddj0s@24').trim(),
        },
      ].filter((credential) => credential.email && credential.password),
    []
  );

  const adminEmails = useMemo(() => adminCredentials.map((credential) => credential.email), [adminCredentials]);
  const authorizedEmailSet = useMemo(() => new Set(adminEmails), [adminEmails]);

  useEffect(() => {
    try {
      const savedSession =
        typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_SESSION_KEY) : null;
      setIsAuthorized(!!savedSession && authorizedEmailSet.has(savedSession.trim().toLowerCase()));
    } finally {
      setIsCheckingSession(false);
    }
  }, [authorizedEmailSet]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const matchedCredential = adminCredentials.find(
      (credential) => normalizedEmail === credential.email && password === credential.password
    );

    if (matchedCredential) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_SESSION_KEY, matchedCredential.email);
      }
      setIsAuthorized(true);
      setEmail('');
      setPassword('');
      setIsLoggingIn(false);
      return;
    }

    setLoginError('Login failed. Check your credentials.');
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setIsAuthorized(false);
    setLoginError(null);
  };

  if (isCheckingSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Skeleton className="h-64 w-full max-w-sm" />
      </div>
    );
  }

  if (isAuthorized) {
    return <DashboardContent onLogout={handleLogout} />;
  }

  return (
    <div className="container mx-auto py-12 flex justify-center items-center min-h-[70vh] px-4">
      <Card className="w-full max-w-sm border-2 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] rounded-3xl p-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black">Admin Access</CardTitle>
          <CardDescription className="font-medium">Enter credentials to manage your store</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="font-bold text-xs uppercase tracking-widest ml-1 block">Email</label>
              <Input
                type="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                required
                className="rounded-2xl h-12 border-2"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-xs uppercase tracking-widest ml-1 block">Password</label>
              <Input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                required
                className="rounded-2xl h-12 border-2"
              />
            </div>
            <Button type="submit" disabled={isLoggingIn} className="w-full h-14 rounded-2xl text-lg font-black mt-4 shadow-lg">
              {isLoggingIn ? 'Verifying...' : 'Login to Dashboard'}
            </Button>
            {loginError && (
              <Alert variant="destructive" className="mt-4 p-2 py-3 rounded-xl border-2">
                <AlertDescription className="text-xs font-bold text-center">{loginError}</AlertDescription>
              </Alert>
            )}
          </form>
          <div className="mt-8 p-4 bg-gray-50 rounded-2xl text-[10px] text-muted-foreground border-2 border-gray-100 border-dashed">
            <p className="font-black text-black mb-1 uppercase tracking-widest">Configuration Status:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div> Login Mode: Admin Credentials</li>
              <li className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-green-500"></div> Target Emails: {adminEmails.join(', ')}</li>
              <li className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> Entry Point: Bags section admin button</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
