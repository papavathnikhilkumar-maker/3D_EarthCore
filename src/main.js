import './style.css';
import Globe from 'globe.gl';

// Add a title container to the UI
const titleDiv = document.createElement('div');
titleDiv.className = 'title-container';
titleDiv.innerHTML = `
  <h1>Earth 3D</h1>
  <p>Interactive map of world countries</p>
`;
document.body.appendChild(titleDiv);

const worldGeoJsonUrl = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

const myGlobe = Globe()
  (document.getElementById('app'))
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#2a70cc')
  .atmosphereAltitude(0.15)
  .polygonAltitude(0.002)
  .polygonCapColor(() => 'rgba(0, 0, 0, 0)') // transparent landmasses
  .polygonSideColor(() => 'rgba(0, 0, 0, 0)') // transparent sides
  .polygonStrokeColor(() => 'rgba(255, 215, 0, 0.6)') // gold borders
  .polygonLabel(({ properties: d }) => `
    <div style="
      background: rgba(6, 59, 115, 0.85); /* ocean */
      backdrop-filter: blur(10px);
      padding: 12px 16px; 
      border-radius: 8px; 
      color: #EAF7FF; /* ice */
      border: 1px solid rgba(255, 255, 255, 0.3); /* cloud */
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      font-family: 'Inter', system-ui, sans-serif;
    ">
      <b style="font-size: 1.1rem; color: #C89B5B;">${d.ADMIN} (${d.ISO_A2})</b> <br /> <!-- desert -->
      <span style="color: #EAF7FF; font-size: 0.9rem; opacity: 0.8;">Population: </span>
      <span style="color: #FFFFFF; font-weight: 500;">${d.POP_EST > 0 ? d.POP_EST.toLocaleString() : 'N/A'}</span>
    </div>
  `)
  .onPolygonHover(hoverD => {
    myGlobe
      .polygonAltitude(d => (d === hoverD || d === searchedFeature) ? 0.01 : 0.002)
      .polygonCapColor(d => {
        if (d === searchedFeature) return 'rgba(200, 155, 91, 0.5)';
        if (d === hoverD) return 'rgba(224, 180, 117, 0.5)';
        return 'rgba(0, 0, 0, 0)';
      }); 
    
    // Change cursor on hover
    document.body.style.cursor = hoverD ? 'pointer' : 'default';
  })
  .polygonsTransitionDuration(300);

let geoData = [];
let searchedFeature = null;

const waterBodies = [
  { name: 'Pacific Ocean', lat: 0, lng: -160, type: 'water' },
  { name: 'Atlantic Ocean', lat: 15, lng: -40, type: 'water' },
  { name: 'Indian Ocean', lat: -20, lng: 80, type: 'water' },
  { name: 'Arctic Ocean', lat: 85, lng: 0, type: 'water' },
  { name: 'Southern Ocean', lat: -60, lng: 0, type: 'water' },
  { name: 'Mediterranean Sea', lat: 35, lng: 18, type: 'water' },
  { name: 'Caribbean Sea', lat: 15, lng: -75, type: 'water' },
  { name: 'Arabian Sea', lat: 15, lng: 65, type: 'water' },
  { name: 'South China Sea', lat: 12, lng: 113, type: 'water' },
  { name: 'Bering Sea', lat: 58, lng: 175, type: 'water' },
  { name: 'Sea of Okhotsk', lat: 53, lng: 149, type: 'water' },
  { name: 'Coral Sea', lat: -16, lng: 155, type: 'water' },
  { name: 'Tasman Sea', lat: -38, lng: 160, type: 'water' },
  { name: 'Red Sea', lat: 20, lng: 38, type: 'water' },
  { name: 'Black Sea', lat: 43, lng: 35, type: 'water' }
];
let currentSearchElements = [];

