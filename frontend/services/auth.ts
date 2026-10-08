import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user { id name email role isActive outletId }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user { id name email role isActive outletId }
    }
  }
`;

export const ME = gql`
  query Me {
    me { id name email role isActive outletId createdAt }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { id name email role isActive outletId }
  }
`;
