#!/bin/bash

# Define o ID do projeto e o arquivo de ambiente
PROJECT_ID="multidesk-portal"
ENV_FILE=".env.local"

# Verifica se o arquivo .env.local existe
if [ ! -f "$ENV_FILE" ]; then
  echo "Erro: Arquivo '$ENV_FILE' não encontrado."
  exit 1
fi

# Lê cada linha do arquivo .env.local
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Ignora linhas vazias ou comentários
  if [ -z "$key" ] || [[ "$key" =~ ^# ]]; then
    continue
  fi

  SECRET_NAME=$key
  SECRET_VALUE=$value

  echo "Processando secret: $SECRET_NAME..."

  # Verifica se o secret já existe
  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
    # Se existir, adiciona uma nova versão
    echo "Secret '$SECRET_NAME' já existe. Adicionando nova versão..."
    printf "%s" "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
    echo "Nova versão adicionada para o secret '$SECRET_NAME'."
  else
    # Se não existir, cria o secret com a primeira versão
    echo "Secret '$SECRET_NAME' não encontrado. Criando..."
    printf "%s" "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" --replication-policy="automatic" --data-file=- --project="$PROJECT_ID"
    echo "Secret '$SECRET_NAME' criado com sucesso."
  fi
  echo "---------------------"
done < "$ENV_FILE"

echo "Processo de sincronização de secrets concluído."
