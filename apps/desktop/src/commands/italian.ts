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
  docks: 'docs',
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
  'chat.stop': ['ferma', 'fermati', 'interrompi', 'stop'],
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
  'voice.quiet': ['silenzio', 'smetti di parlare', 'basta parlare'],

  // Automations
  'automation.list': ['mostra le automazioni', 'elenca le automazioni', 'quali automazioni ho'],
  'automation.show': ['apri lautomazione {name}', 'mostra lautomazione {name}'],
  'automation.run': ['avvia lautomazione {name}', 'esegui lautomazione {name}', 'lancia lautomazione {name}'],
  'automation.pause': ['metti in pausa lautomazione {name}', 'disattiva lautomazione {name}'],
  'automation.resume': ['riattiva lautomazione {name}', 'riprendi lautomazione {name}'],
  'automation.delete': ['elimina lautomazione {name}', 'cancella lautomazione {name}'],

  // Canvas, capture, camera
  'canvas.open': ['apri herald canvas', 'apri il canvas', 'apri leditor di immagini'],
  'canvas.new': ['nuova tela', 'nuovo canvas', 'nuova immagine nella tela'],
  'canvas.undo': ['annulla nella tela', 'annulla nel canvas'],
  'capture.screenshot': [
    'fai uno screenshot',
    'cattura lo schermo',
    { phrase: 'screenshot dello schermo intero', args: { mode: 'screen' } },
    { phrase: 'screenshot di questa finestra', args: { mode: 'window' } }
  ],
  'capture.record': [
    { phrase: 'registra lo schermo', args: { action: 'start' } },
    { phrase: 'inizia a registrare lo schermo', args: { action: 'start' } },
    { phrase: 'ferma la registrazione', args: { action: 'stop' } }
  ],
  'capture.color': ['prendi un colore', 'che colore è questo', 'campiona un colore'],
  'capture.qr': ['leggi questo codice qr', 'scansiona il codice qr'],
  'capture.text': ['copia il testo sullo schermo', 'leggi il testo sullo schermo'],
  'camera.show': [
    { phrase: 'mostra la telecamera', args: { enabled: true } },
    { phrase: 'nascondi la telecamera', args: { enabled: false } }
  ],

  // Connections and continuity
  'connection.list': ['mostra le connessioni', 'elenca le connessioni', 'cosa è collegato'],
  'connection.show': ['apri la connessione {name}', 'mostra la connessione {name}'],
  'connection.enable': ['attiva la connessione {name}', 'collega {name}'],
  'connection.disable': ['disattiva la connessione {name}', 'scollega {name}'],
  'continuity.catchUp': ['cosa stavo facendo', 'dove ero rimasto', 'riprendi da dove ero'],
  'continuity.continue': ['continua da dove ero rimasto', 'continua {thread}', 'riapri {thread}'],
  'continuity.nextStep': ['fai il passo successivo', 'passo successivo di {thread}'],

  // Network, sound, screen, power
  'panel.open': [
    { phrase: 'mostra il wi-fi', args: { panel: 'wifi' } },
    { phrase: 'mostra il bluetooth', args: { panel: 'bluetooth' } },
    { phrase: 'mostra le impostazioni audio', args: { panel: 'audio' } },
    { phrase: 'mostra lo schermo', args: { panel: 'display' } },
    { phrase: 'mostra la batteria', args: { panel: 'power' } }
  ],
  'wifi.list': ['a che wi-fi sono collegato', 'elenca le reti wi-fi'],
  'wifi.connect': ['collegati al wi-fi {network}', 'connettiti al wi-fi {network}'],
  'wifi.power': [
    { phrase: 'accendi il wi-fi', args: { enabled: true } },
    { phrase: 'spegni il wi-fi', args: { enabled: false } }
  ],
  'bluetooth.list': ['quali dispositivi bluetooth sono collegati', 'elenca i dispositivi bluetooth'],
  'bluetooth.power': [
    { phrase: 'accendi il bluetooth', args: { enabled: true } },
    { phrase: 'spegni il bluetooth', args: { enabled: false } }
  ],
  'bluetooth.connect': [
    'collega il dispositivo {device}',
    { phrase: 'scollega il dispositivo {device}', args: { connected: false } }
  ],
  'audio.output': ['riproduci su {device}', 'manda laudio su {device}', 'usa {device} per il suono'],
  'audio.volume': [
    'imposta il volume a {percent}',
    'volume {percent}',
    { phrase: 'muta il suono', args: { muted: true } },
    { phrase: 'riattiva il suono', args: { muted: false } }
  ],
  'display.brightness': ['imposta la luminosità a {percent}', 'luminosità {percent}'],
  'display.scale': [
    'imposta la scala dello schermo a {scale}',
    { phrase: 'ingrandisci tutto', args: { scale: 1.25 } }
  ],
  'power.profile': [
    { phrase: 'risparmia energia', args: { profile: 'power-saver' } },
    { phrase: 'modalità prestazioni', args: { profile: 'performance' } },
    { phrase: 'modalità bilanciata', args: { profile: 'balanced' } }
  ],
  'power.status': ['quanta batteria è rimasta', 'stato della batteria', 'sto caricando'],

  // Crashes
  'crash.list': ['cosa è andato in crash', 'mostra i crash recenti', 'elenca i crash'],
  'crash.diagnose': [
    'perché {crash} è andato in crash',
    'diagnostica il crash di {crash}',
    { phrase: 'perché è andato in crash', args: {} }
  ],
  'crash.mute': [
    'smetti di avvisarmi quando va in crash {app}',
    { phrase: 'avvisami di nuovo quando va in crash {app}', args: { muted: false } }
  ],
  'crash.help': [
    { phrase: 'attiva laiuto sui crash', args: { enabled: true } },
    { phrase: 'disattiva laiuto sui crash', args: { enabled: false } }
  ],

  // Documents
  'docs.open': ['apri herald docs', 'apri il programma di scrittura'],
  'docs.new': ['nuovo documento', 'crea un documento', 'nuovo doc'],
  'docs.save': ['salva il documento'],
  'sheets.open': ['apri herald sheets', 'apri il programma di fogli'],
  'sheets.new': ['nuovo foglio', 'nuova cartella di lavoro', 'nuovo spreadsheet'],
  'sheets.save': ['salva il foglio'],
  'slides.open': ['apri herald slides', 'apri il programma di presentazioni'],
  'slides.new': ['nuova presentazione', 'nuove slide', 'nuovo mazzo di slide'],
  'slides.addSlide': ['nuova diapositiva', 'aggiungi una diapositiva', 'aggiungi una slide'],
  'slides.save': ['salva la presentazione'],

  // Typing and keys. 'scrivi {text}' stays out on purpose: "scrivi una poesia" is a request, not text to type.
  'text.type': ['digita {text}', 'detta {text}'],
  'key.press': [
    'premi {key}',
    'premi il tasto {key}',
    { phrase: 'premi invio', args: { key: 'enter' } },
    { phrase: 'invio', args: { key: 'enter' } }
  ],
  'text.newLine': ['nuova riga', 'vai a capo'],

  // Editing
  'edit.selectAll': ['seleziona tutto', 'seleziona tutto il testo'],
  'edit.select': [
    { phrase: 'seleziona la parola', args: { scope: 'word' } },
    { phrase: 'seleziona la parola precedente', args: { scope: 'word' } },
    { phrase: 'seleziona la riga', args: { scope: 'line' } }
  ],
  'edit.deselect': ['deseleziona', 'annulla la selezione'],
  'edit.copy': ['copia', 'copia questo'],
  'edit.cut': ['taglia', 'taglia questo'],
  'edit.paste': ['incolla', 'incolla qui'],
  'edit.undo': ['annulla', 'annulla la modifica'],
  'edit.redo': ['rifai', 'ripeti'],
  'edit.delete': [
    { phrase: 'cancella la selezione', args: { what: 'selection' } },
    { phrase: 'cancella quello', args: { what: 'selection' } },
    { phrase: 'cancella tutto', args: { what: 'all' } }
  ],
  'view.scroll': [
    { phrase: 'scorri giù', args: { direction: 'down' } },
    { phrase: 'scorri su', args: { direction: 'up' } },
    { phrase: 'vai giù', args: { direction: 'down' } },
    { phrase: 'vai su', args: { direction: 'up' } },
    { phrase: 'scorri in fondo', args: { direction: 'bottom' } },
    { phrase: 'torna in cima', args: { direction: 'top' } }
  ],

  // Files
  'file.open': ['apri il file {name}', 'mostra il file {name}'],
  'file.openExternal': ['apri fuori', 'apri in unaltra app', 'apri esternamente'],
  'files.open': ['apri la cartella {place}', 'mostra la cartella {place}'],
  'files.search': ['cerca i file {query}', 'trova i file {query}'],
  'files.reveal': ['mostra nel finder', 'mostra questo file nel finder'],
  'files.newFolder': ['crea una cartella {name}', 'nuova cartella {name}'],
  'chat.popout': ['stacca la chat', 'apri la chat in una finestra'],
  'agents.toolSearch.set': [
    { phrase: 'attiva la ricerca strumenti', args: { enabled: true } },
    { phrase: 'disattiva la ricerca strumenti', args: { enabled: false } }
  ],

  // Menu bar, widgets, screen, usage
  'bar.show': ['mostra {item} nella barra dei menu'],
  'bar.hide': ['nascondi {item} dalla barra dei menu'],
  'bar.clock': [
    { phrase: 'orologio a 24 ore', args: { hours: '24' } },
    { phrase: 'orologio a 12 ore', args: { hours: '12' } },
    { phrase: 'mostra i secondi nellorologio', args: { seconds: true } }
  ],
  'plugin.manage': ['gestisci i plugin', 'mostra i widget'],
  'screen.askRegion': ['chiedi di questa parte dello schermo', 'cosa è questo sullo schermo'],
  'usage.show': ['quanto ho usato', 'mostra il mio consumo', 'quanto mi resta del piano'],

  // Software, building, studio, apps, web
  'software.install': ['installa {name}', 'scarica e installa {name}'],
  'software.remove': ['disinstalla {name}', 'rimuovi {name}'],
  'software.agent': ['apri {name} nel terminale', 'avvia {name} nel terminale'],
  'build.start': ['costruisci {goal}', 'creami {goal}'],
  'studio.open': ['mostra il codice', 'mostra cosa stai facendo', 'mostra cosa hai fatto'],
  'studio.preview': ['anteprima {url}', 'mostra lanteprima di {url}'],
  'studio.file': ['apri {path} nello studio', 'mostra {path} nello studio'],
  'studio.close': ['chiudi lo studio', 'nascondi lo studio'],
  'native.launch': ['apri lapp {name}', 'avvia lapp {name}'],
  'web.open': ['apri il sito {url}', 'vai al sito {url}'],

  // Settings and look
  'settings.open': ['apri le impostazioni', 'apri la sezione {section}', 'mostra le impostazioni {section}'],
  'accent.set': ['imposta laccento su {accent}', 'cambia il colore di accento in {accent}'],
  'motion.reduce': [
    { phrase: 'riduci le animazioni', args: { enabled: true } },
    { phrase: 'attiva le animazioni', args: { enabled: false } }
  ],
  'dock.autoHide': [
    { phrase: 'nascondi il dock', args: { enabled: true } },
    { phrase: 'mostra il dock', args: { enabled: false } }
  ],
  'theme.list': ['quali temi ci sono', 'mostra i temi'],
  'theme.set': ['imposta il tema {theme}', 'cambia il tema in {theme}', 'usa il tema {theme}'],
  'theme.generate': ['crea un tema dallo sfondo', 'crea un tema da questo sfondo'],
  'theme.followHermes': [
    { phrase: 'segui il tema di hermes', args: { enabled: true } },
    { phrase: 'smettere di seguire il tema di hermes', args: { enabled: false } }
  ],
  'wallpaper.set': [{ phrase: 'usa lo sfondo predefinito', args: { image: 'default' } }],
  'font.set': ['usa il carattere {family}', 'imposta il carattere {family}', { phrase: 'imposta il carattere del codice a {family}', args: { kind: 'mono' } }],
  'dictation.toggle': ['avvia la dettatura', 'ferma la dettatura', 'dettatura'],
  'emoji.pick': ['emoji', 'apri il selettore emoji', 'inserisci una emoji'],
  'keymap.set': [
    { phrase: 'usa il keymap omarchy', args: { keymap: 'omarchy' } },
    { phrase: 'usa il keymap herald', args: { keymap: 'herald' } }
  ]
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
