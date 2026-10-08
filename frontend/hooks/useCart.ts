'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, isCustomer } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { ADD_TO_CART, CART, CLEAR_CART, REMOVE_FROM_CART, UPDATE_CART_ITEM } from '@/services/cart';
import { Cart } from '@/types';

// Everything the UI needs for the cart, in one hook.
export function useCart() {
  const { user } = useAuth();
  const toast = useToast();
  const enabled = isCustomer(user?.role);

  const { data, loading, error } = useQuery<{ cart: Cart }>(CART, { skip: !enabled });
  const [addMutation, { loading: adding }] = useMutation(ADD_TO_CART);
  const [updateMutation, { loading: updating }] = useMutation(UPDATE_CART_ITEM);
  const [removeMutation] = useMutation(REMOVE_FROM_CART);
  const [clearMutation] = useMutation(CLEAR_CART);

  const cart = data?.cart;
  const itemCount = cart ? cart.items.reduce((n, i) => n + i.quantity, 0) : 0;

  // Each action shows a toast so the user always gets feedback.
  async function addItem(menuItemId: string, name?: string) {
    try {
      await addMutation({ variables: { input: { menuItemId, quantity: 1 } } });
      toast('success', name ? `${name} added to cart` : 'Added to cart');
      return true;
    } catch (e) {
      toast('error', getErrorMessage(e));
      return false;
    }
  }

  async function setQuantity(menuItemId: string, quantity: number) {
    try {
      await updateMutation({ variables: { input: { menuItemId, quantity } } });
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  async function removeItem(menuItemId: string) {
    try {
      await removeMutation({ variables: { menuItemId } });
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  async function clear() {
    try {
      await clearMutation();
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  return { cart, itemCount, loading, error, adding, updating, addItem, setQuantity, removeItem, clear };
}
