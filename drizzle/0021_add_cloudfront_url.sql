-- Migration: Add CloudFront URL field to other_settings table
-- Date: 2024-12-19

ALTER TABLE "other_settings" ADD COLUMN "s3_cloudfront_url" text;