import { Timestamp } from '@angular/fire/firestore';

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  title: string;
  titleLower: string;
  ingredients: Ingredient[];
  instructions: string;
  imageUrl: string | null;
  imagePath: string | null;
  labelIds: string[];
  labelNames: string[];
  ownerId: string;
  ownerName: string;
  ownerPhotoURL: string | null;
  avgRating: number;
  ratingCount: number;
  commentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewRecipeInput {
  title: string;
  ingredients: Ingredient[];
  instructions: string;
  imageUrl: string | null;
  imagePath: string | null;
  labelIds: string[];
  labelNames: string[];
}
