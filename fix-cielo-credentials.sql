-- Fix Cielo Gateway Credentials
-- Replace UUID with correct numeric MerchantId

UPDATE gateway_configurations
SET 
  prod_client_id = '2894974080',
  prod_client_secret = 'dQnzCrHBsN8s4AIiaQMIqrWH2ofceG25MA9Mbdez',
  environment = 'production'
WHERE gateway_name = 'Cielo'
  AND id = '0a4cfd7b-f567-410b-876a-053f1319a73c';

-- Verify the update
SELECT 
  id,
  gateway_name,
  environment,
  prod_client_id,
  is_active
FROM gateway_configurations
WHERE gateway_name = 'Cielo';
