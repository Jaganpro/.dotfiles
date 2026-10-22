// tasting-notes: while Pi works, a winemaking phrase in the working line and a French or
// Italian wine fact on its own line above the input box; both change every 7 seconds.
// Pi's own spinner stays; /wine shows another fact. Facts were checked against sources.
// Own work: clean-room rewrite from a behaviour description (2026-10-21).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

// Each phrase starts with its own icon, shown right after Pi's spinner.
const VERBS = [
  "🍷 Swirling…",
  "🫗 Decanting…",
  "🍾 Uncorking…",
  "🔄 Riddling the bottles…",
  "🪣 Racking off the lees…",
  "👊 Punching down the cap…",
  "🍄 Waiting for noble rot…",
  "🥂 Blending the cuvée…",
  "🪵 Topping up the barrels…",
  "🌞 Drying the grapes…",
  "🧊 Disgorging…",
  "🧐 Consulting the sommelier…",
  "💨 Letting it breathe…",
  "👅 Tasting from the barrel…",
  "📅 Checking the vintage…",
  "🌿 Pruning the vines…",
  "🍇 Treading the grapes…",
  "🔥 Toasting the oak…",
  "👃 Sniffing the cork…",
  "💤 Resting on the lees…",
];

const FACTS: (readonly [string, string])[] = [
  ["🇫🇷", "Champagne holds about 6 atmospheres of pressure, roughly three times a car tyre"],
  ["🇫🇷", "Dom Pérignon didn't invent Champagne; the monk worked to keep bubbles out of his wine"],
  ["🇫🇷", "Barbe-Nicole Clicquot, \"the Widow\", invented the riddling table around 1816 to clear Champagne"],
  ["🇫🇷", "Only one château has ever been promoted in Bordeaux's 1855 ranking: Mouton Rothschild, in 1973"],
  ["🇫🇷", "Château d'Yquem was the only Sauternes ranked Premier Cru Supérieur in 1855"],
  ["🇫🇷", "Sauternes owes its sweetness to \"noble rot\", a fungus that shrivels the grapes"],
  ["🇫🇷", "In 1954 Châteauneuf-du-Pape banned flying saucers from landing in its vineyards"],
  ["🇫🇷", "Châteauneuf-du-Pape allows 13 grape varieties (18 if you count colour variants) in its blends"],
  ["🇫🇷", "Jura's vin jaune spends 5+ years under a veil of yeast, then goes into a 62 cl clavelin"],
  ["🇫🇷", "Bordeaux was English for 300 years after Eleanor of Aquitaine married Henry Plantagenet in 1152"],
  ["🇫🇷", "\"Claret\", the British name for red Bordeaux, comes from the French \"clairet\""],
  ["🇫🇷", "An aphid-like American pest, phylloxera, ravaged French vines in the 1800s; US roots saved them"],
  ["🇫🇷", "Beaujolais Nouveau is released on the third Thursday of November"],
  ["🇫🇷", "Romanée-Conti's vineyard is about 1.8 hectares, smaller than three football pitches"],
  ["🇫🇷", "Burgundy's climats and Champagne's hillsides both became UNESCO World Heritage in 2015"],
  ["🇫🇷", "Alsace labels its wines by grape, unusual in France, and bottles them in tall flutes"],
  ["🇫🇷", "At the 1976 \"Judgment of Paris\", California wines beat top Bordeaux and Burgundy blind"],
  ["🇫🇷", "Cistercian monks walled in Burgundy's Clos de Vougeot in the 1300s"],
  ["🇫🇷", "Pomerol, home of Pétrus, has never had an official classification"],
  ["🇫🇷", "Muscadet \"sur lie\" rests on its dead yeast through winter for extra texture"],
  ["🇮🇹", "Nebbiolo, Barolo's grape, is probably named after nebbia: the autumn fog over the Langhe hills"],
  ["🇮🇹", "Barolo must age at least 38 months, 18 of them in wood, before release"],
  ["🇮🇹", "Barolo, a House of Savoy favourite, is called \"the king of wines and the wine of kings\""],
  ["🇮🇹", "In 1716 Cosimo III de' Medici legally defined Chianti's borders, an early wine law"],
  ["🇮🇹", "Chianti Classico's black rooster recalls a legendary rooster race between Florence and Siena"],
  ["🇮🇹", "Brunello di Montalcino is 100% Sangiovese and can't be sold until over four years after harvest"],
  ["🇮🇹", "Amarone grapes dry for months and lose around 30-40% of their weight before pressing"],
  ["🇮🇹", "Prosecco is named after a village near Trieste; its grape is called Glera"],
  ["🇮🇹", "Sassicaia, often called the first Super Tuscan, started life labelled as humble table wine"],
  ["🇮🇹", "Bolgheri Sassicaia is the only Italian wine with a DOC for a single estate"],
  ["🇮🇹", "Italy and France take turns as the world's biggest wine producer"],
  ["🇮🇹", "Italy has hundreds of native grape varieties, more than any other country"],
  ["🇮🇹", "Marsala became famous after English merchant John Woodhouse shipped it home in 1773"],
  ["🇮🇹", "Etna's vines grow on an active volcano; some ungrafted vines are over 100 years old"],
  ["🇮🇹", "Vin Santo, \"holy wine\", is made from dried grapes and aged in small sealed barrels"],
  ["🇮🇹", "The Romans spread vines across Gaul, building on vineyards Greeks planted near Marseille"],
  ["🇮🇹", "Lambrusco is a mostly fizzy red, chiefly from Emilia-Romagna"],
  ["🇮🇹", "Franciacorta is a Champagne-method sparkling wine from Lombardy"],
  ["🇮🇹", "Barbaresco also uses Nebbiolo but needs only 26 months of ageing to Barolo's 38"],
  ["🇮🇹", "Ancient Romans watered their wine; drinking it neat was seen as barbaric"],
  ["🇮🇹", "Giacomo Conterno's Monfortino Barolo is made only in great vintages and aged for years in big casks"],
  ["🇮🇹", "Bartolo Mascarello hand-painted a label reading \"No barrique, no Berlusconi\""],
  ["🇮🇹", "From 1996 Gaja labelled its top Barbaresco crus Langhe Nebbiolo so it could add a little Barbera"],
  ["🇮🇹", "Barolo's 1980s–90s \"wars\" pitted big old casks (traditionalists) against small new French oak (modernists)"],
  ["🇮🇹", "The vineyard landscapes of Langhe, Roero and Monferrato became UNESCO World Heritage in 2014"],
  ["🇮🇹", "Barolo labels can name one of 181 official MGAs: 170 mapped vineyard areas plus 11 villages"],
  ["🇮🇹", "Nebbiolo makes pale wine with fierce tannins, famous for smelling of \"tar and roses\""],
  ["🇮🇹", "Moscato d'Asti is gently fizzy and only about 5% alcohol"],
  ["🇮🇹", "Barbera, not Nebbiolo, is Piedmont's most planted red grape"],
  ["🇮🇹", "Alba's prized white truffles come from the same hills as Barolo and Barbaresco"],
  ["🇮🇹", "Dolcetto means \"little sweet one\", yet its wine is dry"],
  ["🇮🇹", "Bruno Giacosa made legendary Barolo and Barbaresco, often from grapes he bought rather than grew"],
  ["🇮🇹", "Barolo Chinato is Barolo infused with quinine bark and spices, sipped after dinner"],
  ["🇮🇹", "Arneis, often translated \"little rascal\" for its fussy vines, nearly died out by the 1970s"],
  ["🇮🇹", "Ferruccio Biondi-Santi is credited with creating Brunello di Montalcino, first bottled in 1888"],
  ["🇮🇹", "The Antinori family has made wine since 1385, over 26 generations"],
  ["🇮🇹", "In a 1978 London tasting, Sassicaia beat famous Bordeaux châteaux"],
  ["🇫🇷", "UNESCO counts 1,247 climats in Burgundy: small named plots, each with its own character"],
  ["🇫🇷", "Burgundy has 33 Grand Crus, yet they make only about 1% of its wine"],
  ["🇫🇷", "Inheritance laws split Burgundy's vineyards: Clos de Vougeot's 50 hectares have about 80 owners"],
  ["🇫🇷", "Gevrey added its star vineyard to its name in 1847, becoming Gevrey-Chambertin"],
  ["🇫🇷", "Napoleon's favourite wine was Chambertin, and he reportedly drank it watered down"],
  ["🇫🇷", "In 1760 the Prince of Conti bought Romanée-Conti; legend says he outbid Madame de Pompadour"],
  ["🇫🇷", "Henri Jayer replanted Cros Parantoux, a plot once used to grow Jerusalem artichokes"],
  ["🇫🇷", "Lalou Bize-Leroy co-ran Domaine de la Romanée-Conti until 1992 and is a biodynamic pioneer"],
  ["🇫🇷", "The Hospices de Beaune, a hospital founded in 1443, has auctioned its wine for charity since 1859"],
  ["🇫🇷", "Cistercian monks of Cîteaux walled Clos de Vougeot and studied Burgundy's plots closely"],
  ["🇫🇷", "Alexandre Dumas reportedly said Montrachet should be drunk kneeling, with head bared"],
  ["🇫🇷", "In 1395 Duke Philip the Bold banned Gamay from Burgundy as \"very bad and disloyal\""],
  ["🇫🇷", "Red Burgundy is mostly Pinot Noir; white Burgundy is mostly Chardonnay, plus some Aligoté"],
  ["🇫🇷", "Fraudster Rudy Kurniawan consigned Ponsot Clos St-Denis from years before the domaine made it"],
  ["🇫🇷", "A 1945 Romanée-Conti sold for $558,000 in 2018; the same bottle fetched a record $812,500 in 2026"],
  ["🇫🇷", "Côte d'Or means \"golden slope\", perhaps for its autumn colours or as short for Côte d'Orient"],
  ["🇫🇷", "Chablis grows on Kimmeridgian limestone packed with tiny fossil oyster shells"],
  ["🇫🇷", "All seven Chablis Grand Crus share one south-west-facing hillside above the town"],
  ["🇫🇷", "Chablis is so far north that growers fight spring frost with heaters and ice-coating sprinklers"],
  ["🇫🇷", "Chablis is 100% Chardonnay, and much of it never touches new oak"],
  ["🇫🇷", "La Moutonne is Chablis' unofficial \"eighth Grand Cru\", lying between Vaudésir and Preuses"],
  ["🇫🇷", "\"California Chablis\" was once a common label on cheap American jug wine"],
  ["🇫🇷", "Chablis and other Yonne wines once supplied Paris, shipped down the Yonne river by boat"],
  ["🇫🇷", "Petit Chablis, the entry level, comes from the outer plateaus of the region"],
  ["🇫🇷", "Non-vintage Champagne must age at least 15 months; vintage Champagne at least three years"],
  ["🇫🇷", "Champagne's three main grapes are Chardonnay, Pinot Noir and Pinot Meunier"],
  ["🇫🇷", "Blanc de noirs is white Champagne made from black grapes, pressed gently so the skins add no colour"],
  ["🇫🇷", "Ruinart, founded in 1729, is the oldest established Champagne house"],
  ["🇫🇷", "Krug was founded in 1843 by Joseph Krug"],
  ["🇫🇷", "Roederer's Cristal was created in 1876 for Tsar Alexander II, in a clear bottle"],
  ["🇫🇷", "Lily Bollinger: \"I drink it when I'm happy and when I'm sad\""],
  ["🇫🇷", "Pol Roger named its top cuvée after Winston Churchill, the house's most famous fan"],
  ["🇫🇷", "Chalk pits dug in Roman times under Reims now age millions of bottles of Champagne"],
  ["🇫🇷", "In 1911 Champagne growers rioted over grapes brought in from outside the region"],
  ["🇫🇷", "In 2010 divers found about 170-year-old Champagne in a Baltic wreck; tasters called it alive"],
  ["🇫🇷", "Early Champagne bottles often burst in cellars; stronger glass and precise sugar dosing fixed it"],
  ["🇫🇷", "In the EU only Champagne may say \"méthode champenoise\"; others say \"traditional method\""],
  ["🇫🇷", "Legend links sabrage, opening Champagne with a sabre, to Napoleon's cavalry"],
  ["🇫🇷", "The coupe glass was not modelled on Marie Antoinette's breast; the shape is older than her"],
  ["🇫🇷", "In 1985 a 1787 Lafite said to be Thomas Jefferson's sold for $156,000; it was later doubted"],
  ["🇫🇷", "Since 1945 an artist has designed Mouton Rothschild's label almost every year, paid in wine"],
  ["🇫🇷", "Pétrus is 100% Merlot, grown on a rare patch of iron-rich blue clay in Pomerol"],
  ["🇫🇷", "In 1989 a merchant accidentally broke a 1787 Margaux, insured for $225,000, at a dinner"],
];

