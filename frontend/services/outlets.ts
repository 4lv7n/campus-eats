import { gql } from '@apollo/client';

const OUTLET_FIELDS = `id name description location image isOpen isActive`;

export const OUTLETS = gql`
  query Outlets($search: String) {
    outlets(search: $search) { ${OUTLET_FIELDS} }
  }
`;

export const OUTLET = gql`
  query Outlet($id: ID!) {
    outlet(id: $id) { ${OUTLET_FIELDS} }
  }
`;

export const MENU_ITEMS = gql`
  query MenuItems(
    $outletId: ID
    $search: String
    $category: String
    $minPrice: Float
    $maxPrice: Float
    $availableOnly: Boolean
  ) {
    menuItems(
      outletId: $outletId
      search: $search
      category: $category
      minPrice: $minPrice
      maxPrice: $maxPrice
      availableOnly: $availableOnly
    ) {
      id outletId outletName name description price image category available
    }
  }
`;

// ---- outlet staff / admin ----
export const CREATE_MENU_ITEM = gql`
  mutation CreateMenuItem($input: CreateMenuItemInput!) {
    createMenuItem(input: $input) { id name price category available }
  }
`;

export const UPDATE_MENU_ITEM = gql`
  mutation UpdateMenuItem($input: UpdateMenuItemInput!) {
    updateMenuItem(input: $input) { id name description price category available image }
  }
`;

export const DELETE_MENU_ITEM = gql`
  mutation DeleteMenuItem($id: ID!) {
    deleteMenuItem(id: $id)
  }
`;

export const SET_MY_OUTLET_OPEN = gql`
  mutation SetMyOutletOpen($isOpen: Boolean!) {
    setMyOutletOpen(isOpen: $isOpen) { id isOpen }
  }
`;
