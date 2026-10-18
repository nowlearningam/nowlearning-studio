// The 30 launch ideas. Each line: series | template | tool | hook | use it for | cost.
// Series is also the colour template. Loading an idea fills the hook and the Now Learning Card; add the steps and screenshots.
const RAW = `
Apps|howto|Citymapper|New city? Not sure which bus or train to take?|Public transport in a new city|Free (paid tier optional)
Apps|howto|Moovit|Which bus goes where in your own city?|Local bus and metro routes|Free (check city coverage)
Apps|quick|Google Lens|Point your camera at anything to find out what it is|Identify plants and products|Free
Tricks|howto|Google Lens|Copy text from a photo and translate it|Retyping printed text|Free
Apps|howto|Google Translate|Read any menu with your camera|Menus, signs and labels abroad|Free
Apps|howto|Google Translate|Talk to someone who speaks another language|Two-way conversations|Free
Apps|howto|Google Maps|No internet? Save the map first|Offline navigation|Free
Tricks|quick|Google Maps|Let someone follow your trip live|Sharing live location and ETA|Free
Apps|howto|Google Maps|Find toilets, chargers and ATMs on your route|Services along a journey|Free
Tricks|howto|Phone scanner|Scan any paper into a clean PDF|Documents on your phone|Free
Apps|howto|DigiLocker|Keep your ID documents safely on your phone|Digital documents|Free
Tricks|quick|AirDrop / Quick Share|Send big files to a nearby phone in seconds|Fast local file transfer|Free
Websites|howto|Google Drive / WeTransfer|Send a huge file with one link|Files too big for email|Free (limits apply)
Websites|howto|iLovePDF / Smallpdf|Shrink a PDF below the upload limit|Compressing PDFs|Free (limits apply)
Apps|howto|Splitwise|Split trip and flat expenses fairly|Shared expenses|Free (paid tier optional)
Websites|howto|Canva / Photoroom|Remove a photo background in one tap|Passport and product photos|Free (paid tier optional)
AI|howto|AI assistant|Turn a 40-page PDF into one page|Summarising long documents|Free (paid tier optional)
AI|howto|AI assistant|Confusing email? Ask AI to explain it|Understanding emails and letters|Free (paid tier optional)
AI|howto|AI assistant|Turn rough notes into a polite message|Writing to a boss, landlord or school|Free (paid tier optional)
AI|howto|Gamma / Canva|Make a presentation from one topic|Building slides fast|Free (paid tier optional)
AI|quick|AI voice mode|Practise English or an interview by voice|Speaking practice|Free (paid tier optional)
AI|howto|AI assistant + Google Maps|Plan a trip with AI, then check it on a map|Trip planning|Free (paid tier optional)
AI|howto|AI assistant|Photo of handwritten notes to typed text|Digitising notes|Free (paid tier optional)
Tricks|quick|WhatsApp|Use “Message yourself” as a notebook|Notes and links in one chat|Free
Tricks|howto|WhatsApp|Three privacy settings to change today|Privacy|Free
Tricks|howto|Google Search|Search like a pro with three symbols|Better search results|Free
Tricks|quick|Circle to Search|Circle anything on screen to search it|Searching without typing|Free (supported Android phones)
Tricks|quick|Browser reading mode|Make a long article easy to read|Clean reading and page translation|Free
Tricks|quick|Phone QR share|Share Wi-Fi without typing the password|Guest Wi-Fi|Free
Tricks|howto|Find Hub / Find My|Set up find-my-phone before you lose it|Locating a lost phone|Free
`
export const IDEAS = RAW.trim().split('\n').map((l, i) => {
  const [series, template, app, hook, useFor, cost] = l.split('|')
  return { id: i + 1, series, template, app, hook, useFor, cost }
})
