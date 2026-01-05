#!/bin/bash

# Script de configuração automática do AWS SNS para monitoramento de emails
# Vinha Admin Center - Multidesk.io

set -e

echo "🚀 Configurando AWS SNS para monitoramento de emails..."

# Variáveis
REGION="us-east-1"
TOPIC_NAME="vinha-ses-notifications"
EMAIL_IDENTITY="${1:-contato@multidesk.io}"
WEBHOOK_URL="${2:-https://seu-dominio.com/api/v1/sns/webhook}"

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não encontrado. Instale: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar credenciais AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Credenciais AWS não configuradas. Execute: aws configure"
    exit 1
fi

echo "✅ AWS CLI configurado"

# 1. Criar tópico SNS
echo ""
echo "📡 Criando tópico SNS..."
TOPIC_ARN=$(aws sns create-topic \
    --name "$TOPIC_NAME" \
    --region "$REGION" \
    --output text \
    --query 'TopicArn' 2>/dev/null || \
    aws sns list-topics \
    --region "$REGION" \
    --output text \
    --query "Topics[?contains(@, '$TOPIC_NAME')].TopicArn | [0]")

echo "✅ Tópico SNS: $TOPIC_ARN"

# 2. Configurar notificações de Bounce no SES
echo ""
echo "📧 Configurando notificações de Bounce..."
aws ses set-identity-notification-topic \
    --identity "$EMAIL_IDENTITY" \
    --notification-type Bounce \
    --sns-topic "$TOPIC_ARN" \
    --region "$REGION"

echo "✅ Bounce notifications configuradas"

# 3. Configurar notificações de Complaint no SES
echo ""
echo "📧 Configurando notificações de Complaint..."
aws ses set-identity-notification-topic \
    --identity "$EMAIL_IDENTITY" \
    --notification-type Complaint \
    --sns-topic "$TOPIC_ARN" \
    --region "$REGION"

echo "✅ Complaint notifications configuradas"

# 4. Habilitar headers nas notificações (opcional)
echo ""
echo "📧 Habilitando headers nas notificações..."
aws ses set-identity-headers-in-notifications-enabled \
    --identity "$EMAIL_IDENTITY" \
    --notification-type Bounce \
    --enabled \
    --region "$REGION"

aws ses set-identity-headers-in-notifications-enabled \
    --identity "$EMAIL_IDENTITY" \
    --notification-type Complaint \
    --enabled \
    --region "$REGION"

echo "✅ Headers habilitados"

# 5. Criar subscription HTTPS
echo ""
echo "🔗 Criando subscription HTTPS..."
SUBSCRIPTION_ARN=$(aws sns subscribe \
    --topic-arn "$TOPIC_ARN" \
    --protocol https \
    --notification-endpoint "$WEBHOOK_URL" \
    --region "$REGION" \
    --output text \
    --query 'SubscriptionArn')

echo "✅ Subscription criada: $SUBSCRIPTION_ARN"

# 6. Resumo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuração concluída com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Informações:"
echo "   • Tópico SNS: $TOPIC_ARN"
echo "   • Email Identity: $EMAIL_IDENTITY"
echo "   • Webhook URL: $WEBHOOK_URL"
echo "   • Subscription: $SUBSCRIPTION_ARN"
echo ""
echo "⚠️  Próximos passos:"
echo "   1. Aguarde a confirmação da subscription no webhook"
echo "   2. Verifique se o endpoint está acessível publicamente"
echo "   3. Teste com: bounce@simulator.amazonses.com"
echo ""
echo "📚 Documentação: docs/SNS_MONITORING_SETUP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
