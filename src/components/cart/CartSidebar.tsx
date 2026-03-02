'use client';

import * as React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, X, LoaderCircle, CheckCircle2 } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { verifyPayment } from '@/ai/flows/verify-payment';

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    className="h-5 w-5"
  >
    <path fill="black" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .2c54.9 0 105.8 21.2 144.2 59.5 38.2 38.3 59.5 89.4 59.5 144.2 0 112.2-91.5 203.7-203.7 203.7-35.1 0-69.2-9-98.7-25.9l-7.1-4.2-73.3 19.3 19.7-71.5-4.5-7.4c-18.4-30.6-28.2-66.2-28.2-103.5 0-112.2 91.5-203.7 203.7-203.7zM223.9 150.1c-12.2 0-22.1 9.9-22.1 22.1v.1c0 12.2 9.9 22.1 22.1 22.1 6.1 0 11.6-2.5 15.6-6.5 3.9-3.9 6.5-9.4 6.5-15.6-.1-12.2-10-22.1-22.1-22.1zm53.8 141.2c-4.4-2.2-26.2-12.9-30.3-14.4-4.1-1.5-7.1-2.2-10.1 2.2s-11.4 14.4-14 17.3c-2.6 3-5.2 3.3-9.6 1.1-4.4-2.2-18.6-6.9-35.4-21.8-13-11.7-21.8-26.2-24.4-30.6-2.6-4.4-.3-6.9 1.9-9.1 2-2 4.4-5.2 6.6-7.8 2.2-2.6 3-4.4 1.5-7.4-1.5-3-10.1-24.3-13.8-33.3-3.7-8.9-7.5-7.7-10.1-7.8h-9.1c-2.6 0-7.1.3-10.9 4.4-3.8 4.1-14.6 14.3-14.6 34.9 0 20.6 15 40.5 17.1 43.5 2.1 3 29.5 44.9 71.9 62.8 10.4 4.4 18.5 7.1 24.8 9.1 6.3 2 12.1 1.7 16.7.7 5.2-.9 26.2-10.7 29.9-21.1 3.7-10.4 3.7-19.3 2.6-21.1-1.1-1.9-4.1-3-8.5-5.2z" />
  </svg>
);

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'A valid phone number is required'),
  description: z.string().min(1, 'Delivery address is required'),
});
type CheckoutFormData = z.infer<typeof checkoutSchema>;

