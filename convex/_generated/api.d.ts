/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_users from "../auth/users.js";
import type * as canvas_mutations from "../canvas/mutations.js";
import type * as canvas_queries from "../canvas/queries.js";
import type * as contentTools_mutations from "../contentTools/mutations.js";
import type * as http from "../http.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as sharedCanvas from "../sharedCanvas.js";
import type * as teamWorkflow_mutations from "../teamWorkflow/mutations.js";
import type * as teamWorkflow_queries from "../teamWorkflow/queries.js";
import type * as workspaces_mutations from "../workspaces/mutations.js";
import type * as workspaces_queries from "../workspaces/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/users": typeof auth_users;
  "canvas/mutations": typeof canvas_mutations;
  "canvas/queries": typeof canvas_queries;
  "contentTools/mutations": typeof contentTools_mutations;
  http: typeof http;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  sharedCanvas: typeof sharedCanvas;
  "teamWorkflow/mutations": typeof teamWorkflow_mutations;
  "teamWorkflow/queries": typeof teamWorkflow_queries;
  "workspaces/mutations": typeof workspaces_mutations;
  "workspaces/queries": typeof workspaces_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