const nationalSymbolsData = [
  {name:"Afghanistan",flag:"🇦🇫",animal:"Snow Leopard",bird:"Golden Eagle",flower:"Tulip",fruit:"Pomegranate",tree:"Afghan Pine"},
  {name:"Albania",flag:"🇦🇱",animal:"Golden Eagle",bird:"Golden Eagle",flower:"Red Poppy",fruit:"Olive",tree:"Olive"},
  {name:"Algeria",flag:"🇩🇿",animal:"Fennec Fox",bird:"Barbary Falcon",flower:"Iris",fruit:"Date",tree:"Olive"},
  {name:"Andorra",flag:"🇦🇩",animal:"Pyrenean Chamois",bird:"Bearded Vulture",flower:"Narcissus",fruit:"Apple",tree:"Scots Pine"},
  {name:"Angola",flag:"🇦🇴",animal:"Giant Sable Antelope",bird:"Red-crested Turaco",flower:"Welwitschia",fruit:"Banana",tree:"Baobab"},
  {name:"Antigua and Barbuda",flag:"🇦🇬",animal:"Fallow Deer",bird:"Magnificent Frigatebird",flower:"Dagger Log",fruit:"Black Pineapple",tree:"—"},
  {name:"Argentina",flag:"🇦🇷",animal:"Puma",bird:"Rufous Hornero",flower:"Ceibo",fruit:"Apple",tree:"Ceibo"},
  {name:"Armenia",flag:"🇦🇲",animal:"Eagle",bird:"Golden Eagle",flower:"Forget-me-not",fruit:"Apricot",tree:"Apricot"},
  {name:"Australia",flag:"🇦🇺",animal:"Red Kangaroo",bird:"Emu",flower:"Golden Wattle",fruit:"Finger Lime",tree:"Golden Wattle"},
  {name:"Austria",flag:"🇦🇹",animal:"Eagle",bird:"Barn Swallow",flower:"Edelweiss",fruit:"Apple",tree:"Oak"},
  {name:"Azerbaijan",flag:"🇦🇿",animal:"Karabakh Horse",bird:"—",flower:"Khari Bulbul",fruit:"Pomegranate",tree:"Ironwood"},
  {name:"Bahamas",flag:"🇧🇸",animal:"Blue Marlin",bird:"Flamingo",flower:"Yellow Elder",fruit:"Pineapple",tree:"Lignum Vitae"},
  {name:"Bahrain",flag:"🇧🇭",animal:"Arabian Oryx",bird:"White-cheeked Bulbul",flower:"—",fruit:"Date",tree:"Date Palm"},
  {name:"Bangladesh",flag:"🇧🇩",animal:"Royal Bengal Tiger",bird:"Oriental Magpie-Robin",flower:"Water Lily",fruit:"Jackfruit",tree:"Mango"},
  {name:"Barbados",flag:"🇧🇧",animal:"Green Monkey",bird:"Brown Pelican",flower:"Pride of Barbados",fruit:"Golden Apple",tree:"Bearded Fig"},
  {name:"Belarus",flag:"🇧🇾",animal:"European Bison",bird:"White Stork",flower:"Wild Flax",fruit:"Apple",tree:"Oak"},
  {name:"Belgium",flag:"🇧🇪",animal:"Lion",bird:"Common Kestrel",flower:"Red Poppy",fruit:"Pear",tree:"—"},
  {name:"Belize",flag:"🇧🇿",animal:"Baird's Tapir",bird:"Keel-billed Toucan",flower:"Black Orchid",fruit:"Soursop",tree:"Mahogany"},
  {name:"Benin",flag:"🇧🇯",animal:"Leopard",bird:"African Grey Parrot",flower:"Red Hibiscus",fruit:"Pineapple",tree:"—"},
  {name:"Bhutan",flag:"🇧🇹",animal:"Takin",bird:"Raven",flower:"Blue Poppy",fruit:"Apple",tree:"Himalayan Cypress"},
  {name:"Bolivia",flag:"🇧🇴",animal:"Llama",bird:"Andean Condor",flower:"Kantuta",fruit:"Passion Fruit",tree:"—"},
  {name:"Bosnia and Herzegovina",flag:"🇧🇦",animal:"—",bird:"—",flower:"Golden Lily",fruit:"Plum",tree:"Linden"},
  {name:"Botswana",flag:"🇧🇼",animal:"Zebra",bird:"Kori Bustard",flower:"Devil's Claw",fruit:"Marula",tree:"Marula"},
  {name:"Brazil",flag:"🇧🇷",animal:"Jaguar",bird:"Rufous-bellied Thrush",flower:"Cattleya Orchid",fruit:"Açaí",tree:"Brazilwood"},
  {name:"Brunei",flag:"🇧🇳",animal:"Proboscis Monkey",bird:"White-bellied Sea Eagle",flower:"Simpor",fruit:"Durian",tree:"—"},
  {name:"Bulgaria",flag:"🇧🇬",animal:"Lion",bird:"—",flower:"Rose",fruit:"Rose Hip",tree:"—"},
  {name:"Burkina Faso",flag:"🇧🇫",animal:"White Stallion",bird:"—",flower:"—",fruit:"Mango",tree:"Shea"},
  {name:"Burundi",flag:"🇧🇮",animal:"Lion",bird:"Great Blue Turaco",flower:"—",fruit:"Banana",tree:"—"},
  {name:"Cabo Verde",flag:"🇨🇻",animal:"—",bird:"Iago Sparrow",flower:"Gerbera",fruit:"Banana",tree:"—"},
  {name:"Cambodia",flag:"🇰🇭",animal:"Kouprey",bird:"Giant Ibis",flower:"Romduol",fruit:"Sugar Palm Fruit",tree:"Sugar Palm"},
  {name:"Cameroon",flag:"🇨🇲",animal:"Lion",bird:"—",flower:"—",fruit:"Banana",tree:"—"},
  {name:"Canada",flag:"🇨🇦",animal:"Beaver",bird:"Common Loon",flower:"Bunchberry",fruit:"Blueberry",tree:"Maple"},
  {name:"Central African Republic",flag:"🇨🇫",animal:"Elephant",bird:"—",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Chad",flag:"🇹🇩",animal:"Goat",bird:"Ostrich",flower:"—",fruit:"Date",tree:"—"},
  {name:"Chile",flag:"🇨🇱",animal:"Huemul",bird:"Andean Condor",flower:"Copihue",fruit:"Grape",tree:"Chilean Pine"},
  {name:"China",flag:"🇨🇳",animal:"Giant Panda",bird:"Red-crowned Crane",flower:"Plum Blossom",fruit:"Peach",tree:"Ginkgo"},
  {name:"Colombia",flag:"🇨🇴",animal:"Jaguar",bird:"Andean Condor",flower:"Cattleya Orchid",fruit:"Lulo",tree:"Quindío Wax Palm"},
  {name:"Comoros",flag:"🇰🇲",animal:"Coelacanth",bird:"—",flower:"Ylang-Ylang",fruit:"Banana",tree:"Coconut"},
  {name:"Costa Rica",flag:"🇨🇷",animal:"White-tailed Deer",bird:"Clay-colored Thrush",flower:"Guaria Morada",fruit:"Cas",tree:"Guanacaste"},
  {name:"Côte d'Ivoire",flag:"🇨🇮",animal:"Elephant",bird:"—",flower:"—",fruit:"Cocoa Pod",tree:"—"},
  {name:"Croatia",flag:"🇭🇷",animal:"Pine Marten",bird:"Croatian Hawk",flower:"Iris",fruit:"Mandarin",tree:"Pedunculate Oak"},
  {name:"Cuba",flag:"🇨🇺",animal:"Cuban Crocodile",bird:"Cuban Trogon",flower:"Mariposa",fruit:"Mamey",tree:"Royal Palm"},
  {name:"Cyprus",flag:"🇨🇾",animal:"Cypriot Mouflon",bird:"—",flower:"Cyclamen",fruit:"Citrus",tree:"Golden Oak"},
  {name:"Czechia",flag:"🇨🇿",animal:"Double-tailed Lion",bird:"—",flower:"Rose",fruit:"Plum",tree:"Small-leaved Lime"},
  {name:"Democratic Republic of the Congo",flag:"🇨🇩",animal:"Okapi",bird:"Congo Peafowl",flower:"—",fruit:"Plantain",tree:"—"},
  {name:"Denmark",flag:"🇩🇰",animal:"Red Squirrel",bird:"Mute Swan",flower:"Daisy",fruit:"Apple",tree:"Beech"},
  {name:"Djibouti",flag:"🇩🇯",animal:"—",bird:"—",flower:"—",fruit:"Date",tree:"—"},
  {name:"Dominica",flag:"🇩🇲",animal:"Sisserou Parrot",bird:"Sisserou Parrot",flower:"Bwa Carib",fruit:"Banana",tree:"—"},
  {name:"Dominican Republic",flag:"🇩🇴",animal:"Palmchat",bird:"Palmchat",flower:"Bayahibe Rose",fruit:"Mango",tree:"West Indian Mahogany"},
  {name:"Ecuador",flag:"🇪🇨",animal:"Andean Condor",bird:"Andean Condor",flower:"Rose",fruit:"Banana",tree:"Cinchona"},
  {name:"Egypt",flag:"🇪🇬",animal:"Eagle",bird:"Steppe Eagle",flower:"Lotus",fruit:"Date",tree:"—"},
  {name:"El Salvador",flag:"🇸🇻",animal:"White-tailed Deer",bird:"Turquoise-browed Motmot",flower:"Izote",fruit:"Jocote",tree:"Maquilishuat"},
  {name:"Equatorial Guinea",flag:"🇬🇶",animal:"—",bird:"—",flower:"—",fruit:"Banana",tree:"—"},
  {name:"Eritrea",flag:"🇪🇷",animal:"Camel",bird:"—",flower:"—",fruit:"Fig",tree:"—"},
  {name:"Estonia",flag:"🇪🇪",animal:"Wolf",bird:"Barn Swallow",flower:"Cornflower",fruit:"Apple",tree:"Oak"},
  {name:"Eswatini",flag:"🇸🇿",animal:"Lion",bird:"Purple-crested Turaco",flower:"—",fruit:"Marula",tree:"Marula"},
  {name:"Ethiopia",flag:"🇪🇹",animal:"Lion",bird:"Thick-billed Raven",flower:"Calla Lily",fruit:"Coffee Cherry",tree:"—"},
  {name:"Fiji",flag:"🇫🇯",animal:"Collared Lory",bird:"Collared Lory",flower:"Tagimoucia",fruit:"Coconut",tree:"Coconut"},
  {name:"Finland",flag:"🇫🇮",animal:"Brown Bear",bird:"Whooper Swan",flower:"Lily of the Valley",fruit:"Cloudberry",tree:"Silver Birch"},
  {name:"France",flag:"🇫🇷",animal:"Gallic Rooster",bird:"Gallic Rooster",flower:"Fleur-de-lis",fruit:"Grape",tree:"Oak"},
  {name:"Gabon",flag:"🇬🇦",animal:"Black Panther",bird:"African Fish Eagle",flower:"—",fruit:"Mango",tree:"Okoumé"},
  {name:"Gambia",flag:"🇬🇲",animal:"Lion",bird:"—",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Georgia",flag:"🇬🇪",animal:"—",bird:"Pheasant",flower:"—",fruit:"Grape",tree:"—"},
  {name:"Germany",flag:"🇩🇪",animal:"—",bird:"Golden Eagle",flower:"Cornflower",fruit:"Apple",tree:"Oak"},
  {name:"Ghana",flag:"🇬🇭",animal:"—",bird:"Golden Eagle",flower:"Impala Lily",fruit:"Pineapple",tree:"—"},
  {name:"Greece",flag:"🇬🇷",animal:"Dolphin",bird:"Little Owl",flower:"Bear's Breech",fruit:"Olive",tree:"Olive"},
  {name:"Greenland",flag:"🇬🇱",animal:"Polar Bear",bird:"White-tailed Eagle",flower:"Niviarsiaq",fruit:"Crowberry",tree:"Downy Birch"},
  {name:"Grenada",flag:"🇬🇩",animal:"Dove",bird:"Grenada Dove",flower:"Bougainvillea",fruit:"Nutmeg",tree:"—"},
  {name:"Guatemala",flag:"🇬🇹",animal:"Quetzal",bird:"Resplendent Quetzal",flower:"Monja Blanca",fruit:"Avocado",tree:"Ceiba"},
  {name:"Guinea",flag:"🇬🇳",animal:"Elephant",bird:"—",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Guinea-Bissau",flag:"🇬🇼",animal:"—",bird:"African Fish Eagle",flower:"—",fruit:"Cashew Apple",tree:"—"},
  {name:"Guyana",flag:"🇬🇾",animal:"Jaguar",bird:"Hoatzin",flower:"Victoria Regia",fruit:"Golden Apple",tree:"Greenheart"},
  {name:"Haiti",flag:"🇭🇹",animal:"Hispaniolan Trogon",bird:"Hispaniolan Trogon",flower:"Hibiscus",fruit:"Mango",tree:"Royal Palm"},
  {name:"Honduras",flag:"🇭🇳",animal:"White-tailed Deer",bird:"Scarlet Macaw",flower:"Orchid",fruit:"Mango",tree:"Pine"},
  {name:"Hungary",flag:"🇭🇺",animal:"Turul",bird:"Saker Falcon",flower:"Tulip",fruit:"Apricot",tree:"Oak"},
  {name:"Iceland",flag:"🇮🇸",animal:"Gyrfalcon",bird:"Gyrfalcon",flower:"Mountain Avens",fruit:"Bilberry",tree:"—"},
  {name:"India",flag:"🇮🇳",animal:"Bengal Tiger",bird:"Indian Peacock",flower:"Lotus",fruit:"Mango",tree:"Banyan"},
  {name:"Indonesia",flag:"🇮🇩",animal:"Komodo Dragon",bird:"Javan Hawk-Eagle",flower:"White Jasmine",fruit:"Durian",tree:"Teak"},
  {name:"Iran",flag:"🇮🇷",animal:"Persian Leopard",bird:"Nightingale",flower:"Red Rose",fruit:"Pomegranate",tree:"Persian Ironwood"},
  {name:"Iraq",flag:"🇮🇶",animal:"Goat",bird:"Chukar Partridge",flower:"Red Rose",fruit:"Date",tree:"—"},
  {name:"Ireland",flag:"🇮🇪",animal:"Irish Hare",bird:"Northern Lapwing",flower:"Shamrock",fruit:"Apple",tree:"Sessile Oak"},
  {name:"Israel",flag:"🇮🇱",animal:"—",bird:"Hoopoe",flower:"Anemone",fruit:"Jaffa Orange",tree:"Olive"},
  {name:"Italy",flag:"🇮🇹",animal:"Italian Wolf",bird:"Italian Sparrow",flower:"Lily",fruit:"Grape",tree:"Olive"},
  {name:"Jamaica",flag:"🇯🇲",animal:"Red-billed Streamertail",bird:"Red-billed Streamertail",flower:"Lignum Vitae",fruit:"Ackee",tree:"Blue Mahoe"},
  {name:"Japan",flag:"🇯🇵",animal:"—",bird:"Green Pheasant",flower:"Cherry Blossom",fruit:"Persimmon",tree:"Japanese Cedar"},
  {name:"Jordan",flag:"🇯🇴",animal:"Arabian Oryx",bird:"Sinai Rosefinch",flower:"Black Iris",fruit:"Olive",tree:"—"},
  {name:"Kazakhstan",flag:"🇰🇿",animal:"Snow Leopard",bird:"Steppe Eagle",flower:"Tulip",fruit:"Apple",tree:"—"},
  {name:"Kenya",flag:"🇰🇪",animal:"Lion",bird:"Lilac-breasted Roller",flower:"Orchid",fruit:"Mango",tree:"—"},
  {name:"Kiribati",flag:"🇰🇮",animal:"Frigatebird",bird:"Frigatebird",flower:"—",fruit:"Coconut",tree:"Coconut"},
  {name:"Kuwait",flag:"🇰🇼",animal:"Camel",bird:"Falcon",flower:"Arfaj",fruit:"Date",tree:"—"},
  {name:"Kyrgyzstan",flag:"🇰🇬",animal:"Snow Leopard",bird:"Golden Eagle",flower:"Tulip",fruit:"Apricot",tree:"—"},
  {name:"Laos",flag:"🇱🇦",animal:"Elephant",bird:"Siamese Fireback",flower:"Dok Champa",fruit:"Mango",tree:"—"},
  {name:"Latvia",flag:"🇱🇻",animal:"Eurasian Lynx",bird:"White Wagtail",flower:"Oxeye Daisy",fruit:"Apple",tree:"Oak"},
  {name:"Lebanon",flag:"🇱🇧",animal:"Striped Hyena",bird:"—",flower:"—",fruit:"Grape",tree:"Cedar"},
  {name:"Lesotho",flag:"🇱🇸",animal:"Black Rhinoceros",bird:"Bearded Vulture",flower:"Aloe",fruit:"Peach",tree:"—"},
  {name:"Liberia",flag:"🇱🇷",animal:"Pygmy Hippopotamus",bird:"—",flower:"—",fruit:"Pineapple",tree:"—"},
  {name:"Libya",flag:"🇱🇾",animal:"Lion",bird:"—",flower:"—",fruit:"Date",tree:"—"},
  {name:"Liechtenstein",flag:"🇱🇮",animal:"—",bird:"—",flower:"Yellow Rose",fruit:"Apple",tree:"—"},
  {name:"Lithuania",flag:"🇱🇹",animal:"White Stork",bird:"White Stork",flower:"Rue",fruit:"Apple",tree:"Oak"},
  {name:"Luxembourg",flag:"🇱🇺",animal:"Red Lion",bird:"—",flower:"Rose",fruit:"Plum",tree:"Oak"},
  {name:"Madagascar",flag:"🇲🇬",animal:"Ring-tailed Lemur",bird:"Madagascar Fish Eagle",flower:"Poinciana",fruit:"Lychee",tree:"Baobab"},
  {name:"Malawi",flag:"🇲🇼",animal:"—",bird:"Fish Eagle",flower:"Lotus",fruit:"Mango",tree:"—"},
  {name:"Malaysia",flag:"🇲🇾",animal:"Malayan Tiger",bird:"Rhinoceros Hornbill",flower:"Hibiscus",fruit:"Papaya",tree:"—"},
  {name:"Maldives",flag:"🇲🇻",animal:"Yellowfin Tuna",bird:"—",flower:"Pink Rose",fruit:"Coconut",tree:"Coconut Palm"},
  {name:"Mali",flag:"🇲🇱",animal:"—",bird:"—",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Malta",flag:"🇲🇹",animal:"Pharaoh Hound",bird:"Blue Rock Thrush",flower:"Maltese Centaury",fruit:"Orange",tree:"Gharghar"},
  {name:"Marshall Islands",flag:"🇲🇭",animal:"—",bird:"—",flower:"—",fruit:"Coconut",tree:"Coconut"},
  {name:"Mauritania",flag:"🇲🇷",animal:"—",bird:"—",flower:"—",fruit:"Date",tree:"—"},
  {name:"Mauritius",flag:"🇲🇺",animal:"Dodo",bird:"Mauritius Kestrel",flower:"Trochetia",fruit:"Lychee",tree:"—"},
  {name:"Mexico",flag:"🇲🇽",animal:"Xoloitzcuintli",bird:"Golden Eagle",flower:"Dahlia",fruit:"Avocado",tree:"Ahuehuete"},
  {name:"Micronesia",flag:"🇫🇲",animal:"—",bird:"—",flower:"—",fruit:"Breadfruit",tree:"Coconut"},
  {name:"Moldova",flag:"🇲🇩",animal:"Aurochs",bird:"—",flower:"Dog Rose",fruit:"Grape",tree:"Oak"},
  {name:"Monaco",flag:"🇲🇨",animal:"—",bird:"—",flower:"Carnation",fruit:"Lemon",tree:"Olive"},
  {name:"Mongolia",flag:"🇲🇳",animal:"Przewalski's Horse",bird:"Saker Falcon",flower:"—",fruit:"Sea Buckthorn",tree:"—"},
  {name:"Montenegro",flag:"🇲🇪",animal:"—",bird:"Golden Eagle",flower:"Mimosa",fruit:"Olive",tree:"—"},
  {name:"Morocco",flag:"🇲🇦",animal:"Barbary Lion",bird:"Barbary Falcon",flower:"Rose",fruit:"Date",tree:"Argan"},
  {name:"Mozambique",flag:"🇲🇿",animal:"Elephant",bird:"Fish Eagle",flower:"—",fruit:"Cashew",tree:"—"},
  {name:"Myanmar",flag:"🇲🇲",animal:"Tiger",bird:"Green Peafowl",flower:"Padauk",fruit:"Mango",tree:"Padauk"},
  {name:"Namibia",flag:"🇳🇦",animal:"Oryx",bird:"African Fish Eagle",flower:"Welwitschia",fruit:"Marula",tree:"—"},
  {name:"Nauru",flag:"🇳🇷",animal:"Frigatebird",bird:"Frigatebird",flower:"—",fruit:"Coconut",tree:"Coconut"},
  {name:"Nepal",flag:"🇳🇵",animal:"Cow",bird:"Himalayan Monal",flower:"Rhododendron",fruit:"Lapsi",tree:"—"},
  {name:"Netherlands",flag:"🇳🇱",animal:"Lion",bird:"Eurasian Curlew",flower:"Daisy",fruit:"Apple",tree:"Linden"},
  {name:"New Zealand",flag:"🇳🇿",animal:"Kiwi",bird:"Kiwi",flower:"Silver Fern",fruit:"Kiwifruit",tree:"Silver Fern"},
  {name:"Nicaragua",flag:"🇳🇮",animal:"Guardabarranco",bird:"Guardabarranco",flower:"Sacuanjoche",fruit:"Mango",tree:"Madroño"},
  {name:"Niger",flag:"🇳🇪",animal:"—",bird:"—",flower:"—",fruit:"Date",tree:"—"},
  {name:"Nigeria",flag:"🇳🇬",animal:"Eagle",bird:"Black Crowned Crane",flower:"Yellow Trumpet",fruit:"Mango",tree:"—"},
  {name:"North Korea",flag:"🇰🇵",animal:"Chollima",bird:"—",flower:"Magnolia",fruit:"Persimmon",tree:"Pine"},
  {name:"North Macedonia",flag:"🇲🇰",animal:"Lion",bird:"—",flower:"Poppy",fruit:"Grape",tree:"Oak"},
  {name:"Norway",flag:"🇳🇴",animal:"Moose",bird:"White-throated Dipper",flower:"Heather",fruit:"Apple",tree:"Birch"},
  {name:"Oman",flag:"🇴🇲",animal:"Arabian Oryx",bird:"Falcon",flower:"—",fruit:"Date",tree:"Ghaf"},
  {name:"Pakistan",flag:"🇵🇰",animal:"Markhor",bird:"Chukar Partridge",flower:"Jasmine",fruit:"Mango",tree:"Deodar"},
  {name:"Palau",flag:"🇵🇼",animal:"Dugong",bird:"Micronesian Megapode",flower:"—",fruit:"Coconut",tree:"Coconut"},
  {name:"Palestine",flag:"🇵🇸",animal:"Gazelle",bird:"Palestine Sunbird",flower:"Faqqua Iris",fruit:"Olive",tree:"Olive"},
  {name:"Panama",flag:"🇵🇦",animal:"Harpy Eagle",bird:"Harpy Eagle",flower:"Holy Ghost Orchid",fruit:"Pineapple",tree:"Panama Tree"},
  {name:"Papua New Guinea",flag:"🇵🇬",animal:"Bird of Paradise",bird:"Raggiana Bird of Paradise",flower:"Dendrobium",fruit:"Banana",tree:"—"},
  {name:"Paraguay",flag:"🇵🇾",animal:"Pampas Fox",bird:"Bare-throated Bellbird",flower:"Blue Passionflower",fruit:"Orange",tree:"Lapacho"},
  {name:"Peru",flag:"🇵🇪",animal:"Vicuña",bird:"Andean Cock-of-the-rock",flower:"Cantua",fruit:"Lucuma",tree:"Cinchona"},
  {name:"Philippines",flag:"🇵🇭",animal:"Carabao",bird:"Philippine Eagle",flower:"Sampaguita",fruit:"Mango",tree:"Narra"},
  {name:"Poland",flag:"🇵🇱",animal:"White-tailed Eagle",bird:"White-tailed Eagle",flower:"Red Poppy",fruit:"Apple",tree:"Oak"},
  {name:"Portugal",flag:"🇵🇹",animal:"Rooster",bird:"Barcelos Rooster",flower:"Lavender",fruit:"Grape",tree:"Cork Oak"},
  {name:"Qatar",flag:"🇶🇦",animal:"Arabian Oryx",bird:"Falcon",flower:"Qataf",fruit:"Date",tree:"Sidra"},
  {name:"Romania",flag:"🇷🇴",animal:"Lynx",bird:"Golden Eagle",flower:"Dog Rose",fruit:"Plum",tree:"Oak"},
  {name:"Russia",flag:"🇷🇺",animal:"Eurasian Brown Bear",bird:"Double-headed Eagle",flower:"Chamomile",fruit:"Apple",tree:"Birch"},
  {name:"Rwanda",flag:"🇷🇼",animal:"Leopard",bird:"Grey Crowned Crane",flower:"—",fruit:"Banana",tree:"—"},
  {name:"Saint Kitts and Nevis",flag:"🇰🇳",animal:"Vervet Monkey",bird:"Brown Pelican",flower:"Poinciana",fruit:"Mango",tree:"—"},
  {name:"Saint Lucia",flag:"🇱🇨",animal:"Saint Lucia Parrot",bird:"Saint Lucia Parrot",flower:"Rose",fruit:"Golden Apple",tree:"Calabash"},
  {name:"Saint Vincent and the Grenadines",flag:"🇻🇨",animal:"Saint Vincent Parrot",bird:"Saint Vincent Parrot",flower:"Soufrière Tree",fruit:"Breadfruit",tree:"—"},
  {name:"Samoa",flag:"🇼🇸",animal:"—",bird:"Manumea",flower:"Teuila",fruit:"Coconut",tree:"Coconut"},
  {name:"San Marino",flag:"🇸🇲",animal:"—",bird:"Peregrine Falcon",flower:"Cyclamen",fruit:"Grape",tree:"—"},
  {name:"São Tomé and Príncipe",flag:"🇸🇹",animal:"—",bird:"Giant Sunbird",flower:"—",fruit:"Cocoa Pod",tree:"—"},
  {name:"Saudi Arabia",flag:"🇸🇦",animal:"Arabian Camel",bird:"Falcon",flower:"Arfaj",fruit:"Date",tree:"Ghaf"},
  {name:"Senegal",flag:"🇸🇳",animal:"Lion",bird:"Senegal Parrot",flower:"—",fruit:"Mango",tree:"Baobab"},
  {name:"Serbia",flag:"🇷🇸",animal:"Wolf",bird:"Golden Eagle",flower:"Ramonda Serbica",fruit:"Plum",tree:"Oak"},
  {name:"Seychelles",flag:"🇸🇨",animal:"Giant Tortoise",bird:"Seychelles Black Parrot",flower:"Tropicbird Orchid",fruit:"Coco de Mer",tree:"Coco de Mer"},
  {name:"Sierra Leone",flag:"🇸🇱",animal:"Lion",bird:"White-necked Rockfowl",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Singapore",flag:"🇸🇬",animal:"Lion",bird:"Crimson Sunbird",flower:"Vanda Miss Joaquim",fruit:"Durian",tree:"Tembusu"},
  {name:"Slovakia",flag:"🇸🇰",animal:"Brown Bear",bird:"White Stork",flower:"Rose",fruit:"Plum",tree:"Linden"},
  {name:"Slovenia",flag:"🇸🇮",animal:"Carniolan Honey Bee",bird:"—",flower:"Carnation",fruit:"Apple",tree:"Linden"},
  {name:"Solomon Islands",flag:"🇸🇧",animal:"Sea Turtle",bird:"Blyth's Hornbill",flower:"—",fruit:"Coconut",tree:"—"},
  {name:"Somalia",flag:"🇸🇴",animal:"Leopard",bird:"—",flower:"—",fruit:"Banana",tree:"—"},
  {name:"South Africa",flag:"🇿🇦",animal:"Springbok",bird:"Blue Crane",flower:"King Protea",fruit:"Marula",tree:"Real Yellowwood"},
  {name:"South Korea",flag:"🇰🇷",animal:"Siberian Tiger",bird:"Korean Magpie",flower:"Mugunghwa",fruit:"Persimmon",tree:"Korean Red Pine"},
  {name:"South Sudan",flag:"🇸🇸",animal:"African Fish Eagle",bird:"African Fish Eagle",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Spain",flag:"🇪🇸",animal:"Bull",bird:"Spanish Imperial Eagle",flower:"Red Carnation",fruit:"Grape",tree:"Holm Oak"},
  {name:"Sri Lanka",flag:"🇱🇰",animal:"Sri Lankan Elephant",bird:"Sri Lankan Junglefowl",flower:"Blue Water Lily",fruit:"Jackfruit",tree:"Ceylon Ironwood"},
  {name:"Sudan",flag:"🇸🇩",animal:"—",bird:"Secretary Bird",flower:"Hibiscus",fruit:"Date",tree:"—"},
  {name:"Suriname",flag:"🇸🇷",animal:"Jaguar",bird:"Crested Oropendola",flower:"Faya Lobi",fruit:"Coconut",tree:"—"},
  {name:"Sweden",flag:"🇸🇪",animal:"Moose",bird:"Eurasian Blackbird",flower:"Campanula",fruit:"Lingonberry",tree:"Ornäs Birch"},
  {name:"Switzerland",flag:"🇨🇭",animal:"Cow",bird:"—",flower:"Edelweiss",fruit:"Apple",tree:"Swiss Stone Pine"},
  {name:"Syria",flag:"🇸🇾",animal:"—",bird:"—",flower:"Jasmine",fruit:"Olive",tree:"—"},
  {name:"Tajikistan",flag:"🇹🇯",animal:"Marco Polo Sheep",bird:"Golden Eagle",flower:"Tulip",fruit:"Apricot",tree:"—"},
  {name:"Tanzania",flag:"🇹🇿",animal:"Giraffe",bird:"—",flower:"—",fruit:"Mango",tree:"—"},
  {name:"Thailand",flag:"🇹🇭",animal:"Thai Elephant",bird:"Siamese Fireback",flower:"Ratchaphruek",fruit:"Durian",tree:"Golden Shower Tree"},
  {name:"Timor-Leste",flag:"🇹🇱",animal:"Crocodile",bird:"—",flower:"Hibiscus",fruit:"Coconut",tree:"Sandalwood"},
  {name:"Togo",flag:"🇹🇬",animal:"Lion",bird:"—",flower:"—",fruit:"Pineapple",tree:"—"},
  {name:"Tonga",flag:"🇹🇴",animal:"Flying Fox",bird:"Pacific Imperial Pigeon",flower:"Heilala",fruit:"Coconut",tree:"—"},
  {name:"Trinidad and Tobago",flag:"🇹🇹",animal:"Scarlet Ibis",bird:"Scarlet Ibis",flower:"Chaconia",fruit:"Cocoa Pod",tree:"—"},
  {name:"Tunisia",flag:"🇹🇳",animal:"Dromedary",bird:"—",flower:"Jasmine",fruit:"Date",tree:"Olive"},
  {name:"Türkiye",flag:"🇹🇷",animal:"Grey Wolf",bird:"Redwing",flower:"Tulip",fruit:"Fig",tree:"Oak"},
  {name:"Turkmenistan",flag:"🇹🇲",animal:"Akhal-Teke Horse",bird:"—",flower:"—",fruit:"Melon",tree:"—"},
  {name:"Tuvalu",flag:"🇹🇻",animal:"—",bird:"—",flower:"—",fruit:"Coconut",tree:"Coconut"},
  {name:"Uganda",flag:"🇺🇬",animal:"Uganda Kob",bird:"Grey Crowned Crane",flower:"—",fruit:"Jackfruit",tree:"—"},
  {name:"Ukraine",flag:"🇺🇦",animal:"Nightingale",bird:"White Stork",flower:"Sunflower",fruit:"Cherry",tree:"Willow"},
  {name:"United Arab Emirates",flag:"🇦🇪",animal:"Arabian Oryx",bird:"Falcon",flower:"—",fruit:"Date",tree:"Ghaf"},
  {name:"United Kingdom",flag:"🇬🇧",animal:"Lion",bird:"European Robin",flower:"Rose",fruit:"Apple",tree:"Oak"},
  {name:"United States",flag:"🇺🇸",animal:"American Bison",bird:"Bald Eagle",flower:"Rose",fruit:"Apple",tree:"Oak"},
  {name:"Uruguay",flag:"🇺🇾",animal:"—",bird:"Southern Lapwing",flower:"Ceibo",fruit:"Grape",tree:"Ombú"},
  {name:"Uzbekistan",flag:"🇺🇿",animal:"Snow Leopard",bird:"Huma Bird",flower:"—",fruit:"Melon",tree:"—"},
  {name:"Vanuatu",flag:"🇻🇺",animal:"Dugong",bird:"—",flower:"Hibiscus",fruit:"Coconut",tree:"—"},
  {name:"Vatican City",flag:"🇻🇦",animal:"—",bird:"—",flower:"—",fruit:"Olive",tree:"Olive"},
  {name:"Venezuela",flag:"🇻🇪",animal:"Capybara",bird:"Venezuelan Troupial",flower:"Orchid",fruit:"Mango",tree:"Araguaney"},
  {name:"Vietnam",flag:"🇻🇳",animal:"Water Buffalo",bird:"Red-crowned Crane",flower:"Lotus",fruit:"Dragon Fruit",tree:"Bamboo"},
  {name:"Yemen",flag:"🇾🇪",animal:"Arabian Leopard",bird:"—",flower:"Coffee Flower",fruit:"Date",tree:"Dragon Blood Tree"},
  {name:"Zambia",flag:"🇿🇲",animal:"African Fish Eagle",bird:"African Fish Eagle",flower:"Bougainvillea",fruit:"Mango",tree:"Mukwa"},
  {name:"Zimbabwe",flag:"🇿🇼",animal:"Sable Antelope",bird:"Zimbabwe Bird",flower:"Flame Lily",fruit:"Mazoe Orange",tree:"—"}
];

const countryStatesCountData = [
  {country:"Afghanistan", states:34, unionTerritories:0, total:34},
  {country:"Albania", states:12, unionTerritories:0, total:12},
  {country:"Algeria", states:58, unionTerritories:0, total:58},
  {country:"Andorra", states:7, unionTerritories:0, total:7},
  {country:"Angola", states:18, unionTerritories:0, total:18},
  {country:"Antigua and Barbuda", states:8, unionTerritories:0, total:8},
  {country:"Argentina", states:24, unionTerritories:0, total:24},
  {country:"Armenia", states:11, unionTerritories:0, total:11},
  {country:"Australia", states:8, unionTerritories:0, total:8},
  {country:"Austria", states:9, unionTerritories:0, total:9},
  {country:"Azerbaijan", states:84, unionTerritories:0, total:84},
  {country:"Bahamas", states:32, unionTerritories:0, total:32},
  {country:"Bahrain", states:4, unionTerritories:0, total:4},
  {country:"Bangladesh", states:8, unionTerritories:0, total:8},
  {country:"Barbados", states:11, unionTerritories:0, total:11},
  {country:"Belarus", states:7, unionTerritories:0, total:7},
  {country:"Belgium", states:11, unionTerritories:0, total:11},
  {country:"Belize", states:6, unionTerritories:0, total:6},
  {country:"Benin", states:12, unionTerritories:0, total:12},
  {country:"Bhutan", states:20, unionTerritories:0, total:20},
  {country:"Bolivia", states:9, unionTerritories:0, total:9},
  {country:"Bosnia and Herzegovina", states:12, unionTerritories:0, total:12},
  {country:"Botswana", states:17, unionTerritories:0, total:17},
  {country:"Brazil", states:27, unionTerritories:0, total:27},
  {country:"Brunei", states:4, unionTerritories:0, total:4},
  {country:"Bulgaria", states:28, unionTerritories:0, total:28},
  {country:"Burkina Faso", states:17, unionTerritories:0, total:17},
  {country:"Burundi", states:18, unionTerritories:0, total:18},
  {country:"Cabo Verde", states:22, unionTerritories:0, total:22},
  {country:"Cambodia", states:25, unionTerritories:0, total:25},
  {country:"Cameroon", states:10, unionTerritories:0, total:10},
  {country:"Canada", states:10, unionTerritories:3, total:13},
  {country:"Central African Republic", states:20, unionTerritories:0, total:20},
  {country:"Chad", states:23, unionTerritories:0, total:23},
  {country:"Chile", states:16, unionTerritories:0, total:16},
  {country:"China", states:32, unionTerritories:0, total:32},
  {country:"Colombia", states:33, unionTerritories:0, total:33},
  {country:"Comoros", states:3, unionTerritories:0, total:3},
  {country:"Costa Rica", states:7, unionTerritories:0, total:7},
  {country:"Côte d'Ivoire", states:33, unionTerritories:0, total:33},
  {country:"Croatia", states:21, unionTerritories:0, total:21},
  {country:"Cuba", states:16, unionTerritories:0, total:16},
  {country:"Cyprus", states:6, unionTerritories:0, total:6},
  {country:"Czechia", states:14, unionTerritories:0, total:14},
  {country:"Democratic Republic of the Congo", states:26, unionTerritories:0, total:26},
  {country:"Denmark", states:5, unionTerritories:0, total:5},
  {country:"Djibouti", states:6, unionTerritories:0, total:6},
  {country:"Dominica", states:10, unionTerritories:0, total:10},
  {country:"Dominican Republic", states:10, unionTerritories:0, total:10},
  {country:"Ecuador", states:24, unionTerritories:0, total:24},
  {country:"Egypt", states:27, unionTerritories:0, total:27},
  {country:"El Salvador", states:14, unionTerritories:0, total:14},
  {country:"Equatorial Guinea", states:7, unionTerritories:0, total:7},
  {country:"Eritrea", states:6, unionTerritories:0, total:6},
  {country:"Estonia", states:15, unionTerritories:0, total:15},
  {country:"Eswatini", states:4, unionTerritories:0, total:4},
  {country:"Ethiopia", states:15, unionTerritories:0, total:15},
  {country:"Fiji", states:4, unionTerritories:0, total:4},
  {country:"Finland", states:19, unionTerritories:0, total:19},
  {country:"France", states:13, unionTerritories:0, total:13},
  {country:"Gabon", states:9, unionTerritories:0, total:9},
  {country:"Gambia", states:8, unionTerritories:0, total:8},
  {country:"Georgia", states:13, unionTerritories:0, total:13},
  {country:"Germany", states:16, unionTerritories:0, total:16},
  {country:"Ghana", states:16, unionTerritories:0, total:16},
  {country:"Greece", states:14, unionTerritories:0, total:14},
  {country:"Greenland", states:5, unionTerritories:1, total:6},
  {country:"Grenada", states:8, unionTerritories:0, total:8},
  {country:"Guatemala", states:22, unionTerritories:0, total:22},
  {country:"Guinea", states:8, unionTerritories:0, total:8},
  {country:"Guinea-Bissau", states:9, unionTerritories:0, total:9},
  {country:"Guyana", states:10, unionTerritories:0, total:10},
  {country:"Haiti", states:10, unionTerritories:0, total:10},
  {country:"Honduras", states:18, unionTerritories:0, total:18},
  {country:"Hungary", states:20, unionTerritories:0, total:20},
  {country:"Iceland", states:8, unionTerritories:0, total:8},
  {country:"India", states:28, unionTerritories:8, total:36},
  {country:"Indonesia", states:34, unionTerritories:0, total:34},
  {country:"Iran", states:31, unionTerritories:0, total:31},
  {country:"Iraq", states:18, unionTerritories:0, total:18},
  {country:"Ireland", states:26, unionTerritories:0, total:26},
  {country:"Israel", states:6, unionTerritories:0, total:6},
  {country:"Italy", states:20, unionTerritories:0, total:20},
  {country:"Jamaica", states:14, unionTerritories:0, total:14},
  {country:"Japan", states:47, unionTerritories:0, total:47},
  {country:"Jordan", states:12, unionTerritories:0, total:12},
  {country:"Kazakhstan", states:16, unionTerritories:0, total:16},
  {country:"Kenya", states:47, unionTerritories:0, total:47},
  {country:"Kiribati", states:3, unionTerritories:0, total:3},
  {country:"Kuwait", states:6, unionTerritories:0, total:6},
  {country:"Kyrgyzstan", states:9, unionTerritories:0, total:9},
  {country:"Laos", states:18, unionTerritories:0, total:18},
  {country:"Latvia", states:43, unionTerritories:0, total:43},
  {country:"Lebanon", states:8, unionTerritories:0, total:8},
  {country:"Lesotho", states:10, unionTerritories:0, total:10},
  {country:"Liberia", states:15, unionTerritories:0, total:15},
  {country:"Libya", states:3, unionTerritories:0, total:3},
  {country:"Liechtenstein", states:11, unionTerritories:0, total:11},
  {country:"Lithuania", states:10, unionTerritories:0, total:10},
  {country:"Luxembourg", states:12, unionTerritories:0, total:12},
  {country:"Madagascar", states:22, unionTerritories:0, total:22},
  {country:"Malawi", states:3, unionTerritories:0, total:3},
  {country:"Malaysia", states:13, unionTerritories:3, total:16},
  {country:"Maldives", states:21, unionTerritories:0, total:21},
  {country:"Mali", states:20, unionTerritories:0, total:20},
  {country:"Malta", states:6, unionTerritories:0, total:6},
  {country:"Marshall Islands", states:25, unionTerritories:0, total:25},
  {country:"Mauritania", states:15, unionTerritories:0, total:15},
  {country:"Mauritius", states:12, unionTerritories:0, total:12},
  {country:"Mexico", states:32, unionTerritories:0, total:32},
  {country:"Micronesia", states:4, unionTerritories:0, total:4},
  {country:"Moldova", states:37, unionTerritories:0, total:37},
  {country:"Monaco", states:3, unionTerritories:0, total:3},
  {country:"Mongolia", states:22, unionTerritories:0, total:22},
  {country:"Montenegro", states:21, unionTerritories:0, total:21},
  {country:"Morocco", states:10, unionTerritories:0, total:10},
  {country:"Mozambique", states:11, unionTerritories:0, total:11},
  {country:"Myanmar", states:15, unionTerritories:0, total:15},
  {country:"Namibia", states:14, unionTerritories:0, total:14},
  {country:"Nauru", states:14, unionTerritories:0, total:14},
  {country:"Nepal", states:7, unionTerritories:0, total:7},
  {country:"Netherlands", states:12, unionTerritories:0, total:12},
  {country:"New Zealand", states:17, unionTerritories:0, total:17},
  {country:"Nicaragua", states:17, unionTerritories:0, total:17},
  {country:"Niger", states:8, unionTerritories:0, total:8},
  {country:"Nigeria", states:36, unionTerritories:1, total:37},
  {country:"North Korea", states:11, unionTerritories:0, total:11},
  {country:"North Macedonia", states:8, unionTerritories:0, total:8},
  {country:"Norway", states:12, unionTerritories:0, total:12},
  {country:"Oman", states:11, unionTerritories:0, total:11},
  {country:"Pakistan", states:4, unionTerritories:3, total:7},
  {country:"Palau", states:16, unionTerritories:0, total:16},
  {country:"Palestine", states:2, unionTerritories:0, total:2},
  {country:"Panama", states:13, unionTerritories:0, total:13},
  {country:"Papua New Guinea", states:22, unionTerritories:0, total:22},
  {country:"Paraguay", states:18, unionTerritories:0, total:18},
  {country:"Peru", states:25, unionTerritories:0, total:25},
  {country:"Philippines", states:17, unionTerritories:0, total:17},
  {country:"Poland", states:16, unionTerritories:0, total:16},
  {country:"Portugal", states:20, unionTerritories:0, total:20},
  {country:"Qatar", states:8, unionTerritories:0, total:8},
  {country:"Republic of the Congo", states:12, unionTerritories:0, total:12},
  {country:"Romania", states:8, unionTerritories:0, total:8},
  {country:"Russia", states:83, unionTerritories:0, total:83},
  {country:"Rwanda", states:5, unionTerritories:0, total:5},
  {country:"Saint Kitts and Nevis", states:14, unionTerritories:0, total:14},
  {country:"Saint Lucia", states:10, unionTerritories:0, total:10},
  {country:"Saint Vincent and the Grenadines", states:6, unionTerritories:0, total:6},
  {country:"Samoa", states:11, unionTerritories:0, total:11},
  {country:"San Marino", states:9, unionTerritories:0, total:9},
  {country:"São Tomé and Príncipe", states:2, unionTerritories:0, total:2},
  {country:"Saudi Arabia", states:13, unionTerritories:0, total:13},
  {country:"Senegal", states:14, unionTerritories:0, total:14},
  {country:"Serbia", states:25, unionTerritories:0, total:25},
  {country:"Seychelles", states:4, unionTerritories:0, total:4},
  {country:"Sierra Leone", states:5, unionTerritories:0, total:5},
  {country:"Singapore", states:5, unionTerritories:0, total:5},
  {country:"Slovakia", states:8, unionTerritories:0, total:8},
  {country:"Slovenia", states:12, unionTerritories:0, total:12},
  {country:"Solomon Islands", states:10, unionTerritories:0, total:10},
  {country:"Somalia", states:18, unionTerritories:0, total:18},
  {country:"South Africa", states:9, unionTerritories:0, total:9},
  {country:"South Korea", states:17, unionTerritories:0, total:17},
  {country:"South Sudan", states:10, unionTerritories:0, total:10},
  {country:"Spain", states:19, unionTerritories:0, total:19},
  {country:"Sri Lanka", states:9, unionTerritories:0, total:9},
  {country:"Sudan", states:19, unionTerritories:0, total:19},
  {country:"Suriname", states:10, unionTerritories:0, total:10},
  {country:"Sweden", states:21, unionTerritories:0, total:21},
  {country:"Switzerland", states:26, unionTerritories:0, total:26},
  {country:"Syria", states:14, unionTerritories:0, total:14},
  {country:"Tajikistan", states:5, unionTerritories:0, total:5},
  {country:"Tanzania", states:31, unionTerritories:0, total:31},
  {country:"Thailand", states:77, unionTerritories:0, total:77},
  {country:"Timor-Leste", states:13, unionTerritories:0, total:13},
  {country:"Togo", states:5, unionTerritories:0, total:5},
  {country:"Tonga", states:5, unionTerritories:0, total:5},
  {country:"Trinidad and Tobago", states:15, unionTerritories:0, total:15},
  {country:"Tunisia", states:6, unionTerritories:0, total:6},
  {country:"Türkiye", states:81, unionTerritories:0, total:81},
  {country:"Turkmenistan", states:6, unionTerritories:0, total:6},
  {country:"Tuvalu", states:8, unionTerritories:0, total:8},
  {country:"Uganda", states:4, unionTerritories:0, total:4},
  {country:"Ukraine", states:27, unionTerritories:0, total:27},
  {country:"United Arab Emirates", states:7, unionTerritories:0, total:7},
  {country:"United Kingdom", states:4, unionTerritories:0, total:4},
  {country:"United States", states:50, unionTerritories:1, total:51},
  {country:"Uruguay", states:19, unionTerritories:0, total:19},
  {country:"Uzbekistan", states:14, unionTerritories:0, total:14},
  {country:"Vanuatu", states:6, unionTerritories:0, total:6},
  {country:"Vatican City", states:1, unionTerritories:0, total:1},
  {country:"Venezuela", states:24, unionTerritories:0, total:24},
  {country:"Vietnam", states:34, unionTerritories:0, total:34},
  {country:"Yemen", states:22, unionTerritories:0, total:22},
  {country:"Zambia", states:10, unionTerritories:0, total:10},
  {country:"Zimbabwe", states:10, unionTerritories:0, total:10}
];

// Initialize HTML elements with water bodies
myGlobe
  .htmlElementsData(waterBodies)
  .htmlElement(d => {
    const el = document.createElement('div');
    if (d.type === 'water') {
      el.innerHTML = `
        <div style="
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 500;
          letter-spacing: 2px;
          pointer-events: none;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          text-shadow: 0 1px 4px rgba(0,0,0,0.9);
          font-style: italic;
        ">
          ${d.name}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div style="
          color: #040d21; 
          background: #C89B5B; 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-weight: bold; 
          font-size: 14px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          border: 2px solid white;
          pointer-events: none;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        ">
          📍 ${d.name}
        </div>`;
    }
    return el;
  });

// Fetch data and populate
fetch(worldGeoJsonUrl)
  .then(res => res.json())
  .then(countries => {
    geoData = countries.features;
    myGlobe.polygonsData(countries.features);
  });

let mledozeCountries = [];
fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json')
  .then(res => res.json())
  .then(data => {
    mledozeCountries = data;
  });

// Auto-rotate
myGlobe.controls().autoRotate = true;
myGlobe.controls().autoRotateSpeed = 0.5;
myGlobe.controls().enableDamping = true;
myGlobe.controls().dampingFactor = 0.05;

// Initial camera position
myGlobe.pointOfView({ altitude: 2.2 }, 0);

// Handle window resize
window.addEventListener('resize', () => {
  myGlobe.width(window.innerWidth - 400); // Adjust for right panel
  myGlobe.height(window.innerHeight);
});

// Initially set correct width
myGlobe.width(window.innerWidth - 400);

// Add Right Panel UI
const rightPanel = document.createElement('div');
rightPanel.className = 'right-panel';
rightPanel.innerHTML = `
  <div class="search-box">
    <input type="text" id="searchInput" class="search-input" placeholder="Search country (e.g., India)..." />
    <button id="searchBtn" class="search-btn">Search</button>
  </div>
  <div id="infoContent" class="info-content" style="display: none;">
    <h2 id="countryTitle" style="margin-top: 0; color: white;"></h2>
    <div id="countryDetails"></div>
  </div>
`;
document.body.appendChild(rightPanel);

// Category List
const categories = [
  { icon: '📍', title: 'Location & Geography', key: 'location' },
  { icon: '🗺️', title: 'Map & Borders', key: 'borders' },
  { icon: '📌', title: 'States & Provinces', key: 'states' },
  { icon: '🏙️', title: 'Capital City', key: 'capital' },
  { icon: '🏘️', title: 'Major Cities', key: 'cities' },
  { icon: '👥', title: 'Population', key: 'population' },
  { icon: '🗣️', title: 'Languages', key: 'languages' },
  { icon: '💰', title: 'Currency', key: 'currency' },
  { icon: '🏛️', title: 'Government & Politics', key: 'government' },
  { icon: '📅', title: 'History & Independence', key: 'history' },
  { icon: '🌦️', title: 'Climate & Weather', key: 'climate' },
  { icon: '🏔️', title: 'Landforms & Nature', key: 'landforms' },
  { icon: '🌊', title: 'Rivers, Lakes & Seas', key: 'water' },
  { icon: '🐅', title: 'National Animal', key: 'national_animal' },
  { icon: '🦅', title: 'National Bird', key: 'national_bird' },
  { icon: '🌺', title: 'National Flower', key: 'national_flower' },
  { icon: '🍎', title: 'National Fruit', key: 'national_fruit' },
  { icon: '🌳', title: 'National Tree', key: 'national_tree' },
  { icon: '🐘', title: 'Wildlife & Biodiversity', key: 'wildlife' },
  { icon: '🌳', title: 'National Parks', key: 'parks' },
  { icon: '🍛', title: 'Food & Cuisine', key: 'food' },
  { icon: '🎭', title: 'Culture & Traditions', key: 'culture' },
  { icon: '🎉', title: 'Festivals & Holidays', key: 'festivals' },
  { icon: '👗', title: 'Traditional Dress', key: 'dress' },
  { icon: '🎵', title: 'Music & Dance', key: 'music' },
  { icon: '🕌', title: 'Religion & Beliefs', key: 'religion' },
  { icon: '🎓', title: 'Education', key: 'education' },
  { icon: '🏥', title: 'Healthcare', key: 'healthcare' },
  { icon: '💼', title: 'Economy', key: 'economy' },
  { icon: '🏭', title: 'Major Industries', key: 'industries' },
  { icon: '🌾', title: 'Agriculture', key: 'agriculture' },
  { icon: '🚢', title: 'Trade & Exports', key: 'trade' },
  { icon: '💻', title: 'Technology & Innovation', key: 'tech' },
  { icon: '⚽', title: 'Sports', key: 'sports' },
  { icon: '🏆', title: 'Famous People', key: 'people' },
  { icon: '🏛️', title: 'Famous Landmarks', key: 'landmarks' },
  { icon: '🧳', title: 'Tourism', key: 'tourism' },
  { icon: '✈️', title: 'Travel Information', key: 'travel' },
  { icon: '🚆', title: 'Transportation', key: 'transportation' },
  { icon: '🕐', title: 'Time Zone', key: 'timezone' },
  { icon: '📞', title: 'Country & Internet Codes', key: 'codes' },
  { icon: '🚨', title: 'Emergency Numbers', key: 'emergency' },
  { icon: '🛂', title: 'Visa Information', key: 'visa' },
  { icon: '💡', title: 'Interesting Facts', key: 'facts' },
  { icon: '📊', title: 'Quick Statistics', key: 'stats' }
];

// Logic to fetch and populate
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const infoContent = document.getElementById('infoContent');
const countryTitle = document.getElementById('countryTitle');
const countryDetails = document.getElementById('countryDetails');

async function searchCountry(query) {
  if (!query) return;
  infoContent.style.display = 'block';
  countryTitle.innerText = 'Searching...';
  countryDetails.innerHTML = '';
  
  try {
    const q = query.toLowerCase().trim();
    
    // 1. Fetch Dave Garvey API for country facts
    const resGarvey = await fetch('https://countries-api.davegarvey.workers.dev/countries');
    if (!resGarvey.ok) throw new Error('API failed');
    const allCountries = await resGarvey.json();
    
    // Support exact match or partial match
    let country = allCountries.find(c => c.name.toLowerCase() === q);
    if (!country) {
      country = allCountries.find(c => c.name.toLowerCase().includes(q) || (c.alpha3Code && c.alpha3Code.toLowerCase() === q));
    }
    
    // Fallback for custom added countries like Greenland
    if (!country) {
      const customSymbol = nationalSymbolsData.find(s => s.name.toLowerCase().includes(q));
      if (customSymbol && customSymbol.name.toLowerCase() === 'greenland') {
        country = {
          name: 'Greenland',
          flag: '🇬🇱',
          alpha3Code: 'GRL',
          code: 'GL',
          region: 'Americas',
          subregion: 'Northern America',
          capital: 'Nuuk',
          population: 56660,
          languages: ['Greenlandic', 'Danish'],
          currency: 'Danish krone',
          callingCode: '299'
        };
      }
    }

    if (!country) throw new Error('Country not found');
    
    // 2. Fetch Wikipedia for coordinates and description
    let latlng = null;
    let description = '';
    let thumbnail = '';
    try {
      const resWiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country.name)}`);
      if (resWiki.ok) {
        const wikiData = await resWiki.json();
        if (wikiData.coordinates) {
          latlng = [wikiData.coordinates.lat, wikiData.coordinates.lon];
        }
        if (wikiData.extract) {
          description = wikiData.extract;
        }
        if (wikiData.thumbnail) {
          thumbnail = wikiData.thumbnail.source;
        }
      }
    } catch(e) {}

    // 3. Fetch States from countriesnow API
    let statesList = 'Data not available in free API';
    try {
      const resStates = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: country.name })
      });
      let stateNames = [];
      if (resStates.ok) {
        const statesData = await resStates.json();
        if (statesData && statesData.data && statesData.data.states && statesData.data.states.length > 0) {
          stateNames = statesData.data.states.map(s => s.name);
        }
      }
      
      const countryCounts = countryStatesCountData.find(c => c.country.toLowerCase() === country.name.toLowerCase());
      
      if (countryCounts || stateNames.length > 0) {
        let totalStr = '';
        if (countryCounts) {
          totalStr = `<strong>Total: ${countryCounts.total}</strong>`;
          if (countryCounts.unionTerritories > 0) {
            totalStr += ` <span style="font-size: 0.9em; opacity: 0.9;">(${countryCounts.states} States, ${countryCounts.unionTerritories} Union Territories)</span>`;
          }
        } else {
          totalStr = `<strong>Total: ${stateNames.length}</strong>`;
        }
        
        let namesStr = stateNames.length > 0 ? `<br><span style="font-size: 0.9em; opacity: 0.8; display: inline-block; margin-top: 6px;">${stateNames.join(', ')}</span>` : '';
        statesList = totalStr + namesStr;
      }
    } catch(e) {}
    
    // Position globe to country
    let targetLat = null;
    let targetLng = null;
    
    searchedFeature = geoData.find(f => f.properties.ADMIN.toLowerCase() === country.name.toLowerCase() || f.properties.ISO_A2 === country.code) || null;
    
    // Force a color update
    myGlobe
      .polygonAltitude(d => (d === searchedFeature) ? 0.01 : 0.002)
      .polygonCapColor(d => d === searchedFeature ? 'rgba(200, 155, 91, 0.5)' : 'rgba(0, 0, 0, 0)');

    if (latlng) {
      targetLat = latlng[0];
      targetLng = latlng[1];
    } else {
      // fallback to geojson data if we can find it
      if (searchedFeature && searchedFeature.bbox) {
         targetLat = (searchedFeature.bbox[1] + searchedFeature.bbox[3]) / 2;
         targetLng = (searchedFeature.bbox[0] + searchedFeature.bbox[2]) / 2;
      }
    }

    if (targetLat !== null && targetLng !== null) {
      myGlobe.pointOfView({ lat: targetLat, lng: targetLng, altitude: 1.5 }, 1000);
      
      // Stop the earth rotation
      myGlobe.controls().autoRotate = false;
      
      // Add a pin and label on the globe along with water bodies
      currentSearchElements = [{ lat: targetLat, lng: targetLng, name: country.name, type: 'pin' }];
      myGlobe.htmlElementsData([...waterBodies, ...currentSearchElements]);
    }
    
    countryTitle.innerHTML = `${country.name} ${country.flag || ''}`;
    
    const symbolInfo = nationalSymbolsData.find(s => s.name.toLowerCase() === country.name.toLowerCase());
    
    let bordersList = 'Data not available in free API';
    if (mledozeCountries.length > 0 && country.alpha3Code) {
      const mlCountry = mledozeCountries.find(c => c.cca3 === country.alpha3Code);
      if (mlCountry && mlCountry.borders && mlCountry.borders.length > 0) {
        const borderNames = mlCountry.borders.map(code => {
          const bCountry = mledozeCountries.find(c => c.cca3 === code);
          return bCountry ? bCountry.name.common : code;
        });
        bordersList = borderNames.join(', ');
      } else if (mlCountry) {
        bordersList = 'None (Island or no land borders)';
      }
    }
    
    const mappedData = {
      location: (country.region || '') + (country.subregion ? ', ' + country.subregion : ''),
      states: statesList,
      borders: bordersList,
      capital: country.capital || 'N/A',
      cities: 'Data not available in free API',
      population: country.population ? country.population.toLocaleString() : 'N/A',
      languages: country.languages && country.languages.length ? country.languages.join(', ') : 'N/A',
      currency: country.currency || 'N/A',
      government: 'Data not available in free API',
      history: 'Data not available in free API',
      climate: 'Data not available in free API',
      landforms: 'Data not available in free API',
      water: 'Data not available in free API',
      national_animal: symbolInfo && symbolInfo.animal !== '—' ? symbolInfo.animal : 'Information not available',
      national_bird: symbolInfo && symbolInfo.bird !== '—' ? symbolInfo.bird : 'Information not available',
      national_flower: symbolInfo && symbolInfo.flower !== '—' ? symbolInfo.flower : 'Information not available',
      national_fruit: symbolInfo && symbolInfo.fruit !== '—' ? symbolInfo.fruit : 'Information not available',
      national_tree: symbolInfo && symbolInfo.tree !== '—' ? symbolInfo.tree : 'Information not available',
      wildlife: 'Data not available in free API',
      parks: 'Data not available in free API',
      food: 'Data not available in free API',
      culture: 'Data not available in free API',
      festivals: 'Data not available in free API',
      dress: 'Data not available in free API',
      music: 'Data not available in free API',
      religion: 'Data not available in free API',
      education: 'Data not available in free API',
      healthcare: 'Data not available in free API',
      economy: 'Data not available in free API',
      industries: 'Data not available in free API',
      agriculture: 'Data not available in free API',
      trade: 'Data not available in free API',
      tech: 'Data not available in free API',
      sports: 'Data not available in free API',
      people: 'Data not available in free API',
      landmarks: 'Data not available in free API',
      tourism: 'Data not available in free API',
      travel: 'Data not available in free API',
      transportation: 'Data not available in free API',
      timezone: 'Data not available in free API',
      codes: `Dial: ${country.callingCode || 'N/A'}, ISO Code: ${country.alpha3Code || 'N/A'}`,
      emergency: 'Data not available in free API',
      visa: 'Data not available in free API',
      facts: description ? `Wikipedia: ${description}` : 'Data not available in free API',
      stats: `Population: ${country.population ? country.population.toLocaleString() : 'N/A'}`
    };
    
    // Generate HTML for all categories
    let html = '';
    
    if (thumbnail) {
       html += `<img src="${thumbnail}" alt="${country.name}" style="max-width: 100%; max-height: 150px; border-radius: 4px; margin-bottom: 15px;">`;
    }
    
    categories.forEach(cat => {
      let value = mappedData[cat.key];
      
      // If data is not available, don't show the category at all
      if (typeof value === 'string' && value.includes('Data not available')) {
        return; // Skip this category
      }
      
      html += `
        <div class="info-item">
          <h3>${cat.icon} ${cat.title}</h3>
          <p>${value}</p>
        </div>
      `;
    });
    
    countryDetails.innerHTML = html;
    
  } catch (err) {
    countryTitle.innerText = 'Not Found';
    countryDetails.innerHTML = `<p style="color: #ff6b6b;">Could not find a country matching "${query}".</p>`;
  }
}

searchBtn.addEventListener('click', () => searchCountry(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchCountry(searchInput.value);
});

