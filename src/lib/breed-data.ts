export const BREED_LIST = [
  "Affenpinscher","Afghan Hound","Airedale Terrier","Akita","Alaskan Malamute",
  "American Eskimo","American Foxhound","American Staffordshire Terrier","American Water Spaniel",
  "Anatolian Sheepdog","Australian Cattle Dog","Australian Shepherd","Australian Terrier",
  "Basenji","Basset Hound","Beagle","Bearded Collie","Beauceron","Bedlington Terrier",
  "Belgian Malinois","Belgian Sheepdog","Belgian Tervuren","Bernese Mountain Dog","Bichon Frise",
  "Black and Tan Coonhound","Black Russian Terrier","Bloodhound","Border Collie","Border Terrier",
  "Borzoi","Boston Terrier","Bouvier des Flandres","Boxer","Briard","Brittany","Brussels Griffon",
  "Bulldog","Bull Terrier","Bullmastiff","Cairn Terrier","Canaan Dog","Cardigan Welsh Corgi",
  "Cavalier King Charles Spaniel","Chesapeake Bay Retriever","Chihuahua","Chinese Crested",
  "Chinese Shar Pei","Chow Chow","Clumber Spaniel","Cocker Spaniel-American","Cocker Spaniel-English",
  "Collie (Rough)","Collie (Smooth)","Coton de Tulear","Curly Coated Retriever","Dachshund",
  "Dalmatian","Dandie Dinmont Terrier","Doberman Pinscher","English Foxhound","English Setter",
  "English Springer Spaniel","English Toy Spaniel","Field Spaniel","Finnish Spitz",
  "Flat Coated Retriever","Fox Terrier – Smooth","Fox Terrier – Wirehair","French Bulldog",
  "German Pinscher","German Shepherd Dog","German Shorthaired Pointer","German Wirehaired Pointer",
  "Giant Schnauzer","Glen Imaal Terrier","Golden Retriever","Gordon Setter","Great Dane",
  "Great Pyrenees","Great Swiss Mountain Dog","Greyhound","Harrier","Ibizan Hound","Irish Setter",
  "Irish Terrier","Irish Water Spaniel","Irish Wolfhound","Italian Greyhound","Jack Russell Terrier",
  "Japanese Chin","Keeshond","Kerry Blue Terrier","Komondor","Kuvasz","Labrador Retriever",
  "Lakeland Terrier","Maltese","Manchester Terrier (Standard)","Manchester Terrier (Toy)","Mastiff",
  "Neopolitan Mastiff","Newfoundland","Norwegian Elkhound","Nova Scotia Duck Tolling Retriever",
  "Old English Sheepdog (Bobtail)","Otter Hound","Papillon","Petit Basset Griffon Vendeen",
  "Pharaoh Hound","Plott Hound","Pointer","Polish Lowland Sheepdog","Pomeranian",
  "Poodle Miniature","Poodle Standard","Poodle Toy","Portuguese Water Dog","Pug","Puli",
  "Redbone Coonhound","Rhodesian Ridgeback","Rottweiler","Saint Bernard","Saluki","Samoyed",
  "Schipperke","Scottish Deerhound","Scottish Terrier","Sealyham Terrier",
  "Shetland Sheepdog (Sheltie)","Shiba Inu","Shih Tzu","Siberian Husky","Silky Terrier",
  "Skye Terrier","Soft-Coated Wheaten Terrier","Spinone Italiano","Staffordshire Bull Terrier",
  "Standard Schnauzer","Sussex Spaniel","Tibetan Mastiff","Tibetan Spaniel","Tibetan Terrier",
  "Toy Fox Terrier","Vizsla","Weimaraner","Welsh Springer Spaniel","Welsh Terrier",
  "West Highland White Terrier","Whippet","Wirehaired Pointing Griffon","Yorkshire Terrier",
];

export const BREED_ALIASES: Record<string, string> = {
  "frenchie": "French Bulldog",
  "gsd": "German Shepherd Dog",
  "golden": "Golden Retriever",
  "lab": "Labrador Retriever",
  "yorkie": "Yorkshire Terrier",
  "staffy": "Staffordshire Bull Terrier",
  "sheltie": "Shetland Sheepdog (Sheltie)",
  "westie": "West Highland White Terrier",
};

export function searchBreeds(query: string): string[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();

  // Check alias first
  const aliasMatch = BREED_ALIASES[q];
  if (aliasMatch) {
    return [aliasMatch, ...BREED_LIST.filter(b => b !== aliasMatch).filter(b => b.toLowerCase().includes(q))];
  }

  const startsWith: string[] = [];
  const contains: string[] = [];

  for (const breed of BREED_LIST) {
    const lower = breed.toLowerCase();
    if (lower.startsWith(q)) startsWith.push(breed);
    else if (lower.includes(q)) contains.push(breed);
  }

  // Also check aliases for partial matches
  for (const [alias, fullName] of Object.entries(BREED_ALIASES)) {
    if (alias.startsWith(q) && !startsWith.includes(fullName) && !contains.includes(fullName)) {
      startsWith.unshift(fullName);
    }
  }

  return [...startsWith, ...contains].slice(0, 8);
}
