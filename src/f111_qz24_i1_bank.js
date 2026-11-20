// F111 R66 · Banco editorial I1 Interchange 5th Edition 2 · U1–16.
// Preguntas transcritas sin claves; revisión/cotejo de puntos contra esquema.
// Los apartados compuestos mantienen la clave única del backend.
(function(){
'use strict';
const banks={
4:{quiz:1,units:'1–2',points:25,sections:[
{id:'A',title:'Listening · Childhood and cities',points:4,type:'radio',
 help:'Listen to the conversations. Check the correct answers.',items:[
['A1','Matt grew up in _____.',['Argentina.','Boston.','Washington, D.C.']],
['A2','Mia used to _____.',['play with old toys.','collect comic books.','watch mysteries.']],
['A3','Kate thinks that there _____.',["aren’t enough safe places to ride bicycles.",'is too much traffic.',"aren’t enough buses."]],
['A4','Olivia can join a car pool by _____.',['asking a neighbor for a ride.','visiting a website.','riding to work with Rob.']]]},
{id:'B',title:'Past tense conversations',points:3,type:'text',help:'Complete each question in the past tense.',items:[
['B1','A: Where _____ ?\nB: I was born in Tokyo.'],
['B2','A: Did _____ in high school?\nB: No, she didn’t play soccer in high school. She played basketball.'],
['B3','A: When _____ from college?\nB: They graduated from college in 2015.']]},
{id:'C',title:'Used to · Grammar',points:3,type:'radio',help:'Circle the correct word.',items:[
['C1','Every summer, Kara used to _____ to the beach with her friends.',['go','went']],
['C2','I really enjoyed _____ video games when I was a teenager.',['playing','play']],
['C3','Mike _____ have pets, including a fish and a rabbit, when he was a child.',['used to','use to']]]},
{id:'D',title:'Put the words in order',points:3,type:'text',help:'Write correct sentences.',items:[
['D1','(lights / needs / city / more / this / street)'],
['D2','(pollution / is / and / much / there / traffic / too / air)'],
['D3','(fewer / should / noise / there / less / be / cars / and)']]},
{id:'E',title:'Used to · Conversation',points:4,type:'compound',help:'Use the correct form of used to and the verbs given.',items:[
['E','Complete all four blanks.',
 [['A: _____ (go) to the playground when you were a child?',null],
  ['B: Yes, I _____ to the playground every day after school.',null],
  ['A: And what things _____ (collect)?',null],
  ['B: Oh, I never _____ anything, but now I collect art.',null]]]]},
{id:'F',title:'Indirect questions',points:4,type:'text',help:'Rewrite each as a polite indirect question using the word in parentheses.',items:[
['F1','Where is the nearest subway station? (Do)'],
['F2','How much does a train ticket cost? (Could)'],
['F3','Where is the best bookstore in town? (Do)'],
['F4','What time do the duty-free shops close? (Can)']]},
{id:'G',title:'Reading · The Straddling Bus',points:4,type:'radio',help:'Read the article and choose the correct answers.',
 reading:"Song Youzhou is a businessman. He and his company designed the Straddling Bus to solve traffic problems in China and large cities around the world. The Straddling Bus looks like a monorail and a very tall truck put together. It is six meters wide and stands over four meters high. The Straddling Bus rides on rails outside the traffic lanes, high enough for cars and small trucks to pass underneath it.\nThese buses can carry more passengers than ordinary buses and use a combination of electricity and solar power. They can travel 40 to 80 kilometers per hour above road traffic. According to a company spokesperson, these buses are much less expensive to build than a subway or train line, and construction time is two-thirds faster. This is an environmentally-friendly, energy-efficient invention.",
 items:[
['G1',"Song Youzhou’s company _____.",['designed the Straddling Bus.','wants to own a Straddling Bus.','thinks the Straddling Bus will work only in China.']],
['G2','The Straddling Bus _____.',['takes up four lanes on a road.','is as high as regular road traffic.','uses two kinds of energy.']],
['G3','This new bus _____.',['travels 120 kilometers per hour.','has 25 rails to ride on.','is taller than a car.']],
['G4','The Straddling Bus _____.',['is less expensive to build than a regular bus.','can only be used in environmentally-friendly cities.','takes less time to build than a subway line.']]]}
]},
8:{quiz:2,units:'3–4',points:25,sections:[
{id:'A',title:'Listening · Apartments',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','Ally likes her new apartment because _____.',['it has a spacious bedroom.','there’s too much noise.','it’s cheaper than her old apartment.']],
['A2','Marco wants to live downtown because _____.',['he works there.','it’s less expensive.','there are more parking spaces.']],
['A3',"Elena’s house is _____.",['too small.','too spacious.','too private.']],
['A4','Peter wishes his new apartment were _____.',['nice and bright.','on the first floor.','not as cramped as his old apartment.']]]},
{id:'B',title:'Neighborhood adjectives',points:4,type:'radio',help:'Circle the correct adjective.',items:[
['B1','I don’t really like my neighborhood. It’s very _____.',['dangerous','convenient','safe']],
['B2','I have a lot of windows in my living room, so it’s usually _____.',['bright','noisy','huge']],
['B3','It’s _____ to have parking spaces near my apartment.',['comfortable','convenient','dingy']],
['B4','Our house is only two years old. It’s very _____ and spacious.',['modern','run-down','cramped']]]},
{id:'C',title:'Enough / Not enough',points:3,type:'text',help:'Complete with not enough or not ... enough.',items:[
['C1','Our apartment is too dark. There are _____. (windows)'],
['C2','People can see into our house. There is _____. (privacy)'],
['C3','My apartment is very inconvenient. It’s _____ for me. (convenient)']]},
{id:'D',title:'As ... as',points:3,type:'text',help:'Complete with as ... as / as many ... as / as much ... as.',items:[
['D1','My new apartment doesn’t have _____ my old one. (bedrooms)'],
['D2','Our house is just _____ your apartment. (comfortable)'],
['D3','Modern apartments often don’t have _____ older ones. (space)']]},
{id:'E',title:'Wish · Verb form',points:3,type:'text',help:'Use wish and the correct form of the verb.',items:[
['E1','I don’t like my neighborhood. I wish _____. (like)'],
['E2','I can’t find my keys. I wish _____. (can find)'],
['E3','My sister is on vacation. I wish _____. (be not)']]},
{id:'F',title:'Present perfect and simple past',points:4,type:'compound',help:'Complete the dialogue with the correct verb forms.',items:[
['F','A: _____ you ever _____ (try) Japanese food?\nB: Yes, I _____. I _____ (go) to a Japanese restaurant last week.\nA: _____ you _____ (like) it?\nB: Yeah, it _____ (be) delicious.',
 [['Question · blank 1',null],['Question · blank 2',null],['Short answer',null],['Past tense of go',null],
 ['Past question · blank 1',null],['Past question · blank 2',null],['Past tense of be',null]]]]},
{id:'G',title:'Reading · Competitive Food Eating',points:4,type:'multi',maxSelections:4,
 help:'Select FOUR true statements.',
 reading:"COMPETITIVE FOOD EATING\nParents, doctors and nutritionists tell us to eat healthy food and eat only until we feel full. However, some people train themselves to eat huge quantities of food and compete to eat the most in a short time. Competitive food eaters can earn $10,000 or more in prize money.\nNathan’s Hot Dog Eating Contest takes place on July 4th at Coney Island in New York. Professional eater Joey Chestnut of San Francisco won seven years in a row from 2007 to 2014. His best record in 2013 was 68 hot dogs in 10 minutes.\nSonya Thomas was born in Korea and now lives in the U.S. She began competing in 2002. Her best record at the Nathan’s contest was 45 hot dogs in 2012. She has also eaten 11 pounds of cheesecake in nine minutes and 65 hard-boiled eggs in six minutes and 40 seconds.",
 items:[['G','Select FOUR true statements.',['Competitive food eaters eat a little bit of food for a long time.','Nathan’s Hot Dog Eating Contest takes place on the Fourth of July.','Joey Chestnut was born in Coney Island, New York.','Joey Chestnut won Nathan’s contest six times in a row.','Joey Chestnut ate 69 hot dogs in ten minutes.','Sonya Thomas was born in Korea.','Sonya Thomas began to compete in 2002.','Sonya Thomas ate 11 pounds of hard-boiled eggs in six minutes and forty seconds.']]]}
]},
13:{quiz:3,units:'5–6',points:25,sections:[
{id:'A',title:'Listening · Vacation plans and roommates',points:4,type:'radio',help:'Listen to the conversations and check the correct information.',items:[
['A1','Which statement about Wendy and Eric is correct?',['Wendy is going to visit Eric’s grandparents.','Eric is not going to go fishing this year.','Wendy might go camping in August.']],
['A2','Which statement about the fishing plans is correct?',['Wendy is going fishing this summer.','Eric thinks Wendy should go to Acadia.','Eric says Wendy doesn’t have to make reservations.']],
['A3','Which statement about Leah and Martha is correct?',['Leah and Martha were roommates last year.','Leah doesn’t like being messy.','Martha and Leah are both very neat.']],
['A4','Which statement about their habits is correct?',['Leah can study while watching TV.','Martha likes to listen to music while studying.','Leah’s mother was always yelling at her.']]]},
{id:'B',title:'Be going to / Will',points:4,type:'compound',help:'Complete the conversations with be going to or will.',items:[
['B1',"A: What _____ you _____ after class today? (do)\nB: I’m definitely _____ a movie with a friend. (see)",
 [['Question · full verb phrase',null],['Answer · verb phrase',null]]],
['B2',"A: When _____ they _____ their vacation this year? (take)\nB: I think they _____ on a cruise in June or July. (go)",
 [['Question · full verb phrase',null],['Answer · verb phrase',null]]]]},
{id:'C',title:'Travel items',points:3,type:'radio',help:'Circle the correct word or phrase.',items:[
['C1','You must take your _____ when you go to another country.',['first-aid kit','backpack','passport']],
['C2','She needs to get new _____ before she goes backpacking next week.',['hiking boots','credit cards','suitcases']],
['C3','We shouldn’t forget to bring _____ for buying gifts.',['medication','sandals','cash']]]},
{id:'D',title:'Rewrite polite requests',points:3,type:'text',help:'Use the form in parentheses to rewrite each request.',items:[
['D1','Turn on the lights, please. (Could you)'],
['D2','Please clean up your mess. (Would you)'],
['D3','Don’t sit there. (Would you mind)']]},
{id:'E',title:'Phrasal verbs',points:3,type:'radio',help:'Circle the correct word.',items:[
['E1','Please take _____ the garbage. It’s starting to smell!',['off','out','on']],
['E2','Could you please hang _____ some clean towels in the bathroom?',['over','off','up']],
['E3','Can you turn _____ the TV while I’m on the phone?',['down','out','on']]]},
{id:'F',title:'Necessity and suggestions',points:4,type:'compound',help:'Circle the correct modal to complete the dialogue.',items:[
['F',"A: We _____ make our plane reservations right away!\nB: Perhaps we _____ buy round-trip tickets because they’re cheaper.\nA: You _____ bring your driver’s license.\nB: And you _____ forget to pack your digital camera.",
 [['Blank 1',['should','don’t have to']],['Blank 2',['have to','ought to']],
 ['Blank 3',['need to','’d better']],['Blank 4',['must not','shouldn’t']]]]]},
{id:'G',title:'Reading · Dear Sylvia',points:4,type:'radio',help:'Read the letter and advice, then choose the correct answers.',
 reading:"DEAR SYLVIA\nWe live in a neighborhood where everyone knows each other. A new family recently moved in, and now we have problems. Their two teenagers drive their cars very fast. When we asked them to slow down, they just looked at us. The family dumped garbage on their front lawn and didn’t pick it up after our request. Their dogs bark loudly all day, and they won’t keep them inside at night. We don’t know what to do.\nSYLVIA’S REPLY\nYou have made polite requests with no results. Unfortunately, there is nothing you can do about the garbage on their lawn. But the next time you see fast driving or hear barking dogs, call your local police. Stay polite and let the police take care of your neighbors.",
 items:[
['G1',"How did the teens respond to the neighbor’s request?",['They apologized and said they would drive slowly.','They said they liked driving fast.','They didn’t say anything.']],
['G2','What happened to the garbage dumped on the front lawn?',['The teenagers looked at it.','The new family left it there.','It was used to feed the dogs.']],
['G3','What is the problem with the dogs?',['They are kept inside all day.','They are outside barking all the time.','They aren’t allowed outside.']],
['G4',"What was Sylvia’s advice?",['Call the neighbors when the dogs bark.','Stop being polite to the neighbors.','Let the police solve the problems.']]]}
]},
16:{quiz:4,units:'7–8',points:25,sections:[
{id:'A',title:'Listening · Technology',points:4,type:'radio',help:'Listen to the conversations and check the correct answers.',items:[
['A1','Rebecca says Brian is _____.',['a whiz.','a hacker.','a geek.']],
['A2','Leo asks Emily how to _____.',['shop online.','back up files.','browse websites.']],
['A3','Monica says that _____.',['she uses her computer a lot.','her computer crashes a lot.','she needs to print out her boarding pass.']],
['A4','Abby shows Tomas how to use his new smartphone to _____.',['back up photos.','listen to music.','stream video.']]]},
{id:'B',title:'Infinitive forms and uses',points:4,type:'radio',help:'Circle the correct word or phrase.',items:[
['B1','GPS technology is used _____ directions.',['to getting','for getting','for get']],
['B2','When you go to the beach, try _____ the tablet wet.',['not to get','to don’t get','not get']],
['B3','You can use my smartphone _____ a text.',['sending','for send','to send']],
['B4','Don’t forget _____ your ATM card with you.',['for taking','taking','to take']]]},
{id:'C',title:'Correct technology mistakes',points:5,type:'text',help:'Correct the mistake in each sentence.',items:[
['C1','I want to show my friends this photo. How do I send it on my social media page?'],
['C2','When I need to back up my files, I use an ATM.'],
['C3','My father knows a lot about computers. He’s a hacker.'],
['C4','Try not to run down expensive apps.'],
['C5','The screen on my tablet has frozen again. I think I need to restart my password.']]},
{id:'D',title:'Dating customs · Match',points:4,type:'select',
 help:'Match each phrase with the most appropriate information.',options:[
 ['a','they sometimes arrange another date.'],['b','they usually make a video call.'],
 ['c','they might text each other on smartphones.'],['d','they often meet in a public place, such as a coffee shop.']],
 items:[['D1','Before a young man and woman speak ...'],['D2','Before they meet for the first time ...'],
 ['D3','When they have their first date ...'],['D4','After they meet for the first time ...']]},
{id:'E',title:'Join with when',points:4,type:'compound',
 help:'Match each phrase and write a complete sentence with when.',items:[
['E','Write four complete sentences using when.',
 [['Fall is the season ...',['a. some people stay up all night','b. people celebrate Valentine’s Day','c. students often go back to school','d. many families take summer vacations']],
 ['July and August are the months ...',null],
 ['New Year’s Eve is a night ...',null],
 ['February 14 is the day ...',null]]]]},
{id:'F',title:'Reading · Festival of the Flowers',points:4,type:'multi',maxSelections:4,
 help:'Read the article and choose FOUR true statements.',
 reading:"FESTIVAL OF THE FLOWERS\nFestival de las Flores in Medellín, Colombia, celebrates the country’s beautiful flowers. The festival takes place every August and lasts about ten days. There are parades, a pageant and amazing flower arrangements.\nColombians first celebrated the festival on May 1, 1957, when forty peasants formed a parade with flowers they carried from town to town. In 1958 officials moved it to August to celebrate independence from Spain in the summer as well.\nA popular event is the parade of silletas, huge flower arrangements, and the sillateros who create flower art. Over 7,000 horses and riders participate in a three-hour parade. Horses and riders wear the blue, red and yellow colors of the Colombian flag, and the parade holds the Guinness World Record as the largest horse parade.",
 items:[['F','Select FOUR true statements.',
 ['The Festival of the Flowers takes place every May.','The festival lasts about ten days.','It was first celebrated in 1957.','The first parade had over 7,000 people.','Summer is when Colombians celebrate their independence from Spain.','The horse parade is over three hours long.','Horses and riders wear red, white and blue.','The horse parade holds the world record as the most colorful parade.']]]}
]},
21:{quiz:5,units:'9–10',points:25,sections:[
{id:'A',title:'Listening · Personal preferences',points:4,type:'radio',help:'Listen to the conversations.',items:[
['A1','Maria _____.',['has some old letters from her grandmother.','is going to sell her old cell phone to Ryan.','is happy with her smartphone and new technology.']],
['A2','According to Jeremy, if Emma stays in her apartment, _____.',['she’ll have more time to save for a house.','she may have to make a lot of repairs.','she won’t be able to afford a big old house.']],
['A3',"Zach’s dad _____.",['cooks dinner every night.','likes the idea of Zach becoming a chef.','thinks Zach needs to have dinner.']],
['A4','Aaron _____.',['is going to be a counselor at a summer camp.','has a lot of patience to work with kids.','wants to get a job at a gym.']]]},
{id:'B',title:'Past / Present / Future Match',points:4,type:'select',
 help:'Match each phrase with the appropriate information.',
 options:[['a','people usually used paper maps.'],['b','there might be smartphone implants.'],
 ['c','people often used horses for transportation.'],['d',"there aren’t enough parking spaces."]],
 items:[['B1','About 200 years ago ...'],['B2','Before GPS technology ...'],['B3','In many cities nowadays ...'],['B4','Sometime in the future ...']]},
{id:'C',title:'Conditionals',points:3,type:'radio',help:'Circle the correct phrase.',items:[
['C1',"If you drive to work, you _____ find a parking space.",['’ll have to','won’t have to','’ll be able to']],
['C2','If you _____ a vacation, you may feel better and more relaxed.',['take','travel','don’t go']],
['C3','If you bring an umbrella, you _____ wet in the rain.',['won’t get','might have','will have']]]},
{id:'D',title:'Agree or disagree',points:3,type:'radio',help:'Check the correct response.',items:[
['D1','A: I can’t stand talking on the phone.',['Neither am I.','Neither can I.','I don’t.']],
['D2','A: I like working with computers.',['So am I.','Neither do I.','So do I.']],
['D3','A: I hate getting to work at 7:30 in the morning. It’s too early.',['Well, I am.','Neither do I.','Really? I like it.']]]},
{id:'E',title:'Personality adjectives',points:3,type:'radio',help:'Circle the correct adjective.',items:[
['E1','Keith plans carefully so he’s never late. He likes to be _____.',['creative','punctual','forgetful']],
['E2','Britta helps people and never says no. She seems _____.',['generous','impatient','disorganized']],
['E3','Liz and Patrick get angry easily. Everyone thinks they are moody and _____.',['level-headed','hardworking','short-tempered']]]},
{id:'F',title:'Job preferences · Match',points:4,type:'select',help:'Match the sentences to the reasons.',
 options:[['a','because I’m too disorganized and can’t stand telling people what to do.'],
 ['b','because I’m efficient and I like working with numbers.'],
 ['c','because I have an excellent memory and like meeting people.'],
 ['d','because I don’t like to travel or work with people.']],
 items:[['F1','I’d like to work as an accountant ...'],['F2','I wouldn’t want to be a flight attendant ...'],
 ['F3','I would make a good server ...'],['F4','I could never become a boss ...']]},
{id:'G',title:'Reading · Job ads',points:4,type:'select',help:'Read the ads and match the best job to each applicant.',
 reading:"CLASSIFIEDS\nA. COMPUTER PROGRAMMER: Must analyze computer data, be reliable, organized and efficient, know several computer languages and operating systems, and work alone and in teams. DataTech Corporation.\nB. OFFICE MANAGER: Good computer skills and excellent English; another foreign language helpful. Creative, hardworking, organized, good with people and problem-solving. Some evening and Saturday work required. Rosewood Medical Center.\nC. SERVER: Part-time in a downtown coffee shop, experience and high-school diploma desirable. Weekends required, friendly, hardworking and good with people. Hourly wage plus tips and vacation.",
 options:[['A','Computer programmer'],['B','Office manager'],['C','Server']],
 items:[
['G1','Anita has just finished high school and worked one year at a fast-food restaurant.'],
['G2','Christina has worked with computer languages and likes working independently and with others.'],
['G3','Greg finished a computer course, studied Spanish for three years, and can work evenings/Saturdays.'],
['G4','Isabella excelled in computer language classes and problem-solving, but cannot work Saturdays.']]}
]},
24:{quiz:6,units:'11–12',points:26,sections:[
{id:'A',title:'Listening · World monuments',points:4,type:'radio',help:'Listen to the conversations.',items:[
['A1','The Great Wall of China _____.',['is made completely of dirt and stones.','was built by wheelbarrows.','is too long to walk.']],
['A2','Great Zimbabwe is _____.',['on the border of Zimbabwe and Zambia.','the largest monument in southern Africa.','a modern city with 20,000 people.']],
['A3','Easter Island _____.',['is close to Chile and Tahiti.','has some large statues.','has an unusual sculpture museum.']],
['A4','The city where the woman lived _____.',['is located in the mountains.','is known in English as the Sun City.','is over 6,000 years old.']]]},
{id:'B',title:'Passive with by',points:4,type:'text',help:'Rewrite in the passive voice using by.',items:[
['B1','Michael Bay directed the Transformers movies.'],
['B2','Jack Dorsey developed Twitter.'],
['B3','Suzanne Collins wrote The Hunger Games novels.'],
['B4','Gustave Eiffel designed the Eiffel Tower in Paris.']]},
{id:'C',title:'Passive verbs',points:3,type:'text',help:'Use the passive form of each verb.',items:[
['C1','English _____ (speak) in Australia and New Zealand.'],
['C2','Japanese and Korean _____ (teach) at this school.'],
['C3','Cattle _____ (raised) in many South American countries.']]},
{id:'D',title:'Vocabulary choices',points:4,type:'radio',help:'Circle the correct word.',items:[
['D1','One of the crops grown in China is _____.',['cattle','wheat','shrimp']],
['D2','_____ are manufactured in California.',['Goats','Microchips','Oysters']],
['D3','I thought I had lost my cell phone, but _____ I found it in my coat pocket.',['coincidentally','sadly','fortunately']],
['D4','I was looking for a job when _____ I won the lottery and went on vacation.',['miraculously','unfortunately','strangely']]]},
{id:'E',title:'Past simple vs past continuous',points:3,type:'compound',help:'Complete each sentence with the correct form of both verbs.',items:[
['E1','I _____ (buy) my favorite jacket while I _____ (travel) in France.',
 [['Past form of buy',null],['Past form of travel',null]]],
['E2','We _____ (sleep), but the storm _____ (wake) us up.',
 [['Past form of sleep',null],['Past form of wake',null]]],
['E3','Ken _____ (eat) dinner when his boss _____ (call).',
 [['Past form of eat',null],['Past form of call',null]]]]},
{id:'F',title:'Present perfect continuous',points:4,type:'compound',help:'Complete the conversation with present perfect continuous forms.',items:[
['F',"A: Hi, Jenny! I haven’t seen you since last summer. _____ you _____ (work) long hours?\nB: Yes, I have. I _____ (go) to work every day, and sometimes on weekends, too.\nA: And at night?\nB: Oh, my new dog _____ (keep) me awake all night!",
 [['Question · blank 1',null],['Question · blank 2',null],['B · verb go',null],['B · verb keep',null]]]]},
{id:'G',title:'Reading · Renzo Piano',points:4,type:'radio',help:'Read the article and check the correct answers.',
 reading:"Renzo Piano was born in Genoa, Italy, in 1937, into a family of builders. He graduated from Milan Polytechnic Architecture School in 1964 and taught architecture there. In 1969 he was awarded his first important project: the Italian Industry Pavilion for Expo ’70 in Osaka, Japan. Architect Richard Rogers liked his work and suggested entering an international competition to design the Georges Pompidou Center in Paris. They won.\nSince then, Piano has designed many famous buildings and landmarks. In 1982 an art collector chose him to design the Menil Collection in Houston, Texas, a large museum and cultural center. In 1984 he was commissioned to design an airport in Osaka, Japan, on an artificial island. Kansai International Airport Terminal is the largest building he has designed and can handle up to 100,000 passengers a day.",
 items:[
['G1','Renzo Piano studied architecture in _____.',['Osaka, Japan.','Paris, France.','Milan, Italy.']],
['G2','In 1969, Renzo Piano _____.',['graduated from architecture school.','designed an airport.','designed a pavilion.']],
['G3','Renzo Piano was asked to design a building by _____.',['an English teacher.','an American art collector.','a Japanese pilot.']],
['G4',"Renzo Piano’s largest building is _____.",['a large museum.','a French building.','an airport.']]]}
]},
28:{quiz:7,units:'13–14',points:25,sections:[
{id:'A',title:'Listening · Movie reviews and performances',points:4,type:'radio',help:'Listen to the conversations.',items:[
['A1','Both Todd and Paula _____.',['were bored by Inception.','thought Iron Man 2 was a better movie.','are interested in movies because of what they used to read.']],
['A2','Nina _____.',['thought James Franco starred in Water for Elephants.','reads many movie reviews in entertainment magazines.','doesn’t think Sigourney Weaver still makes films.']],
['A3','What does mandatory class attendance mean?',['The teacher lowers your grade if you miss class.','You must attend every class during the semester.','You do not have to attend every day.']],
['A4','What is true about the performance?',['Max has seen a Broadway musical before.','You can receive phone calls during the performance.','You can eat a snack during the performance.']]]},
{id:'B',title:'-ed / -ing adjectives',points:4,type:'text',help:'Use the correct form of each word.',items:[
['B1','I think messy movie theaters are _____ (disgust).'],
['B2',"We’re both _____ (shock) that Johnny Depp’s last movie was terrible."],
['B3','I was _____ (surprise) to see Vanessa and Nate at the party.'],
['B4','I thought Matt Damon’s last movie was _____ (confuse) because the story was hard to follow.']]},
{id:'C',title:'Movie opinions',points:3,type:'radio',help:'Circle the correct word.',items:[
['C1','The musical was _____. I absolutely loved it!',['weird','terrible','outstanding']],
['C2','This book is _____. I don’t think I can read another word.',['horrible','amusing','fantastic']],
['C3','People hated everything about the movie. What a _____ film!',['bizarre','fabulous','dreadful']]]},
{id:'D',title:'Relative clauses',points:3,type:'text',help:'Rewrite using who, that or which.',items:[
['D1','Comedies are a type of movie. They usually make people laugh.'],
['D2','Flash is a popular TV show. It stars Grant Gustin.'],
['D3','Brie Larson is an actress. She won an Oscar for her performance in Room.']]},
{id:'E',title:'Speculation words',points:4,type:'radio',help:'Complete with the correct word.',items:[
['E1','Look at Carla sitting over there tapping her foot. Oh, _____ it means she’s waiting for a phone call.',['maybe','may','might']],
['E2','What does Pedro’s gesture mean? It _____ means he wants you to be quiet.',['probably','might','could']],
['E3','That gesture _____ means everything’s OK.',['perhaps','definitely','possibly']],
['E4','The girl is rolling her eyes at her brother. _____ it means she doesn’t like what he’s saying.',['Must','Perhaps','Could']]]},
{id:'F',title:'Can / Have to / Allowed',points:3,type:'text',help:'Rewrite using the expression in parentheses.',items:[
['F1','Sign your name on this paper. (have to) You _____.'],
['F2','No parking on this side of the street. (can’t) You _____.'],
['F3','Listen to your MP3 player here. (allow) You _____.']]},
{id:'G',title:'Reading · Body Language',points:4,type:'radio',help:'Read the article and check the correct answers.',
 reading:"BODY LANGUAGE: WHAT DOES IT SAY?\nMuch of what we say to others is communicated not only through words but also through body language, including posture, facial expressions and gestures. Body language is important for communication and understanding other people.\nA smile usually means friendliness and interest, but some people smile to be polite. Eyebrows also communicate: a quick up-and-down signals recognition or greeting; raised eyebrows may mean surprise; eyebrows pulled down and together can signal anger or frustration. People also gesture with their hands to describe size or actions. Someone who keeps pointing at you may be angry or feel superior.",
 items:[
['G1','People communicate with one another using _____.',['only words.','words and body language.','only facial expressions.']],
['G2','Body language includes _____.',['interpretations.','words and gestures.','posture, facial expressions and gestures.']],
['G3','Eyebrow position can show recognition, surprise and _____.',['sometimes frustration.','often politeness.','perhaps superiority.']],
['G4','Someone who points a finger directly at you may be _____.',['friendly.','interested.','angry.']]]}
]},
30:{quiz:8,units:'15–16',points:26,sections:[
{id:'A',title:'Listening · Hypothetical choices',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','If Brenda won the lottery, she would _____.',['keep working.','get a job.','quit her job.']],
['A2','If Jim had the same choice as last night’s winner, he’d _____.',['pay his car repair bills.','choose the new car.','take the cruise.']],
['A3','Theo says he would have _____.',['returned the big tip.','kept the big tip.','left a big tip.']],
['A4','According to Henry, Liza should have _____.',['told her students not to use cell phones in class.','switched off her cell phone.','told the teacher about her grandmother.']]]},
{id:'B',title:'Hypothetical conditionals',points:4,type:'compound',help:'Complete the dialogue using the correct conditional verb forms.',items:[
['B',"A: My brother starts school in the fall, but he doesn’t have a summer job.\nB: If I _____ (not have) a job, I _____ (sleep) late every day.\nA: If I _____ (have) time, I _____ (not stay) home every day.\nB: What would you do?\nA: I _____ (borrow) some money and _____ (travel).",
 [['Blank 1',null],['Blank 2',null],['Blank 3',null],['Blank 4',null],['Blank 5',null],['Blank 6',null]]]]},
{id:'C',title:'Past modals',points:4,type:'compound',help:'Complete each conversation with past modal forms.',items:[
['C1',"A: These flowers were delivered to my house by accident. I kept them.\nB: I wouldn’t _____ (do) that. I would _____ (called) the shop.",
 [['Blank 1',null],['Blank 2',null]]],
['C2',"A: While parking, I hit someone else’s car. I didn’t leave a note.\nB: You should _____ (admit) your mistake. You shouldn’t _____ (deny) responsibility.",
 [['Blank 1',null],['Blank 2',null]]]]},
{id:'D',title:'Accept / Give / Make / Offer / Tell',points:4,type:'text',help:'Use the correct verb form.',items:[
['D1','Erica _____ an apology to her boss for being late to the meeting.'],
['D2','Carlos has finally _____ their offer.'],
['D3','I only _____ a lie when I don’t want to hurt someone’s feelings.'],
['D4','When Justin doesn’t want to do something, he never _____ a reason.']]},
{id:'E',title:'Reported speech',points:6,type:'compound',help:'Rewrite the dialogue in reported speech with the given verbs. The source exam allocates 6 points to this compound item.',items:[
['E',"Susan: Can you give me a ride to the dentist?\nFred: I can drive you there in the morning.\nSusan: Meet me outside my house at 9:00 A.M.\nFred: I will be there around nine.\nSusan: Don’t be late!\nFred: I don’t have any other plans.\nSusan: I’m very grateful.",
 [['Susan _____ (ask) a ride to the dentist.',null],
 ['Fred _____ (tell) there in the morning.',null],
 ['Susan _____ (ask) outside her house at 9:00 A.M.',null],
 ['Fred _____ (say) there around nine.',null],
 ['Susan _____ (tell) late.',null],
 ['Fred _____ (tell) any other plans.',null],
 ['Susan _____ (say) very grateful.',null]]]]},
{id:'F',title:'Reading · Carolyn Hax',points:4,type:'radio',help:'Read the article and check the correct answers.',
 reading:"CAROLYN HAX\nWho do many young people go to for advice on personal problems? Carolyn Hax, a Harvard graduate, has written practical, funny advice for The Washington Post since 1999. Her advice is unusual because she does not tell readers exactly what she would do; she offers new ways to think about problems, so they can find their own solutions.\nShe first wrote one column per week. She now writes three original columns per week and four additional columns adapted from weekly online discussions, providing a daily column. Her discussions can last over two hours and offer in-depth real-time advice. Her column appears in over 200 U.S. newspapers, edited and illustrated by her ex-husband Nick Galifianakis. She has written a book and is the mother of three boys.",
 items:[
['F1',"Carolyn Hax’s advice _____.",['makes sense.','makes everyone laugh.','makes sense and makes people laugh.']],
['F2','Her advice is unusual because _____.',['it’s only available online.','it doesn’t provide readers with a solution.','people can choose what kind of advice they want.']],
['F3',"Carolyn Hax’s column appears _____.",['three days a week.','seven days a week.','four days a week.']],
['F4',"Nick Galifianakis is Carolyn Hax’s _____.",['son.','editor.','husband.']]]}
]}
};
window.F111_QZ24_I1_BANK=Object.freeze(banks);
})();