import { gql } from '@apollo/client';

const ORDER_FIELDS = `
  id userId userName outletId outletName totalAmount paymentMethod paymentStatus orderStatus createdAt updatedAt
  items { menuItemId name price quantity subtotal }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) { ${ORDER_FIELDS} }
  }
`;

export const MY_ORDERS = gql`
  query MyOrders { myOrders { ${ORDER_FIELDS} } }
`;

export const ORDER = gql`
  query Order($id: ID!) {
    order(id: $id) { ${ORDER_FIELDS} }
    orderPayment(orderId: $id) { transactionId paymentMethod paymentStatus amount }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) { ${ORDER_FIELDS} }
  }
`;

export const OUTLET_ORDERS = gql`
  query OutletOrders($statuses: [OrderStatus!]) {
    outletOrders(statuses: $statuses) { ${ORDER_FIELDS} }
  }
`;

export const OUTLET_STATS = gql`
  query OutletStats {
    outletStats { totalOrders pendingOrders preparingOrders readyOrders menuItems totalRevenue }
  }
`;
