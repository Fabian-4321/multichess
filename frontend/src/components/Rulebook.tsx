interface Props { onBack: () => void; }

const SECTIONS = [
  {
    title: 'Grundregeln',
    items: [
      'Weiss beginnt immer das Spiel.',
      'Die Spieler ziehen abwechselnd – jeder zieht genau eine Figur pro Zug.',
      'Ziel ist es, den gegnerischen König schachmatt zu setzen.',
      'Wer schachmatt gesetzt wurde, hat verloren.',
      'Patt (kein gültiger Zug möglich, aber der König steht nicht im Schach) bedeutet Unentschieden.',
      'Eine Figur wird auf ein leeres Feld gesetzt oder schlägt eine gegnerische Figur, die damit vom Brett verschwindet.',
    ],
  },
  {
    title: 'Figuren und ihre Zugweise',
    items: [
      '♚ König – zieht ein Feld in jede Richtung (horizontal, vertikal, diagonal). Darf sich niemals auf ein Feld begeben, das von einer gegnerischen Figur angegriffen wird.',
      '♛ Dame – zieht beliebig weit horizontal, vertikal oder diagonal. Die stärkste Figur auf dem Brett.',
      '♜ Turm – zieht beliebig weit horizontal oder vertikal. Wird für die Rochade benötigt.',
      '♝ Läufer – zieht beliebig weit diagonal. Bleibt immer auf derselben Feldfarbe.',
      '♞ Springer – zieht in einem „L": 2 Felder in eine Richtung, dann 1 Feld im 90°-Winkel. Kann als einzige Figur über andere springen.',
      '♟ Bauer – zieht ein Feld geradeaus. Schlägt diagonal ein Feld vorwärts. Kann beim allerersten Zug 2 Felder vorrücken. Erreicht er die letzte Reihe seiner Zugrichtung, wird er automatisch zur Dame befördert.',
    ],
  },
  {
    title: 'Rochade',
    items: [
      'Die Rochade ist ein Sonderzug, bei dem König und Turm gleichzeitig ziehen.',
      'Kurze Rochade (O-O): König zieht 2 Felder zum Königsflügel-Turm, der Turm springt auf die andere Seite des Königs.',
      'Lange Rochade (O-O-O): König zieht 2 Felder zum Damenflügel-Turm, der Turm springt auf die andere Seite des Königs.',
      'Voraussetzungen: Weder König noch beteiligter Turm dürfen bisher gezogen haben.',
      'Alle Felder zwischen König und Turm müssen leer sein.',
      'Der König darf beim Rochieren nicht im Schach stehen, nicht durch ein angegriffenes Feld ziehen und nicht auf einem angegriffenen Feld landen.',
      'Der Turm darf durchaus angegriffene Felder überqueren – nur der König ist geschützt.',
    ],
  },
  {
    title: 'En Passant',
    items: [
      'Wenn ein Bauer von seiner Startposition aus 2 Felder vorrückt und dabei neben einem gegnerischen Bauern landet, kann dieser gegnerische Bauer im unmittelbar nächsten Zug en passant schlagen.',
      'Dabei zieht der schlagende Bauer diagonal auf das Feld, das der Doppelzug-Bauer überquert hat, und der Doppelzug-Bauer wird entfernt.',
      'En Passant ist nur im direkten Antwortzug möglich – wartet man einen Zug, verfällt das Recht.',
    ],
  },
  {
    title: 'Schach und Schachmatt',
    items: [
      'Schach: Wenn eine gegnerische Figur das Feld des Königs angreift, steht der König im Schach. Der Schach muss sofort abgewehrt werden.',
      'Abwehrmöglichkeiten: den König bewegen, die angreifende Figur schlagen, oder eine eigene Figur zwischen König und Angreifer stellen (nicht bei Springer- oder Bauernangriff möglich).',
      'Schachmatt: Der König steht im Schach und es gibt keine Möglichkeit, das Schach abzuwehren. Das Spiel ist beendet.',
      'Patt: Der am Zug befindliche Spieler hat keinen gültigen Zug, sein König steht aber nicht im Schach. Das Spiel endet unentschieden.',
    ],
  },
  {
    title: '4-Spieler-Schach (Sonderregeln)',
    items: [
      'Gespielt wird auf einem 14×14 Kreuzbrett mit 4 Farben: Weiss, Schwarz, Rot und Blau.',
      'Jeder Spieler hat seine eigene Figurenaufstellung an einer der vier Seiten.',
      'Die Zugreihenfolge ist: Weiss → Rot → Schwarz → Blau.',
      'Bauern bewegen sich in Richtung der gegenüberliegenden Seite: Weiss nach oben, Schwarz nach unten, Rot nach links, Blau nach rechts.',
      'Bauern werden auf der letzten Reihe ihrer Zugrichtung automatisch zur Dame befördert.',
      'Die Rochade funktioniert wie beim normalen Schach: König zieht 2 Felder in Richtung seines Turms, der Turm springt darüber. Bei Rot und Blau erfolgt die Rochade entlang ihrer Spalte statt einer Zeile.',
      'En Passant funktioniert auch zwischen Spielern unterschiedlicher Zugrichtungen (z. B. ein weisser Bauer kann en passant gegen einen roten Bauern schlagen, falls der Zug direkt davor geschah).',
      'Ein Spieler wird eliminiert, wenn sein König schachmatt gesetzt wird. Alle seine Figuren werden vom Brett entfernt.',
      'Die verbleibenden Spieler spielen weiter, bis nur noch ein Spieler übrig ist – dieser gewinnt.',
    ],
  },
  {
    title: 'Online-Modus',
    items: [
      'Erstelle einen Raum und erhalte einen 6-stelligen Code.',
      'Teile den Code (oder den Link) mit deinem Gegner.',
      'Der Raum-Ersteller spielt Weiss. Weitere Spieler treten in der Zugreihenfolge bei.',
      'Im 4-Spieler-Modus können fehlende Plätze mit Bots gefüllt werden. Mindestens 2 Spieler sind erforderlich, um früh zu starten.',
      'Das Spiel startet automatisch, wenn alle Plätze belegt sind.',
      'Bei Verbindungsabbruch bleibt das Spiel bestehen. Reconnect über denselben Raumcode.',
    ],
  },
];

export default function Rulebook({ onBack }: Props) {
  return (
    <div className="bg-exotic min-h-screen text-white">
      <header className="glass border-b border-white/5 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="text-white/40 hover:text-white transition">← Zurück</button>
          <span className="gold-text font-bold text-sm">Schachregeln</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-6 space-y-8">
        {SECTIONS.map((s, i) => (
          <section key={i} className="glass-strong rounded-2xl p-6">
            <h2 className="gold-text text-xl font-bold mb-4">{s.title}</h2>
            <ul className="space-y-2.5">
              {s.items.map((item, j) => (
                <li key={j} className="text-white/60 text-sm leading-relaxed pl-4 border-l-2 border-amber-700/30">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
