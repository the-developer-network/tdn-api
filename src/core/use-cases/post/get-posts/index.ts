/**
 * Post retrieval module exports.
 *
 * This module provides functionality for retrieving posts with
 * pagination and filtering support.
 */

/**
 * Use case for retrieving posts.
 * Handles fetching posts with pagination support and type filtering.
 */
export * from "./get-posts.usecase";

/**
 * Input interface for retrieving posts.
 * Defines the optional parameters for fetching posts with pagination and filtering.
 */
export * from "./get-posts-usecase.input";

/**
 * Output interface for post retrieval.
 * Defines the structure of the data returned when fetching posts.
 */
export * from "./get-posts-usecase.output";
