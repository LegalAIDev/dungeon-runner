/* ============================================================================
   content.js — ADMIN-EDITABLE QUIZ CONTENT

   This is the only file you need to change to customise the game for your
   store or classroom.  Everything else is game-engine code that you can
   leave alone.

   HOW TO EDIT
   -----------
   1. Change storeTitle, labTitle, labTabIcon and labSubtitle at the top.
   2. Add, remove or edit topics in the topics array.
   3. For each topic, add as many questions as you like in its questions array.

   QUESTION FORMAT
   ---------------
   Each question looks like this:

     {
       q:       'The question text shown on screen.',
       answer:  'Correct Answer',        // must exactly match one entry in choices
       choices: ['Choice A', 'Choice B', 'Correct Answer', 'Choice D'],
       hint:    'Optional hint text.'    // shown after a wrong answer (can be '')
     }

   Rules:
     • choices must contain exactly 4 strings.
     • answer must be one of those 4 strings (exact match, same capitalisation).
     • hint is optional — leave it as '' if you don't want one.

   TOPIC FORMAT
   ------------
   Each topic looks like this:

     {
       id:             'uniqueId',       // no spaces, used internally
       name:           'Display Name',
       icon:           '🔬',             // emoji shown next to the topic name
       starsPerCorrect: 3,               // ⭐ stars awarded per correct answer
       timerSeconds:   15,               // seconds before a question times out
       color:          0x36c98d,         // hex colour for the topic card border
       questions:      [ ...question objects... ]
     }

   COLOUR REFERENCE (hex values without quotes)
     Teal     0x36c98d    Blue    0x5b6ef5    Purple  0x8a63d6
     Gold     0xffcf3f    Red     0xe05c5c    Orange  0xe09b3d
   ============================================================================ */

