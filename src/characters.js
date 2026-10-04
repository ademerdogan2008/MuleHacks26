// Transparent Riot character art; asset provenance is in public/images/characters/sources.json.
export const characters = [
  {
    "name": "Jett",
    "game": "Valorant",
    "image": "/images/characters/jett.png"
  },
  {
    "name": "Ahri",
    "game": "League of Legends",
    "image": "/images/characters/ahri.png"
  },
  {
    "name": "Reyna",
    "game": "Valorant",
    "image": "/images/characters/reyna.png"
  },
  {
    "name": "Jinx",
    "game": "League of Legends",
    "image": "/images/characters/jinx.png"
  },
  {
    "name": "Sage",
    "game": "Valorant",
    "image": "/images/characters/sage.png"
  },
  {
    "name": "Yasuo",
    "game": "League of Legends",
    "image": "/images/characters/yasuo.png"
  },
  {
    "name": "Omen",
    "game": "Valorant",
    "image": "/images/characters/omen.png"
  },
  {
    "name": "Lux",
    "game": "League of Legends",
    "image": "/images/characters/lux.png"
  },
  {
    "name": "Raze",
    "game": "Valorant",
    "image": "/images/characters/raze.png"
  },
  {
    "name": "Akali",
    "game": "League of Legends",
    "image": "/images/characters/akali.png"
  },
  {
    "name": "Sova",
    "game": "Valorant",
    "image": "/images/characters/sova.png"
  },
  {
    "name": "Caitlyn",
    "game": "League of Legends",
    "image": "/images/characters/caitlyn.png"
  },
  {
    "name": "Killjoy",
    "game": "Valorant",
    "image": "/images/characters/killjoy.png"
  },
  {
    "name": "Ezreal",
    "game": "League of Legends",
    "image": "/images/characters/ezreal.png"
  },
  {
    "name": "Viper",
    "game": "Valorant",
    "image": "/images/characters/viper.png"
  },
  {
    "name": "Lee Sin",
    "game": "League of Legends",
    "image": "/images/characters/lee-sin.png"
  },
  {
    "name": "Cypher",
    "game": "Valorant",
    "image": "/images/characters/cypher.png"
  },
  {
    "name": "Miss Fortune",
    "game": "League of Legends",
    "image": "/images/characters/miss-fortune.png"
  },
  {
    "name": "Phoenix",
    "game": "Valorant",
    "image": "/images/characters/phoenix.png"
  },
  {
    "name": "Ashe",
    "game": "League of Legends",
    "image": "/images/characters/ashe.png"
  },
  {
    "name": "Yoru",
    "game": "Valorant",
    "image": "/images/characters/yoru.png"
  },
  {
    "name": "Zed",
    "game": "League of Legends",
    "image": "/images/characters/zed.png"
  },
  {
    "name": "Neon",
    "game": "Valorant",
    "image": "/images/characters/neon.png"
  },
  {
    "name": "Yone",
    "game": "League of Legends",
    "image": "/images/characters/yone.png"
  }
];

// Keep unique character backgrounds separate from each player's avatar.
export const playerImages = characters.map((character, index) => {
  const avatar = characters[(index + 1) % characters.length];
  return {
    backgroundImage: character.image,
    backgroundCharacter: character.name,
    backgroundGame: character.game,
    ...(index < 20 && index % 2 === 0
      ? {image: `/images/profiles/reference-${String(index / 2 + 1).padStart(2, '0')}.png`}
      : {image: avatar.image, character: avatar.name, characterGame: avatar.game})
  };
});