// Deals every item once in shuffled order (Fisher–Yates), then reshuffles a fresh copy.
function deck<T>(items: readonly T[]): () => T {
  const pile = [...items];
  let next = pile.length;
  let last: T | undefined;

  return () => {
    if (next === pile.length) {
      for (let i = pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [pile[i], pile[j]] = [pile[j], pile[i]];
      }

      // Never deal the same card twice in a row across a reshuffle.
      if (pile[0] === last) [pile[0], pile[pile.length - 1]] = [pile[pile.length - 1], pile[0]];

      next = 0;
    }

    last = pile[next++];

    return last;
  };
}

export default function (pi: ExtensionAPI) {
  const nextVerb = deck(VERBS);
  const nextFact = deck(FACTS);

  // While Pi works: the phrase sits in the working line, the full fact on its own
  // line above the input box (so it never gets cut off). Both change every 7 seconds.
  let timer: ReturnType<typeof setInterval> | undefined;

  pi.on("agent_start", (_event, ctx) => {
    if (!ctx.hasUI) return;

    const pour = () => {
      const [flag, fact] = nextFact();

      ctx.ui.setWorkingMessage(nextVerb());
      ctx.ui.setWidget("tasting-notes", (_tui, theme) => new Text(theme.fg("muted", `${flag} ${fact}`), 1, 0));
    };

    pour();
    clearInterval(timer);
    timer = setInterval(pour, 7000);
  });

  pi.on("agent_end", (_event, ctx) => {
    clearInterval(timer);

    if (!ctx.hasUI) return;

    ctx.ui.setWorkingMessage();
    ctx.ui.setWidget("tasting-notes", undefined);
  });

  pi.registerCommand("wine", {
    description: "A French or Italian wine fact",
    handler: async (_args, ctx) => {
      const [flag, fact] = nextFact();

      ctx.ui.notify(`${flag} ${fact}`, "info");
    },
  });
}
