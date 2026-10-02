import React from 'react';
import {
  Acorn, Airplane, Alien, Anchor, Avocado, Balloon, Bicycle, Bird, BookOpen, Bookmark, Books, Bug,
  Butterfly, Cactus, Cake, Calendar, Camera, Campfire, Car, Carrot, CastleTurret, Cat, Cherries, Clock,
  Cloud, Clover, Coffee, Compass, Confetti, Cookie, Cow, Crown, Diamond, Dog, Drop, Eraser, FilmStrip,
  Fire, Fish, Flower, FlowerLotus, FlowerTulip, Ghost, Gift, Globe, Guitar, Heart, Highlighter, Horse,
  House, IceCream, Image, Island, Leaf, Lightbulb, Lighthouse, Lightning, MagicWand, MaskHappy, Moon,
  MoonStars, Mountains, MusicNotes, Orange, PaintBrush, PaintBrushBroad, PaintBucket, Palette, PawPrint,
  Pen, PenNib, PencilSimple, Pinwheel, Pizza, Planet, Plant, Popcorn, PuzzlePiece, Rabbit, Rainbow, Robot,
  Rocket, Ruler, Sailboat, Scissors, Scribble, Shapes, Smiley, Snowflake, Sparkle, Star, Sticker, Sun,
  Swatches, Tent, Tree, TreeEvergreen, TreePalm, Trophy, Waves, YoutubeLogo,
} from '@phosphor-icons/react';

export const TAG_ICON_GROUPS = [
  {
    label: 'Art',
    icons: {
      palette: Palette, 'paint-brush': PaintBrush, 'paint-roller': PaintBrushBroad, 'paint-bucket': PaintBucket,
      pencil: PencilSimple, pen: Pen, 'pen-nib': PenNib, highlighter: Highlighter, eraser: Eraser,
      scribble: Scribble, swatches: Swatches, drop: Drop, ruler: Ruler, scissors: Scissors, sticker: Sticker,
      shapes: Shapes,
    },
  },
  {
    label: 'Nature',
    icons: {
      flower: Flower, lotus: FlowerLotus, tulip: FlowerTulip, leaf: Leaf, tree: Tree, evergreen: TreeEvergreen,
      palm: TreePalm, plant: Plant, cactus: Cactus, clover: Clover, acorn: Acorn, mountains: Mountains,
      waves: Waves, island: Island, sun: Sun, moon: Moon, 'moon-stars': MoonStars, cloud: Cloud,
      rainbow: Rainbow, snowflake: Snowflake, lightning: Lightning, fire: Fire,
    },
  },
  {
    label: 'Animals',
    icons: {
      butterfly: Butterfly, bird: Bird, cat: Cat, dog: Dog, fish: Fish, rabbit: Rabbit, horse: Horse,
      cow: Cow, 'paw-print': PawPrint, bug: Bug,
    },
  },
  {
    label: 'Food',
    icons: {
      cake: Cake, coffee: Coffee, 'ice-cream': IceCream, cookie: Cookie, pizza: Pizza, cherries: Cherries,
      carrot: Carrot, orange: Orange, avocado: Avocado, popcorn: Popcorn,
    },
  },
  {
    label: 'Fun',
    icons: {
      star: Star, heart: Heart, sparkle: Sparkle, smiley: Smiley, ghost: Ghost, alien: Alien, robot: Robot,
      crown: Crown, diamond: Diamond, gift: Gift, balloon: Balloon, confetti: Confetti, 'magic-wand': MagicWand,
      puzzle: PuzzlePiece, pinwheel: Pinwheel, trophy: Trophy, mask: MaskHappy, music: MusicNotes, guitar: Guitar,
    },
  },
  {
    label: 'Places',
    icons: {
      house: House, castle: CastleTurret, tent: Tent, campfire: Campfire, lighthouse: Lighthouse,
      rocket: Rocket, planet: Planet, airplane: Airplane, sailboat: Sailboat, anchor: Anchor,
      bicycle: Bicycle, car: Car, globe: Globe, compass: Compass,
    },
  },
  {
    label: 'Media',
    icons: {
      'book-open': BookOpen, books: Books, camera: Camera, image: Image, film: FilmStrip, youtube: YoutubeLogo,
      lightbulb: Lightbulb, bookmark: Bookmark, calendar: Calendar, clock: Clock,
    },
  },
];

const TAG_ICONS = Object.assign({}, ...TAG_ICON_GROUPS.map(group => group.icons));

const TagIcon = ({ icon, size = 16, className = '', color = '#ea3663' }) => {
  const Icon = icon ? TAG_ICONS[icon] : null;
  if (!Icon) return null;
  return <Icon size={size} weight="duotone" color={color} className={`flex-shrink-0 ${className}`} aria-hidden="true" />;
};

export default TagIcon;