function CheckoutDialog() {
  const { cart, cartTotal, clearCart, setOpen: setCartOpen } = useAppContext();
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const { toast } = useToast();

  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: '', phone: '0700000000', description: '' },
    mode: 'onChange',
  });

  const watchedPhone = checkoutForm.watch('phone');
  const watchedName = checkoutForm.watch('name');
  const watchedDescription = checkoutForm.watch('description');

  const config = React.useMemo(() => ({
    reference: (new Date()).getTime().toString(),
    email: "customer@runway.com", 
    amount: cartTotal * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'KES',
    metadata: {
        cartItems: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        customerName: watchedName,
        customerPhone: watchedPhone,
    }
  }), [cart, cartTotal, watchedPhone, watchedName]);

  const initializePayment = usePaystackPayment(config);

  const onPaymentSuccess = async (reference: any) => {
    setIsVerifying(true);
    const orderPayload = {
      products: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
      totalAmount: cartTotal,
      shippingAddress: { description: watchedDescription },
      customerName: watchedName,
      customerPhone: watchedPhone,
    };
    try {
      const result = await verifyPayment({ reference: reference.reference, orderPayload });
      if (result.success) {
        setPaymentSuccess(true);
        toast({ title: "Transaction Successful!", description: "Your order has been recorded." });
        setTimeout(() => {
          clearCart();
          setCartOpen(false);
          setIsCheckoutDialogOpen(false);
          setPaymentSuccess(false);
        }, 2000);
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: result.message });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({ variant: "destructive", title: "Error", description: "Payment verified but order failed to record." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckoutSubmit = (data: CheckoutFormData) => {
    initializePayment(onPaymentSuccess);
  };
  
  const handlePayNowClick = () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Bag is Empty" });
      return;
    }
    if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
      toast({ variant: "destructive", title: "Configuration Error", description: "Payment key is missing." });
      return;
    }
    setIsCheckoutDialogOpen(true);
  };

  return (
    <>
      <Button className="w-full h-12 rounded-full font-bold shadow-lg" size="lg" onClick={handlePayNowClick} disabled={isVerifying}>
        {isVerifying ? 'Verifying...' : 'Pay with Paystack'}
      </Button>
      <Dialog open={isCheckoutDialogOpen} onOpenChange={(open) => !isVerifying && setIsCheckoutDialogOpen(open)}>
        <DialogContent onPointerDownOutside={(e) => isVerifying && e.preventDefault()} className="rounded-3xl border-2 border-black sm:max-w-md">
          {paymentSuccess ? (
             <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black mb-2">Success!</h2>
                <p className="text-gray-500 font-medium">Payment received and order confirmed.</p>
             </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-center">Checkout Details</DialogTitle>
              </DialogHeader>
              <Form {...checkoutForm}>
                <form onSubmit={checkoutForm.handleSubmit(handleCheckoutSubmit)} className="space-y-4 py-4">
                    <FormField control={checkoutForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">Full Name</FormLabel>
                        <FormControl><Input placeholder="Jane Doe" {...field} className="rounded-xl h-11 border-2" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={checkoutForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">Phone Number</FormLabel>
                        <FormControl><Input type="tel" {...field} className="rounded-xl h-11 border-2" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  <FormField control={checkoutForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-tighter">Delivery Address</FormLabel>
                      <FormControl><Textarea placeholder="Where should we drop it off?" {...field} className="rounded-xl min-h-[80px] border-2" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <DialogFooter className="mt-6">
                    <Button type="submit" size="lg" className="w-full rounded-full h-12 font-bold shadow-lg" disabled={!checkoutForm.formState.isValid || isVerifying}>
                        {isVerifying ? <LoaderCircle className="animate-spin" /> : 'Confirm & Proceed to Payment'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CartSidebar() {
  const { cart, removeFromCart, updateQuantity, cartCount, cartTotal, open, setOpen } = useAppContext();
  
  const handleCheckoutViaWhatsApp = () => {
    if (cart.length === 0) return;
    let message = "Hi Eddjos, I want to order:\n\n";
    cart.forEach(item => {
      message += `- ${item.name} (x${item.quantity})\n`;
    });
    message += `\nTotal: Ksh ${cartTotal.toLocaleString()}`;
    const whatsappUrl = `https://wa.me/254740685488?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white text-[10px] font-bold">
                    {cartCount}
                </span>
            )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-xl font-black">YOUR BAG ({cartCount})</SheetTitle>
        </SheetHeader>
        {cart.length > 0 ? (
          <>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="relative h-24 w-20 rounded-xl overflow-hidden border bg-gray-50 flex-shrink-0">
                    <Image
                      src={item.images[0]?.url || ''}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0 py-1">
                    <h4 className="font-bold truncate text-sm text-gray-900">{item.name}</h4>
                    <p className="font-black text-black text-sm mt-1">Ksh {item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-3 bg-gray-50 w-fit px-2 py-1 rounded-full border">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:text-red-500 transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="font-black text-xs min-w-[12px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:text-blue-500 transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors self-start py-1"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <SheetFooter className="p-6 border-t bg-gray-50 flex-col sm:flex-col sm:space-x-0 gap-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bag Total</span>
                    <span className="text-xl font-black">Ksh {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <CheckoutDialog />
                  <Button size="lg" variant="tactile-green" className="w-full h-12 rounded-full font-bold shadow-md" onClick={handleCheckoutViaWhatsApp}>
                      <WhatsAppIcon />
                      Order via WhatsApp
                  </Button>
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-gray-200" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">BAG IS EMPTY</p>
              <p className="text-sm text-gray-400">Discover something you love.</p>
            </div>
            <Button variant="outline" className="rounded-full px-8" onClick={() => setOpen(false)}>Continue Browsing</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
