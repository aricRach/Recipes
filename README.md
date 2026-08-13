# Recipes

Save, share, and rate recipes with Google sign-in. Angular (standalone components + signals) on the
front end, Firebase (Auth, Firestore, Storage) on the back end.

**First time here?** Follow [`SETUP.md`](./SETUP.md) to create and wire up a Firebase project — the
app won't get past the login screen without it.

## Stack

- Angular 20 — standalone components, signals, `@if`/`@for` control flow, functional router guards
- Angular Material — shared UI primitives (autocomplete, chips, dialogs, form fields, ratings)
- `@angular/fire` — Auth (Google popup sign-in), Firestore, Storage
- No NgRx: signal-based injectable services act as lightweight stores

## Architecture

```
src/app/
  core/            singletons: auth + data services, models — the only layer that talks to Firebase
    auth/            AuthService (Google sign-in, current user signal), authGuard
    data/            RecipeService, LabelService, RatingService, CommentService, StorageService
    models/          Recipe, Label, Comment, Rating, AppUser
  shared/          dumb, presentational components — inputs/outputs only, no service injection
    components/      recipe-card, label-autocomplete, star-rating, ingredient-checklist,
                      image-upload, search-bar, confirm-dialog, comment-item, comment-form
    pipes/           timeAgo
  layout/
    shell/           smart toolbar + router-outlet host (sign-in state, account menu)
  features/
    auth/login-page/                smart — Google sign-in button
    recipes/recipes-list-page/      smart — search + label filter + recipe grid
    recipes/recipe-detail-page/     smart — view mode, ingredient checklist, rating, comments
    recipes/recipe-form-page/       smart — create/edit form (shared between both routes)
```

**Smart vs. dumb**: only page-level components (`features/**/*-page`) and `layout/shell` inject
services or the router. Everything under `shared/components` is pure `input()`/`output()` — reusable
and framework-agnostic about where its data comes from.

## Firestore data model

```
users/{uid}
labels/{labelId}                        — {name, nameLower, createdBy, createdAt}
recipes/{recipeId}                      — title, ingredients[], instructions, imageUrl/imagePath,
                                           labelIds[]/labelNames[], owner info, avgRating,
                                           ratingCount, commentCount, timestamps
recipes/{recipeId}/ratings/{uid}        — one doc per user, doc id = uid
recipes/{recipeId}/comments/{commentId}
```

`avgRating`/`ratingCount`/`commentCount` are denormalized onto the recipe doc and kept in sync via a
Firestore transaction (ratings) / batched write (comments) — see `RatingService`/`CommentService` —
so list and detail views never need to fan out reads across subcollections.

Full rationale, plus the security rules and composite index this model relies on, are in
`firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## Notable behavior

- **Labels**: pick an existing one or type a new one in the label field on the recipe form — creating
  one adds it to the shared `labels` collection so it's immediately available to everyone.
- **Search**: the list page filters free text (title + ingredient names) client-side over whatever
  page of recipes is loaded; the label filter runs as a Firestore `array-contains` query.
- **Ingredient checklist**: clicking an ingredient while viewing a recipe line-throughs it. This is
  session-only (in-memory), not persisted — it resets on reload by design.
- **Rating/comments**: only shown as interactive for recipes you don't own; owners see the read-only
  average and existing comments.

## Scripts

```bash
npm start       # ng serve — http://localhost:4200
npm run build   # production build to dist/recipes/browser
npm test        # Karma/Jasmine unit tests
```
