/**
 * @fileoverview Engine para processar templates de mensagens
 */

export interface TemplateVariables {
  name?: string
  churchName?: string
  amount?: string
  dueDate?: string
  paymentLink?: string
  [key: string]: string | undefined
}

export const TemplateEngine = {
  processTemplate(template: string, variables: TemplateVariables): string {
    return processTemplate(template, variables)
  },

  validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    return validateTemplate(template)
  },
} as const

export function processTemplate(template: string, variables: TemplateVariables): string {
  let processed = template

  // Substituir variáveis simples {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processed = processed.replace(regex, value)
    }
  })

  // Processar condicionais simples {{#if variable}}...{{/if}}
  processed = processConditionals(processed, variables)

  return processed
}

function processConditionals(template: string, variables: TemplateVariables): string {
  const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g
  
  return template.replace(conditionalRegex, (match, variable, content) => {
    const value = variables[variable]
    return value ? content : ''
  })
}

export function validateTemplate(template: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Verificar se todas as tags estão fechadas
  const openTags = template.match(/{{#if\s+\w+}}/g) || []
  const closeTags = template.match(/{{\/if}}/g) || []
  
  if (openTags.length !== closeTags.length) {
    errors.push('Tags condicionais não estão balanceadas')
  }

  // Verificar variáveis válidas
  const variables = template.match(/{{(\w+)}}/g) || []
  const invalidVars = variables.filter(v => {
    const varName = v.replace(/[{}]/g, '')
    return !['name', 'churchName', 'amount', 'dueDate', 'paymentLink'].includes(varName)
  })

  if (invalidVars.length > 0) {
    errors.push(`Variáveis inválidas: ${invalidVars.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}