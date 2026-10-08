import { gql } from '@apollo/client';

export const ADMIN_STATS = gql`
  query AdminStats {
    adminStats { totalUsers totalOutlets totalOrders totalOrderValue }
  }
`;

export const ADMIN_USERS = gql`
  query AdminUsers {
    adminUsers { id name email role isActive outletId createdAt }
  }
`;

export const ADMIN_OUTLETS = gql`
  query AdminOutlets {
    adminOutlets { id name description location image isOpen isActive }
  }
`;

export const ADMIN_ORDERS = gql`
  query AdminOrders {
    adminOrders {
      id userName outletName totalAmount paymentMethod paymentStatus orderStatus createdAt updatedAt
      items { menuItemId name price quantity subtotal }
      outletId
    }
  }
`;

export const SYSTEM_ACTIVITY = gql`
  query SystemActivity {
    systemActivity { type message createdAt }
  }
`;

export const SET_USER_ACTIVE = gql`
  mutation SetUserActive($userId: ID!, $isActive: Boolean!) {
    setUserActive(userId: $userId, isActive: $isActive) { id isActive }
  }
`;

export const ASSIGN_OUTLET_STAFF = gql`
  mutation AssignOutletStaff($userId: ID!, $outletId: ID!) {
    assignOutletStaff(userId: $userId, outletId: $outletId) { id role outletId }
  }
`;

export const CREATE_OUTLET = gql`
  mutation CreateOutlet($input: CreateOutletInput!) {
    createOutlet(input: $input) { id name }
  }
`;

export const UPDATE_OUTLET = gql`
  mutation UpdateOutlet($input: UpdateOutletInput!) {
    updateOutlet(input: $input) { id name description location image isOpen isActive }
  }
`;
