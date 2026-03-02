'use server';
/**
 * @fileOverview A server-side flow to securely verify Paystack payments and record orders.
 *
 * - verifyPayment - A function that verifies a payment reference with Paystack and records the order.
 * - VerifyPaymentInput - The input type for the verifyPayment function.
 * - VerifyPaymentOutput - The return type for the verifyPayment function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import type { Order } from '@/lib/types';

const VerifyPaymentInputSchema = z.object({
  reference: z.string().describe('The payment reference from Paystack.'),
  orderPayload: z.object({
    products: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
      })
    ),
    totalAmount: z.number(),
    shippingAddress: z.object({
      description: z.string(),
    }),
    customerName: z.string(),
    customerPhone: z.string(),
  }),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

const VerifyPaymentOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  orderId: z.string().optional(),
});
export type VerifyPaymentOutput = z.infer<typeof VerifyPaymentOutputSchema>;

export async function verifyPayment(
  input: VerifyPaymentInput
): Promise<VerifyPaymentOutput> {
  return verifyPaymentFlow(input);
}

const verifyPaymentFlow = ai.defineFlow(
  {
    name: 'verifyPaymentFlow',
    inputSchema: VerifyPaymentInputSchema,
    outputSchema: VerifyPaymentOutputSchema,
  },
  async ({ reference, orderPayload }) => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      console.error('SERVER_ERROR: Paystack secret key is missing.');
      return { success: false, message: 'Server configuration error.' };
    }

    try {
      console.log(`VERIFY_PAYMENT: Initiating check for reference: ${reference}`);
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const { status, data } = response;

      if (status === 200 && data?.data?.status === 'success') {
        const amountPaidKobo = data.data.amount;
        const expectedAmountKobo = orderPayload.totalAmount * 100;

        if (amountPaidKobo < expectedAmountKobo) {
          console.error(`SECURITY_ALERT: Amount mismatch. Paid: ${amountPaidKobo}, Expected: ${expectedAmountKobo}`);
          return {
            success: false,
            message: 'Payment amount mismatch detected.',
          };
        }
        
        const customerEmail = data.data.customer?.email || 'N/A';
        const paymentReference = String(reference || '');
        const paymentStatus = String(data.data.status || 'success');
        const paymentProvider = 'paystack';
        const paidAt = data.data.paid_at || new Date().toISOString();

        // Record the order ONLY after successful payment verification
        const { products, totalAmount, shippingAddress, customerName, customerPhone } = orderPayload;
        const orderData: Omit<Order, 'id' | 'createdAt'> & {
          createdAt: string;
          paymentReference?: string;
          paymentStatus?: string;
          paymentProvider?: string;
          paidAt?: string;
        } = {
          products,
          totalAmount,
          shippingAddress,
          customerName,
          customerPhone,
          customerEmail,
          status: 'pending',
          createdAt: new Date().toISOString(),
          paymentReference,
          paymentStatus,
          paymentProvider,
          paidAt,
        };

        const supabase = getSupabaseServiceClient();
        let { data: insertedOrder, error: insertError } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id')
          .single();

        // Backward compatible fallback for older schemas without payment audit columns.
        if (
          insertError &&
          /(column .* does not exist|schema cache)/i.test(insertError.message || '')
        ) {
          const {
            paymentReference: _paymentReference,
            paymentStatus: _paymentStatus,
            paymentProvider: _paymentProvider,
            paidAt: _paidAt,
            ...legacyOrderData
          } = orderData;

          const retryResult = await supabase
            .from('orders')
            .insert(legacyOrderData)
            .select('id')
            .single();

          insertedOrder = retryResult.data;
          insertError = retryResult.error;
        }

        if (insertError || !insertedOrder?.id) {
          console.error('ORDER_INSERT_ERROR:', insertError?.message || 'Missing inserted order id');
          return {
            success: false,
            message: 'Payment verified but failed to record order.',
          };
        }

        const insertedOrderId = String(insertedOrder.id);

        console.log(`ORDER_SUCCESS: Created order ${insertedOrderId} for ${customerName}`);

        return {
          success: true,
          message: 'Payment verified and order recorded.',
          orderId: insertedOrderId,
        };
      } else {
        console.warn(`PAYMENT_FAILED: Paystack status: ${data?.data?.status}`);
        return {
          success: false,
          message: data?.message || 'Payment verification failed.',
        };
      }
    } catch (error: any) {
      console.error(
        'VERIFY_ERROR:',
        error.response?.data || error.message
      );
      return {
        success: false,
        message: 'Could not complete payment verification.',
      };
    }
  }
);
