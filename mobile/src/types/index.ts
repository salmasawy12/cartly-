export type AuthResponse = {
  token: string;
  userId: number;
  email: string;
  displayName: string;
};

export type GroceryList = {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
};

export type ListItem = {
  id: number;
  listId: number;
  name: string;
  category: string | null;
  checked: boolean;
  createdAt: string;
};

export type UserLookup = {
  id: number;
  email: string;
  displayName: string;
};

export type Invite = {
  listId: number;
  listName: string;
  ownerId: number;
  ownerName: string;
};

export type Member = {
  userId: number;
  displayName: string;
  owner: boolean;
};