const QUIZ_CONTENT = {

  /* ---- Game labels -------------------------------------------------------- */

  storeTitle:  'Quiz Store',          // header shown on the Shop screen
  labTitle:    'Quiz Lab',            // name of the training tab
  labTabIcon:  '🧪',                  // emoji on the training tab button
  labSubtitle: 'Train your hero to earn ⭐ stars. Wrong answers never cost you anything.',

  /* ---- Topics & questions ------------------------------------------------- */

  topics: [

    /* ====================================================================
       TOPIC 1 — Science
       ==================================================================== */
    {
      id:              'science',
      name:            'Science',
      icon:            '🔬',
      starsPerCorrect: 2,
      timerSeconds:    15,
      color:           0x36c98d,
      questions: [
        {
          q:       'What planet is known as the Red Planet?',
          answer:  'Mars',
          choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          hint:    'It has a reddish colour due to iron oxide on its surface.',
        },
        {
          q:       'What gas do plants absorb from the air during photosynthesis?',
          answer:  'Carbon dioxide',
          choices: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
          hint:    'Plants release oxygen and take in the opposite gas.',
        },
        {
          q:       'How many bones are in the adult human body?',
          answer:  '206',
          choices: ['206', '198', '215', '225'],
          hint:    'Babies are born with more bones; some fuse together as you grow.',
        },
        {
          q:       'What is the chemical symbol for water?',
          answer:  'H₂O',
          choices: ['CO₂', 'NaCl', 'H₂O', 'O₂'],
          hint:    'Two hydrogen atoms bonded to one oxygen atom.',
        },
        {
          q:       'Which planet has the most moons?',
          answer:  'Saturn',
          choices: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
          hint:    'This ringed planet has over 140 confirmed moons.',
        },
        {
          q:       'What force keeps planets in orbit around the Sun?',
          answer:  'Gravity',
          choices: ['Magnetism', 'Friction', 'Gravity', 'Electricity'],
          hint:    'The same force that makes objects fall to the ground.',
        },
        {
          q:       'What is the powerhouse of the cell?',
          answer:  'Mitochondria',
          choices: ['Nucleus', 'Ribosome', 'Mitochondria', 'Vacuole'],
          hint:    'This organelle produces energy in the form of ATP.',
        },
        {
          q:       'What is the speed of light (approximately)?',
          answer:  '300,000 km/s',
          choices: ['150,000 km/s', '300,000 km/s', '450,000 km/s', '1,000,000 km/s'],
          hint:    'Light can travel around the Earth about 7.5 times per second.',
        },
        {
          q:       'What state of matter has a definite volume but no definite shape?',
          answer:  'Liquid',
          choices: ['Solid', 'Liquid', 'Gas', 'Plasma'],
          hint:    'Think of water — it takes the shape of whatever container holds it.',
        },
        {
          q:       'Which organ pumps blood through the human body?',
          answer:  'Heart',
          choices: ['Liver', 'Lung', 'Kidney', 'Heart'],
          hint:    'You can feel it beat in your chest.',
        },
      ],
    },

    /* ====================================================================
       TOPIC 2 — History
       ==================================================================== */
    {
      id:              'history',
      name:            'History',
      icon:            '🏛️',
      starsPerCorrect: 3,
      timerSeconds:    15,
      color:           0x5b6ef5,
      questions: [
        {
          q:       'In which year did World War II end?',
          answer:  '1945',
          choices: ['1918', '1939', '1945', '1953'],
          hint:    'The war ended with the surrender of Germany and Japan.',
        },
        {
          q:       'Who was the first President of the United States?',
          answer:  'George Washington',
          choices: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'],
          hint:    'He is often called the "Father of His Country".',
        },
        {
          q:       'Which ancient wonder was located in Alexandria, Egypt?',
          answer:  'The Lighthouse',
          choices: ['The Colossus', 'The Lighthouse', 'The Mausoleum', 'The Temple of Artemis'],
          hint:    'It guided sailors safely into the harbour.',
        },
        {
          q:       'The Renaissance began in which country?',
          answer:  'Italy',
          choices: ['France', 'England', 'Italy', 'Spain'],
          hint:    'Florence and Rome were its most famous centres.',
        },
        {
          q:       'Who wrote the Declaration of Independence (primary author)?',
          answer:  'Thomas Jefferson',
          choices: ['Benjamin Franklin', 'John Hancock', 'George Washington', 'Thomas Jefferson'],
          hint:    'He later became the third U.S. President.',
        },
        {
          q:       'The Great Wall of China was primarily built to defend against whom?',
          answer:  'Northern nomadic tribes',
          choices: ['Japanese invaders', 'Persian armies', 'Northern nomadic tribes', 'Mongol traders'],
          hint:    'Raids from the steppes to the north threatened Chinese dynasties for centuries.',
        },
        {
          q:       'In which city was Julius Caesar assassinated?',
          answer:  'Rome',
          choices: ['Athens', 'Carthage', 'Alexandria', 'Rome'],
          hint:    'He was killed in the Senate on the Ides of March.',
        },
        {
          q:       'What invention is Johannes Gutenberg famous for?',
          answer:  'The printing press',
          choices: ['The steam engine', 'The printing press', 'The compass', 'The telescope'],
          hint:    'It allowed books to be mass-produced for the first time.',
        },
        {
          q:       'Which empire was ruled by Genghis Khan?',
          answer:  'The Mongol Empire',
          choices: ['The Ottoman Empire', 'The Mongol Empire', 'The Roman Empire', 'The Persian Empire'],
          hint:    'At its peak it was the largest contiguous land empire in history.',
        },
        {
          q:       'The Apollo 11 mission landed humans on the Moon in which year?',
          answer:  '1969',
          choices: ['1961', '1965', '1969', '1972'],
          hint:    'Neil Armstrong was the first person to walk on the Moon.',
        },
      ],
    },

    /* ====================================================================
       TOPIC 3 — Geography
       ==================================================================== */
    {
      id:              'geography',
      name:            'Geography',
      icon:            '🌍',
      starsPerCorrect: 3,
      timerSeconds:    15,
      color:           0x8a63d6,
      questions: [
        {
          q:       'What is the longest river in the world?',
          answer:  'The Nile',
          choices: ['The Amazon', 'The Nile', 'The Yangtze', 'The Mississippi'],
          hint:    'It flows northward through northeastern Africa into the Mediterranean.',
        },
        {
          q:       'Which country has the largest land area?',
          answer:  'Russia',
          choices: ['Canada', 'China', 'United States', 'Russia'],
          hint:    'It spans 11 time zones across Europe and Asia.',
        },
        {
          q:       'What is the capital city of Australia?',
          answer:  'Canberra',
          choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
          hint:    'It was purpose-built as a compromise between Sydney and Melbourne.',
        },
        {
          q:       'On which continent is the Sahara Desert located?',
          answer:  'Africa',
          choices: ['Asia', 'Australia', 'South America', 'Africa'],
          hint:    'It stretches across the northern part of this continent.',
        },
        {
          q:       'Which ocean is the largest?',
          answer:  'Pacific Ocean',
          choices: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
          hint:    'It covers more than 30% of Earth\'s surface.',
        },
        {
          q:       'Mount Everest is located on the border of Nepal and which other country?',
          answer:  'China (Tibet)',
          choices: ['India', 'Bhutan', 'China (Tibet)', 'Pakistan'],
          hint:    'Its northern face lies in the autonomous region once called Tibet.',
        },
        {
          q:       'What is the smallest country in the world by area?',
          answer:  'Vatican City',
          choices: ['Monaco', 'San Marino', 'Liechtenstein', 'Vatican City'],
          hint:    'It is entirely surrounded by Rome, Italy.',
        },
        {
          q:       'The Amazon Rainforest is primarily located in which country?',
          answer:  'Brazil',
          choices: ['Peru', 'Colombia', 'Brazil', 'Venezuela'],
          hint:    'About 60% of the Amazon is within this country.',
        },
        {
          q:       'Which is the most populous country in the world?',
          answer:  'India',
          choices: ['China', 'India', 'United States', 'Indonesia'],
          hint:    'It surpassed its neighbour to the north in recent years.',
        },
        {
          q:       'The Grand Canyon is located in which U.S. state?',
          answer:  'Arizona',
          choices: ['Colorado', 'Utah', 'Nevada', 'Arizona'],
          hint:    'The Colorado River carved this natural wonder over millions of years.',
        },
      ],
    },

    /* ====================================================================
       TOPIC 4 — Mixed (draws from all topics)
       ==================================================================== */
    {
      id:              'mixed',
      name:            'Mixed Topics',
      icon:            '✳️',
      starsPerCorrect: 5,
      timerSeconds:    12,
      color:           0xffcf3f,
      questions: [
        /* A hand-picked selection across Science, History, and Geography */
        {
          q:       'What is the chemical symbol for gold?',
          answer:  'Au',
          choices: ['Go', 'Gd', 'Au', 'Ag'],
          hint:    'From the Latin word "aurum".',
        },
        {
          q:       'Which country invented the printing press (Gutenberg)?',
          answer:  'Germany',
          choices: ['France', 'England', 'Italy', 'Germany'],
          hint:    'Gutenberg worked in Mainz in the 15th century.',
        },
        {
          q:       'What is the capital of Canada?',
          answer:  'Ottawa',
          choices: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
          hint:    'Not the most well-known Canadian city, but it\'s the seat of government.',
        },
        {
          q:       'What layer of Earth\'s atmosphere absorbs UV radiation?',
          answer:  'Ozone layer',
          choices: ['Troposphere', 'Stratosphere', 'Ozone layer', 'Mesosphere'],
          hint:    'It\'s found within the stratosphere and uses a three-atom form of oxygen.',
        },
        {
          q:       'The Berlin Wall fell in which year?',
          answer:  '1989',
          choices: ['1979', '1985', '1989', '1991'],
          hint:    'It divided East and West Germany for about 28 years.',
        },
        {
          q:       'Which continent has the most countries?',
          answer:  'Africa',
          choices: ['Asia', 'Europe', 'Africa', 'South America'],
          hint:    'It has 54 recognised sovereign nations.',
        },
        {
          q:       'DNA stands for?',
          answer:  'Deoxyribonucleic acid',
          choices: ['Dioxynucleic acid', 'Deoxyribonucleic acid', 'Dinucleic riboacid', 'Deoxyribose nucleotide acid'],
          hint:    'It carries the genetic instructions for all known life.',
        },
        {
          q:       'Who painted the Mona Lisa?',
          answer:  'Leonardo da Vinci',
          choices: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Botticelli'],
          hint:    'He was also an inventor and scientist during the Italian Renaissance.',
        },
        {
          q:       'What is the largest desert in the world (by area)?',
          answer:  'Antarctica',
          choices: ['Sahara', 'Gobi', 'Arabian', 'Antarctica'],
          hint:    'A cold desert — it receives very little precipitation each year.',
        },
        {
          q:       'Isaac Newton formulated laws of motion after observing what fall from a tree?',
          answer:  'Apple',
          choices: ['Pear', 'Apple', 'Orange', 'Plum'],
          hint:    'The story may be partly legend, but it inspired his work on gravity.',
        },
      ],
    },

  ], // end topics

}; // end QUIZ_CONTENT
