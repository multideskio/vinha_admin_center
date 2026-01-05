#!/usr/bin/env tsx
/**
 * Script de extração automatizada de dados do sistema legado
 *
 * Este script usa Playwright para fazer login no sistema antigo e extrair
 * todos os dados de forma automatizada, incluindo paginação.
 */

import { chromium, Browser, Page } from 'playwright'
import { writeFileSync } from 'fs'
import { join } from 'path'

interface LegacyUser {
  id: string
  nome: string
  regiao: string
  gerente: string
  supervisor: string
  tipo: string
}

interface LegacyRegion {
  id: string
  nome: string
}

interface LegacyManager {
  id: string
  nome: string
  sobrenome: string
  cpf: string
  email: string
}

interface LegacySupervisor {
  id: string
  nome: string
  sobrenome: string
  gerente: string
  regiao: string
  cpf: string
  email: string
}

interface ExtractedData {
  regioes: LegacyRegion[]
  gerentes: LegacyManager[]
  supervisores: LegacySupervisor[]
  usuarios: LegacyUser[]
  extractedAt: string
  totalRecords: {
    regioes: number
    gerentes: number
    supervisores: number
    usuarios: number
  }
}

const LEGACY_SYSTEM = {
  baseUrl: 'https://boleto.vinhaministerios.com.br',
  credentials: {
    email: 'kayury.rodrigues@gmail.com',
    password: '123456',
  },
}

class LegacyDataExtractor {
  private browser: Browser | null = null
  private page: Page | null = null
  private data: ExtractedData

  constructor() {
    this.data = {
      regioes: [],
      gerentes: [],
      supervisores: [],
      usuarios: [],
      extractedAt: new Date().toISOString(),
      totalRecords: {
        regioes: 0,
        gerentes: 0,
        supervisores: 0,
        usuarios: 0,
      },
    }
  }

  async init() {
    console.log('🚀 Iniciando extração de dados legados...')
    this.browser = await chromium.launch({ headless: false })
    this.page = await this.browser.newPage()
  }

