import { gql } from '@apollo/client';

const CART_FIELDS = `
  id outletId outletName total
  items { menuItemId name image price quantity }
`;

export const CART = gql`
  query Cart { cart { ${CART_FIELDS} } }
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) { ${CART_FIELDS} }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) { ${CART_FIELDS} }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($menuItemId: ID!) {
    removeFromCart(menuItemId: $menuItemId) { ${CART_FIELDS} }
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart { clearCart { ${CART_FIELDS} } }
`;
