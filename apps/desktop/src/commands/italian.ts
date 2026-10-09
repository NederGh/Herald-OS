import type { HermesAppId, PageId } from '../shell/apps.ts'
import type { CommandPhrase, OsCommand } from '../store/os-commands.ts'

/*
 * Italiano — the Italian layer for the voice fast path.
 *
 * Neder speaks Italian; the shipped catalogue speaks English. Rather than translate inside every
 * command file, this one file carries the Italian pieces and hands them to the registry:
 *
 *  - ITALIAN_PHRASES appends Italian phrases to commands by id (applied in commands/index.ts).
 *  - ITALIAN_PAGE_ALIASES / ITALIAN_APP_ALIASES teach the name resolver the Italian names
 *    ("impostazioni", "terminale", "dox"), consumed by navigation.ts.
 *
 * Kept deliberately in one place so it can be audited, grown, lifted out or replaced by a proper
 * multilingual-phrases design later. This is a personal layer: never upstreamed as-is.
 */

/** Italian names for Hermes pages. */
export const ITALIAN_PAGE_ALIASES: Record<string, PageId> = {
  panoramica: 'overview',
  oggi: 'overview',
  conversazione: 'hermes',
  conversazioni: 'hermes',
  missioni: 'missions',
  memoria: 'memory',
  ricordi: 'memory',
  cartelle: 'files',
  documenti: 'files',
  automazioni: 'automations',
  connessioni: 'connections',
  integrazioni: 'connections',
  impostazioni: 'settings',
  preferenze: 'settings'
}

/** Italian names for Hermes apps. */
export const ITALIAN_APP_ALIASES: Record<string, HermesAppId> = {
  terminale: 'terminal',
  sistema: 'system',
  telecamera: 'camera',
  fotocamera: 'camera',
  dox: 'docs',
  fogli: 'sheets',
  presentazioni: 'slides'
}

/** Italian phrases, added to the matching command by id. */
export const ITALIAN_PHRASES: Record<string, readonly CommandPhrase[]> = {
  // Opening things
  'open.any': ['apri {name}', 'mostrami {name}', 'fammi vedere {name}', 'vai su {name}', 'vai a {name}'],
  'page.open': ['apri la pagina {name}', 'vai alla pagina {name}'],
  'page.current': ['dove sono', 'che pagina è questa', 'quale pagina è aperta'],
  'page.back': ['indietro', 'torna indietro', 'pagina precedente'],
  'page.showHermes': ['apri la chat', 'vai in chat'],

  // Overlays and the shell around the page
  'overlay.commandBar': ['apri la barra dei comandi', 'barra dei comandi'],
  'overlay.applications': ['apri le applicazioni', 'mostra le applicazioni', 'apri le app', 'mostra le app'],
  'overlay.notifications': [
    { phrase: 'mostra le notifiche', args: { open: true } },
    { phrase: 'apri le notifiche', args: { open: true } },
    { phrase: 'nascondi le notifiche', args: { open: false } },
    { phrase: 'chiudi le notifiche', args: { open: false } }
  ],
  'notifications.clear': ['cancella le notifiche', 'elimina le notifiche', 'pulisci le notifiche'],
  'sidebar.toggle': [
    { phrase: 'nascondi la barra laterale', args: { collapsed: true } },
    { phrase: 'chiudi la barra laterale', args: { collapsed: true } },
    { phrase: 'mostra la barra laterale', args: { collapsed: false } },
    { phrase: 'apri la barra laterale', args: { collapsed: false } }
  ],
  'space.switch': ['vai allo spazio {name}', 'passa allo spazio {name}', 'apri lo spazio {name}'],

  // Windows
  'window.fullscreen': ['schermo intero', 'attiva lo schermo intero', 'esci dallo schermo intero'],
  'window.focus': ['porta {name} davanti', 'metti {name} davanti'],
  'window.close': ['chiudi', 'chiudi questa', 'chiudi questa finestra', 'chiudi la finestra', 'chiudi {name}', 'chiudi la finestra {name}'],
  'window.minimize': ['minimizza', 'minimizza questa finestra', 'minimizza la finestra', 'minimizza {name}'],
  'window.maximize': ['massimizza', 'massimizza questa finestra', 'massimizza la finestra', 'massimizza {name}', 'ingrandisci la finestra', 'ingrandisci {name}'],
  'window.restore': ['ripristina', 'ripristina la finestra', 'ripristina {name}', 'torna normale'],
  'window.list': ['quali finestre sono aperte'],
  'help.commands': ['cosa posso dire', 'quali comandi ci sono', 'mostra i comandi'],

  // Memory
  'memory.show': ['mostra la memoria', 'cosa ti ricordi di {query}', 'cerca nella memoria {query}'],
  'memory.add': ['ricorda che {text}', 'ricorda {text}', 'salva in memoria {text}', 'aggiungi alla memoria {text}'],
  'memory.forget': ['dimentica {match}', 'dimentica che {match}', 'cancella il ricordo di {match}', 'rimuovi {match} dalla memoria'],

  // Chat and missions
  'chat.new': ['nuova chat', 'nuova conversazione', 'inizia una nuova chat', 'nuova sessione'],
  'chat.open': ['apri la conversazione su {title}', 'apri la sessione {title}', 'apri la chat su {title}'],
  'chat.stop': ['ferma', 'fermati', 'interrompi', 'annulla', 'stop'],
  'mission.start': ['avvia una missione per {goal}', 'nuova missione {goal}', 'crea una missione per {goal}'],
  'mission.compose': ['nuova missione', 'avvia una missione', 'crea una missione'],
  'mission.open': ['apri la missione {name}', 'mostra la missione {name}'],
  'mission.list': ['elenca le missioni', 'mostra le missioni', 'quali missioni stanno andando', 'come vanno le missioni'],
  'mission.pause': ['metti in pausa la missione {name}', 'ferma la missione {name}'],
  'mission.markReviewed': ['segna la missione {name} come revisionata', 'ho revisionato la missione {name}'],
  'agents.pauseAll': ['ferma tutto', 'metti in pausa tutto', 'ferma tutti gli agenti'],

  // Voice itself
  'voice.engine.set': [
    { phrase: 'usa la voce gratuita', args: { engine: 'chained' } },
    { phrase: 'passa alla voce gratuita', args: { engine: 'chained' } },
    { phrase: 'usa la voce live', args: { engine: 'live' } },
    { phrase: 'passa alla voce live', args: { engine: 'live' } }
  ],
  'voice.wake.set': [
    { phrase: 'attiva la parola di risveglio', args: { enabled: true } },
    { phrase: 'accendi la parola di risveglio', args: { enabled: true } },
    { phrase: 'disattiva la parola di risveglio', args: { enabled: false } },
    { phrase: 'spegni la parola di risveglio', args: { enabled: false } }
  ],
  'voice.start': ['inizia ad ascoltare', 'parlami'],
  'voice.stop': ['basta ascoltare', 'chiudi la conversazione', 'arrivederci'],
  'voice.mute': ['muto', 'metti in muto', 'togli il muto'],
  'voice.quiet': ['silenzio', 'smetti di parlare', 'basta parlare']
}

/** Return the groups with the Italian phrases appended to their commands. */
export function withItalianPhrases(groups: Record<string, readonly OsCommand[]>): Record<string, readonly OsCommand[]> {
  return Object.fromEntries(
    Object.entries(groups).map(([group, commands]) => [
      group,
      commands.map(command => {
        const extra = ITALIAN_PHRASES[command.id]

        return extra?.length ? { ...command, phrases: [...(command.phrases ?? []), ...extra] } : command
      })
    ])
  )
}