  async login() {
    console.log('🔐 Fazendo login no sistema legado...')

    if (!this.page) throw new Error('Page não inicializada')

    await this.page.goto(`${LEGACY_SYSTEM.baseUrl}/sistema/gerente/index`)

    // Aguardar o formulário de login aparecer
    await this.page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 })

    // Preencher credenciais (ajustar seletores conforme necessário)
    const emailInput = await this.page.$('input[type="text"], input[type="email"]')
    const passwordInput = await this.page.$('input[type="password"]')

    if (emailInput && passwordInput) {
      await emailInput.fill(LEGACY_SYSTEM.credentials.email)
      await passwordInput.fill(LEGACY_SYSTEM.credentials.password)
    } else {
      throw new Error('Campos de login não encontrados')
    }

    // Fazer login
    const submitButton = await this.page.$('button[type="submit"], input[type="submit"]')
    if (submitButton) {
      await submitButton.click()
    } else {
      throw new Error('Botão de submit não encontrado')
    }

    // Aguardar redirecionamento
    await this.page.waitForURL('**/sistema/index/index', { timeout: 10000 })

    console.log('✅ Login realizado com sucesso')
  }

  async extractRegions() {
    console.log('🌍 Extraindo regiões...')

    if (!this.page) throw new Error('Page não inicializada')

    await this.page.goto(`${LEGACY_SYSTEM.baseUrl}/sistema/regiao/index`)
    await this.page.waitForSelector('tbody tr', { timeout: 10000 })

    const regions = await this.page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr')
      const regioes: Array<{ id: string; nome: string }> = []

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length > 1) {
          regioes.push({
            id: cells[1]?.textContent?.trim() || '',
            nome: cells[2]?.textContent?.trim() || '',
          })
        }
      })

      return regioes
    })

    this.data.regioes = regions
    this.data.totalRecords.regioes = regions.length
    console.log(`✅ ${regions.length} regiões extraídas`)
  }

  async extractManagers() {
    console.log('👔 Extraindo gerentes...')

    if (!this.page) throw new Error('Page não inicializada')

    await this.page.goto(`${LEGACY_SYSTEM.baseUrl}/sistema/gerente/index`)
    await this.page.waitForSelector('tbody tr', { timeout: 10000 })

    // Extrair dados da primeira página
    let allManagers: LegacyManager[] = []
    let hasNextPage = true
    let currentPage = 1
    let consecutiveEmptyPages = 0
    let lastPageData = ''
    const maxPages = 4 // Limite conhecido pelo usuário

    while (hasNextPage && consecutiveEmptyPages < 2 && currentPage <= maxPages) {
      console.log(`📄 Extraindo página ${currentPage} de gerentes...`)

      try {
        // Aguardar carregamento da página
        await this.page.waitForSelector('tbody tr', { timeout: 5000 })

        const managers = await this.page.evaluate(() => {
          const rows = document.querySelectorAll('tbody tr')
          const gerentes: Array<{ id: string; nome: string; sobrenome: string; cpf: string; email: string }> = []

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length > 1) {
              const id = cells[1]?.textContent?.trim() || ''
              const nome = cells[2]?.textContent?.trim() || ''
              const sobrenome = cells[3]?.textContent?.trim() || ''
              const cpf = cells[4]?.textContent?.trim() || ''
              const email = cells[5]?.textContent?.trim() || ''

              // Só adicionar se tiver dados válidos
              if (id && nome && email) {
                gerentes.push({ id, nome, sobrenome, cpf, email })
              }
            }
          })

          return gerentes
        })

        // Verificar se os dados são iguais à página anterior (indicativo de que não mudou)
        const currentPageData = JSON.stringify(managers)
        if (currentPageData === lastPageData && currentPage > 1) {
          console.log(`⚠️  Página ${currentPage} tem os mesmos dados da anterior - parando`)
          break
        }
        lastPageData = currentPageData

        if (managers.length === 0) {
          consecutiveEmptyPages++
          console.log(`⚠️  Página ${currentPage} vazia (${consecutiveEmptyPages}/2)`)
        } else {
          consecutiveEmptyPages = 0
          allManagers = [...allManagers, ...managers]
          console.log(
            `   📊 ${managers.length} gerentes extraídos desta página (total: ${allManagers.length})`,
          )
        }

        // Verificar paginação de forma mais robusta
        const paginationInfo = await this.page.evaluate(() => {
          // Procurar informações de paginação
          const paginationText = document.querySelector('.dataTables_info')?.textContent || ''

          // Múltiplas formas de encontrar o botão próximo
          let nextButton = document.querySelector('a[data-dt-idx]:last-child') // Último botão numérico
          if (!nextButton) {
            nextButton = document.querySelector('.paginate_button.next')
          }
          if (!nextButton) {
            nextButton = document.querySelector(
              'a:contains("Próximo"), a:contains("Next"), a:contains(">")',
            )
          }

          const isNextEnabled =
            nextButton &&
            !nextButton.classList.contains('disabled') &&
            !nextButton.classList.contains('paginate_button_disabled') &&
            nextButton.getAttribute('href') !== '#'

          // Verificar se estamos na última página através do texto de paginação
          const match = paginationText.match(/Mostrando de \d+ até (\d+) de (\d+) registros/)
          let isLastPage = false

          if (match && match[1] && match[2]) {
            const currentEnd = parseInt(match[1])
            const total = parseInt(match[2])
            isLastPage = currentEnd >= total
          }

          // Verificar se o botão atual está marcado como última página
          const currentPageButton = document.querySelector('.paginate_button.current')
          const allPageButtons = document.querySelectorAll(
            '.paginate_button:not(.previous):not(.next)',
          )
          const isLastPageButton =
            currentPageButton &&
            Array.from(allPageButtons).indexOf(currentPageButton) === allPageButtons.length - 1

          return {
            paginationText,
            isNextEnabled: !!isNextEnabled,
            isLastPage: isLastPage || isLastPageButton,
            currentPageNumber: currentPageButton?.textContent?.trim() || '',
            totalPages: allPageButtons.length,
          }
        })

        console.log(
          `   📄 Paginação: ${paginationInfo.paginationText} | Página atual: ${paginationInfo.currentPageNumber}`,
        )

        // Parar se chegamos na última página ou não há botão próximo habilitado
        if (paginationInfo.isLastPage || !paginationInfo.isNextEnabled || currentPage >= maxPages) {
          console.log(`📄 Última página detectada (página ${currentPage}/${maxPages})`)
          hasNextPage = false
        } else {
          // Tentar clicar no próximo com múltiplas estratégias
          let nextClicked = false

          // Estratégia 1: Botão próximo padrão
          let nextButton = await this.page.$('.paginate_button.next:not(.disabled)')
          if (nextButton) {
            await nextButton.click()
            nextClicked = true
          } else {
            // Estratégia 2: Último botão numérico
            nextButton = await this.page.$('a[data-dt-idx]:last-child')
            if (nextButton) {
              const nextPageNum = await nextButton.textContent()
              if (nextPageNum && parseInt(nextPageNum) > currentPage) {
                await nextButton.click()
                nextClicked = true
              }
            }
          }

          if (nextClicked) {
            await this.page.waitForTimeout(3000) // Aguardar carregamento
            currentPage++
          } else {
            console.log(`⚠️  Não foi possível encontrar botão próximo válido`)
            hasNextPage = false
          }
        }
      } catch (error) {
        console.error(`❌ Erro na página ${currentPage}:`, error)
        hasNextPage = false
      }
    }

    this.data.gerentes = allManagers
    this.data.totalRecords.gerentes = allManagers.length
    console.log(`✅ ${allManagers.length} gerentes extraídos`)
  }

  async extractSupervisors() {
    console.log('👨‍💼 Extraindo supervisores...')

    if (!this.page) throw new Error('Page não inicializada')

    await this.page.goto(`${LEGACY_SYSTEM.baseUrl}/sistema/supervisor/index`)
    await this.page.waitForSelector('tbody tr', { timeout: 10000 })

    let allSupervisors: LegacySupervisor[] = []
    let hasNextPage = true
    let currentPage = 1
    let consecutiveEmptyPages = 0
    let lastPageData = ''
    const maxPages = 10 // Limite razoável para supervisores

    while (hasNextPage && consecutiveEmptyPages < 2 && currentPage <= maxPages) {
      console.log(`📄 Extraindo página ${currentPage} de supervisores...`)

      try {
        await this.page.waitForSelector('tbody tr', { timeout: 5000 })

        const supervisors = await this.page.evaluate(() => {
          const rows = document.querySelectorAll('tbody tr')
          const supervisores: Array<{ id: string; nome: string; sobrenome: string; cpf: string; email: string; regiao: string }> = []

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length > 1) {
              const id = cells[1]?.textContent?.trim() || ''
              const nome = cells[2]?.textContent?.trim() || ''
              const sobrenome = cells[3]?.textContent?.trim() || ''
              const gerente = cells[4]?.textContent?.trim() || ''
              const regiao = cells[5]?.textContent?.trim() || ''
              const cpf = cells[6]?.textContent?.trim() || ''
              const email = cells[7]?.textContent?.trim() || ''

              // Só adicionar se tiver dados válidos
              if (id && nome && email) {
                supervisores.push({ id, nome, sobrenome, gerente, regiao, cpf, email })
              }
            }
          })

          return supervisores
        })

        // Verificar se os dados são iguais à página anterior
        const currentPageData = JSON.stringify(supervisors)
        if (currentPageData === lastPageData && currentPage > 1) {
          console.log(`⚠️  Página ${currentPage} tem os mesmos dados da anterior - parando`)
          break
        }
        lastPageData = currentPageData

        if (supervisors.length === 0) {
          consecutiveEmptyPages++
          console.log(`⚠️  Página ${currentPage} vazia (${consecutiveEmptyPages}/2)`)
        } else {
          consecutiveEmptyPages = 0
          allSupervisors = [...allSupervisors, ...supervisors]
          console.log(
            `   📊 ${supervisors.length} supervisores extraídos desta página (total: ${allSupervisors.length})`,
          )
        }

        // Verificar paginação
        const paginationInfo = await this.page.evaluate(() => {
          const paginationText = document.querySelector('.dataTables_info')?.textContent || ''

          let nextButton = document.querySelector('.paginate_button.next:not(.disabled)')
          if (!nextButton) {
            nextButton = document.querySelector('a[data-dt-idx]:last-child')
          }

          const isNextEnabled =
            nextButton &&
            !nextButton.classList.contains('disabled') &&
            !nextButton.classList.contains('paginate_button_disabled') &&
            nextButton.getAttribute('href') !== '#'

          const match = paginationText.match(/Mostrando de \d+ até (\d+) de (\d+) registros/)
          let isLastPage = false

          if (match && match[1] && match[2]) {
            const currentEnd = parseInt(match[1])
            const total = parseInt(match[2])
            isLastPage = currentEnd >= total
          }

          const currentPageButton = document.querySelector('.paginate_button.current')
          const allPageButtons = document.querySelectorAll(
            '.paginate_button:not(.previous):not(.next)',
          )
          const isLastPageButton =
            currentPageButton &&
            Array.from(allPageButtons).indexOf(currentPageButton) === allPageButtons.length - 1

          return {
            paginationText,
            isNextEnabled: !!isNextEnabled,
            isLastPage: isLastPage || isLastPageButton,
            currentPageNumber: currentPageButton?.textContent?.trim() || '',
          }
        })

        console.log(
          `   📄 Paginação: ${paginationInfo.paginationText} | Página atual: ${paginationInfo.currentPageNumber}`,
        )

        if (paginationInfo.isLastPage || !paginationInfo.isNextEnabled) {
          console.log(`📄 Última página detectada (página ${currentPage})`)
          hasNextPage = false
        } else {
          let nextClicked = false

          const nextButton = await this.page.$('.paginate_button.next:not(.disabled)')
          if (nextButton) {
            await nextButton.click()
            nextClicked = true
          } else {
            const lastPageButton = await this.page.$('a[data-dt-idx]:last-child')
            if (lastPageButton) {
              const nextPageNum = await lastPageButton.textContent()
              if (nextPageNum && parseInt(nextPageNum) > currentPage) {
                await lastPageButton.click()
                nextClicked = true
              }
            }
          }

          if (nextClicked) {
            await this.page.waitForTimeout(3000)
            currentPage++
          } else {
            hasNextPage = false
          }
        }
      } catch (error) {
        console.error(`❌ Erro na página ${currentPage}:`, error)
        hasNextPage = false
      }
    }

    this.data.supervisores = allSupervisors
    this.data.totalRecords.supervisores = allSupervisors.length
    console.log(`✅ ${allSupervisors.length} supervisores extraídos`)
  }

  async extractUsers() {
    console.log('👥 Extraindo usuários (pastores e igrejas)...')

    if (!this.page) throw new Error('Page não inicializada')

    await this.page.goto(`${LEGACY_SYSTEM.baseUrl}/sistema/usuario/index`)
    await this.page.waitForSelector('tbody tr', { timeout: 10000 })

    // Configurar para mostrar 100 resultados por página
    try {
      await this.page.selectOption('select[name="example_length"]', '100')
      await this.page.waitForTimeout(1000)
    } catch (error) {
      console.log('⚠️  Não foi possível configurar 100 resultados por página, continuando...')
    }

    let allUsers: LegacyUser[] = []
    let hasNextPage = true
    let currentPage = 1
    let consecutiveEmptyPages = 0
    let lastPageData = ''
    const maxPages = 50 // Limite razoável para usuários (1.101 registros)

    while (hasNextPage && consecutiveEmptyPages < 2 && currentPage <= maxPages) {
      console.log(`📄 Extraindo página ${currentPage} de usuários...`)

      try {
        await this.page.waitForSelector('tbody tr', { timeout: 5000 })

        const users = await this.page.evaluate(() => {
          const rows = document.querySelectorAll('tbody tr')
          const usuarios: Array<{ id: string; nome: string; regiao: string; gerente: string; supervisor: string; tipo: string }> = []

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length > 1) {
              const id = cells[1]?.textContent?.trim() || ''
              const nome = cells[2]?.textContent?.trim() || ''
              const regiao = cells[3]?.textContent?.trim() || ''
              const gerente = cells[4]?.textContent?.trim() || ''
              const supervisor = cells[5]?.textContent?.trim() || ''
              const tipo = cells[6]?.textContent?.trim() || ''

              // Só adicionar se tiver dados válidos
              if (id && nome) {
                usuarios.push({ id, nome, regiao, gerente, supervisor, tipo })
              }
            }
          })

          return usuarios
        })

        // Verificar se os dados são iguais à página anterior
        const currentPageData = JSON.stringify(users)
        if (currentPageData === lastPageData && currentPage > 1) {
          console.log(`⚠️  Página ${currentPage} tem os mesmos dados da anterior - parando`)
          break
        }
        lastPageData = currentPageData

        if (users.length === 0) {
          consecutiveEmptyPages++
          console.log(`⚠️  Página ${currentPage} vazia (${consecutiveEmptyPages}/2)`)
        } else {
          consecutiveEmptyPages = 0
          allUsers = [...allUsers, ...users]
          console.log(
            `   📊 ${users.length} usuários extraídos desta página (total: ${allUsers.length})`,
          )
        }

        // Verificar paginação
        const paginationInfo = await this.page.evaluate(() => {
          const paginationText = document.querySelector('.dataTables_info')?.textContent || ''

          let nextButton = document.querySelector('.paginate_button.next:not(.disabled)')
          if (!nextButton) {
            nextButton = document.querySelector('a[data-dt-idx]:last-child')
          }

          const isNextEnabled =
            nextButton &&
            !nextButton.classList.contains('disabled') &&
            !nextButton.classList.contains('paginate_button_disabled') &&
            nextButton.getAttribute('href') !== '#'

          const match = paginationText.match(/Mostrando de \d+ até (\d+) de (\d+) registros/)
          let isLastPage = false

          if (match && match[1] && match[2]) {
            const currentEnd = parseInt(match[1])
            const total = parseInt(match[2])
            isLastPage = currentEnd >= total
          }

          const currentPageButton = document.querySelector('.paginate_button.current')
          const allPageButtons = document.querySelectorAll(
            '.paginate_button:not(.previous):not(.next)',
          )
          const isLastPageButton =
            currentPageButton &&
            Array.from(allPageButtons).indexOf(currentPageButton) === allPageButtons.length - 1

          return {
            paginationText,
            isNextEnabled: !!isNextEnabled,
            isLastPage: isLastPage || isLastPageButton,
            currentPageNumber: currentPageButton?.textContent?.trim() || '',
            totalFromText: match && match[2] ? parseInt(match[2]) : 0,
          }
        })

        console.log(
          `   📄 Paginação: ${paginationInfo.paginationText} | Página atual: ${paginationInfo.currentPageNumber}`,
        )

        if (paginationInfo.isLastPage || !paginationInfo.isNextEnabled) {
          console.log(`📄 Última página detectada (página ${currentPage})`)
          hasNextPage = false
        } else {
          let nextClicked = false

          const nextButton = await this.page.$('.paginate_button.next:not(.disabled)')
          if (nextButton) {
            await nextButton.click()
            nextClicked = true
          } else {
            const lastPageButton = await this.page.$('a[data-dt-idx]:last-child')
            if (lastPageButton) {
              const nextPageNum = await lastPageButton.textContent()
              if (nextPageNum && parseInt(nextPageNum) > currentPage) {
                await lastPageButton.click()
                nextClicked = true
              }
            }
          }

          if (nextClicked) {
            await this.page.waitForTimeout(3000) // Aguardar carregamento (mais tempo para usuários)
            currentPage++
          } else {
            console.log(`⚠️  Não foi possível encontrar botão próximo válido`)
            hasNextPage = false
          }
        }
      } catch (error) {
        console.error(`❌ Erro na página ${currentPage}:`, error)
        hasNextPage = false
      }
    }

    this.data.usuarios = allUsers
    this.data.totalRecords.usuarios = allUsers.length
    console.log(`✅ ${allUsers.length} usuários extraídos`)
  }

  async saveData() {
    const outputPath = join(process.cwd(), 'scripts', 'legacy-data-export.json')
    writeFileSync(outputPath, JSON.stringify(this.data, null, 2))
    console.log(`💾 Dados salvos em: ${outputPath}`)
  }

  async savePartialData(section: string) {
    const outputPath = join(process.cwd(), 'scripts', `legacy-data-partial-${section}.json`)
    writeFileSync(outputPath, JSON.stringify(this.data, null, 2))
    console.log(`💾 Dados parciais salvos em: ${outputPath}`)
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async extract() {
    try {
      await this.init()
      await this.login()

      await this.extractRegions()
      await this.savePartialData('regions')

      await this.extractManagers()
      await this.savePartialData('managers')

      await this.extractSupervisors()
      await this.savePartialData('supervisors')

      await this.extractUsers()

      await this.saveData()

      console.log('\n📈 Resumo da extração:')
      console.log(`✅ ${this.data.totalRecords.regioes} regiões`)
      console.log(`✅ ${this.data.totalRecords.gerentes} gerentes`)
      console.log(`✅ ${this.data.totalRecords.supervisores} supervisores`)
      console.log(`✅ ${this.data.totalRecords.usuarios} usuários`)
      console.log('\n🎉 Extração concluída com sucesso!')
    } catch (error) {
      console.error('❌ Erro na extração:', error)

      // Salvar dados parciais mesmo em caso de erro
      try {
        await this.savePartialData('error')
        console.log('💾 Dados parciais salvos antes do erro')
      } catch (saveError) {
        console.error('❌ Erro ao salvar dados parciais:', saveError)
      }

      throw error
    } finally {
      await this.cleanup()
    }
  }
}

async function main() {
  const extractor = new LegacyDataExtractor()
  await extractor.extract()
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

export { LegacyDataExtractor }
