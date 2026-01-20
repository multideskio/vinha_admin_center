'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary para capturar erros de validação de variáveis de ambiente
 *
 * Este componente captura erros que ocorrem durante a validação de env
 * e exibe uma mensagem clara ao usuário sobre o que está faltando.
 */
export class EnvErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error) {
    // Log do erro para o console (já foi logado pelo env.ts)
    console.error('Error Boundary capturou erro:', error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <html lang="pt-BR">
          <body>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem',
                backgroundColor: '#f8f9fa',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <div
                style={{
                  maxWidth: '600px',
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                  }}
                >
                  ⚠️
                </div>

                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: '#dc2626',
                    textAlign: 'center',
                  }}
                >
                  Erro de Configuração
                </h1>

                <p
                  style={{
                    marginBottom: '1.5rem',
                    color: '#374151',
                    lineHeight: '1.6',
                  }}
                >
                  O sistema não pôde iniciar devido a problemas na configuração de variáveis de
                  ambiente.
                </p>

                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#991b1b',
                      fontFamily: 'monospace',
                      margin: 0,
                    }}
                  >
                    {this.state.error?.message || 'Erro desconhecido'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    padding: '1rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#1e40af',
                      margin: 0,
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    💡 Como resolver:
                  </p>
                  <ol
                    style={{
                      fontSize: '0.875rem',
                      color: '#1e3a8a',
                      margin: 0,
                      paddingLeft: '1.5rem',
                      lineHeight: '1.6',
                    }}
                  >
                    <li>Verifique se o arquivo .env existe na raiz do projeto</li>
                    <li>Certifique-se de que todas as variáveis obrigatórias estão definidas</li>
                    <li>
                      Verifique o console do servidor para detalhes sobre quais variáveis estão
                      faltando
                    </li>
                    <li>Consulte o arquivo .env.example para referência</li>
                  </ol>
                </div>

                <div
                  style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  Após corrigir as variáveis de ambiente, reinicie o servidor.
                </div>
              </div>
            </div>
          </body>
        </html>
      )
    }

    return this.props.children
  }
}
