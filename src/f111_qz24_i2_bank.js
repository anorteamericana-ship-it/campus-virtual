// F111 R66 · Banco editorial I2 · Interchange 5th Edition 3 · U1–16.
// Contiene preguntas y alternativas transcritas; no respuestas correctas.
// Las respuestas compuestas conservan los identificadores unitarios del esquema.
(function(){
'use strict';
const banks={
4:{quiz:1,units:'1–2',points:25,sections:[
{id:'A',title:'Listening · People and job choices',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','_____ is completely honest and gives helpful advice.',['Denise','Ms. Norris','Anna']],
['A2','It bothers Maria and Gary when people _____.',['forget to say thank you','post on social networking sites','don’t answer the phone']],
['A3','Jenna and Scott would love being _____.',['bank tellers this summer','extras in a movie','friends with the director']],
['A4','Emily wants to apply for _____.',['the intern position at the zoo','the part-time cleaning job','the veterinarian office intern position']]]},
{id:'B',title:'Relative clauses · Job adjectives',points:8,type:'compound',
 help:'Circle the correct adjective AND join the two sentences with who or that.',items:[
['B1','I’d prefer a(n) _____ boss. I can do my best for her.',
 [['Adjective',['temperamental','supportive','egotistical']],['Sentence with relative pronoun',null]]],
['B2','Zoe is a(n) _____ person. She doesn’t change easily and is stubborn.',
 [['Adjective',['modest','inflexible','stingy']],['Sentence with relative pronoun',null]]],
['B3','Our coach can’t stand _____ players. He can’t talk to them easily.',
 [['Adjective',['friendly','easygoing','egotistical']],['Sentence with relative pronoun',null]]],
['B4','I want to work with an easygoing person. This person is _____.',
 [['Adjective',['temperamental','unpredictable','fun']],['Sentence with relative pronoun',null]]]]},
{id:'C',title:'Word order · Feelings',points:3,type:'text',help:'Put the words in the correct order.',items:[
['C1','(bothers / forgets / when / name / my / someone / it / me)'],
['C2','(when / can’t / meals / during / it / I / people / stand / text)'],
['C3','(friend / me / happy / out / when / it / lunch / makes / me / a / takes / to)']]},
{id:'D',title:'Gerund phrases',points:3,type:'text',help:'Complete using be a flight attendant, write a sports column, retire at age 50 or do volunteer work.',items:[
['D1','_____ seems rewarding. I’ve always been interested in helping others.'],
['D2','Kevin wouldn’t like _____ for the school paper. He doesn’t really care about sports.'],
['D3','You’ve saved 25% of your salary for years — now _____ sounds fantastic!']]},
{id:'E',title:'Professional comparisons',points:4,type:'radio',help:'Check the correct response.',items:[
['E1','A personal sports trainer probably earns _____ a soccer coach.',['better paid than','not as hard as','as much as']],
['E2','Nurses have _____ pharmacists.',['as well paid as','better people skills than','more interesting than']],
['E3','Long-distance truck drivers are often _____ taxi drivers to drive in bad weather.',['better prepared than','as much driving as','more driving experience than']],
['E4','Working as a bank teller is _____ being a party planner.',['worse hours than','as much as','less interesting than']]]},
{id:'F',title:'Reading · Race-Car Driver',points:3,type:'multi',maxSelections:3,help:'Read the article and select THREE true statements.',
 reading:"The Ins and Outs of Being a Race-Car Driver Have you ever thought about being a race-car driver? Driving a race car is challenging and exciting. However, some aspects of a race-car driver’s job can be stressful, and race-car drivers often have to stay focused for long periods of time. A race-car driver’s work begins long before a race begins. Several hours before a race, the driver and the pit-crew meet. They talk about what kinds of tires are needed for different weather conditions. They also discuss the layout of the racetrack, the wind conditions (strong winds mean a rough ride for the driver), and even the temperature of the racetrack the driver is driving on. Race-car drivers often say that the most difficult thing about racing is getting a chance to drive in races. It takes years and years of practice at local racetracks to gain enough experience to drive in professional races. Only the very best race-car drivers become well known. Most race-car drivers don’t get to experience fame and fortune. A race-car driver must be intelligent, calm under pressure, and in excellent health. The safety of the driver, and the other race competitors, depends on his or her skills and experiences.",
 items:[['F','Choose THREE true statements.',['Not all aspects of a race-car driver’s job are exciting.','The pit crew’s main job is to help drive the car.','Drivers do not need to check wind and temperature conditions.','One of the hardest parts is getting a chance to race.','Almost all race-car drivers make a lot of money.','A race-car driver must care about both their own safety and competitors’ safety.']]]}
]},
8:{quiz:2,units:'3–4',points:25,sections:[
{id:'A',title:'Listening · Requests and accidents',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','John called Rhonda and wants to _____.',['bring a camera to her party','go to the concert with her','borrow her camera']],
['A2','Tony asks the man _____.',['Could you call back after 8?','Could you ask Edward what time I should pick him up tomorrow?','Could you tell Edward we’re playing soccer tomorrow?']],
['A3','While the couple was walking to the café, _____.',['a thief stopped them','they called the police','they went to an ATM machine']],
['A4','At the lake, Katie _____.',['learned to lock her car doors','asked her mom to lock the glove compartment','forgot her lunch and wallet in the trunk']]]},
{id:'B',title:'Polite requests',points:3,type:'text',help:'Write requests using the information.',items:[
['B1','You want your friend to fix your printer tonight. · Would you mind _____ ?'],
['B2','You want to use a classmate’s phone for a quick text. · Would it be all right if _____ ?'],
['B3','You want to borrow a stranger’s newspaper when he finishes. · I was wondering if you’d mind _____.']]},
{id:'C',title:'Correct the mistake',points:3,type:'text',help:'Find and correct the wrong word or phrase.',items:[
['C1','My doctor was very busy today, but she gave my phone call in the late afternoon.'],
['C2','Mr. Sellers did my request for extra time, so now I have to finish the project tonight.'],
['C3','Fiona owed me a nice compliment — she said I was kind and generous.']]},
{id:'D',title:'Indirect requests',points:3,type:'radio',help:'Check the correct phrase.',items:[
['D1','Could you tell Ella ...',['that Dan can’t come to the one o’clock meeting?','what Dan can’t come to the one o’clock meeting?']],
['D2','Can you ask Paul ...',['whether or not he wants to study together tonight?','if he wants studying together tonight?']],
['D3','Can you tell Emma ...',['don’t move the papers on my desk?','not to move the papers on my desk?']]]},
{id:'E',title:'Past simple / continuous / perfect',points:9,type:'compound',help:'Complete both paragraphs in the past simple, continuous or past perfect.',items:[
['E1',"At the concert, the lead singer and guitarist _____ (get) into a terrible argument. The singer _____ just _____ (start) his solo when the guitarist _____ (step) on his microphone cord. As the cameraman _____ (video) the show, he _____ (catch) the argument on tape.",
 [['Verb get',null],['Verb start',null],['Verb step',null],['Verb video',null],['Verb catch',null]]],
['E2',"While I _____ (study) at the library yesterday, I realized I _____ (forgot) something. What a panic I _____ (be) in! I couldn’t text my roommate because I _____ (not put) my cell phone in my backpack.",
 [['Verb study',null],['Verb forget',null],['Verb be',null],['Verb not put',null]]]]},
{id:'F',title:'Reading · News stories',points:3,type:'select',help:'Choose the correct title for each story.',
 reading:"One day, a man found a cat on a New York City street and brought it to an animal shelter. The animal shelter workers found a microchip under the cat’s skin with contact information for a couple in Colorado. The cat, named Mystery, had been missing for several years from the couple’s Colorado home! How did Mystery travel over 1,500 miles from Colorado to New York City? We may never find out!\n\n2.  Tom was having trouble in his life. In 2010, he lost his job as an engineer, his wife left him, and he got into a car accident. Then his luck changed. He bought a lottery ticket – and won $35 million dollars. 3. ___________________________________ One rainy morning, Todd was driving his pregnant wife, Lisa, to the grocery store. On the way, Lisa started having bad pains. Todd pulled over, and within minutes, the baby was born. Todd used his cell phone to call 911, and 15 minutes later, an ambulance came to take Todd, Lisa, and the new baby to the hospital.",
 options:[['A Strange Coincidence!','A Strange Coincidence!'],['Long-Distance Mystery!','Long-Distance Mystery!'],['Emergency!','Emergency!'],['A Change of Luck for the Better!','A Change of Luck for the Better!'],['The Misfortune Continues!','The Misfortune Continues!']],
 items:[['F1','Story 1 · Cat reunited after years.'],['F2','Story 2 · Tom’s life changes.'],['F3','Story 3 · Unexpected birth.']]}
]},
13:{quiz:3,units:'5–6',points:25,sections:[
{id:'A',title:'Listening · Adaptation and complaints',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','Kurt says he would _____.',['be happy leaving friends','not be nervous about a different culture','like to ski in Europe']],
['A2',"Kristy’s grandfather and grandmother _____.",['did not talk before marriage','met only with a family member present','had to stay with relatives until they got married']],
['A3','Lena tells Doug _____.',['the waiter’s shirt is ugly','the table has scratches on it','her glass is chipped']],
['A4',"Wendy’s landlord complaint is _____.",['the dishwasher leaks','the ceiling needs to be stained','the living room was painted before she moved in']]]},
{id:'B',title:'Living abroad · Word order',points:3,type:'text',help:'Put the words in order to make sentences.',items:[
['B1','(would / meeting / thing / one / new / is / I / friends / excited / about / be)'],
['B2','(about / most / be / trying / the / curious / I / is / thing / new / would / foods / the)'],
['B3','(about / anxious / language / be / I / is / not / the / something / understanding / would)']]},
{id:'C',title:'Adjective / Noun forms',points:5,type:'text',help:'Use another form of the boldface word.',items:[
['C1','These glasses have a scratch on the lens. They are _____.'],
['C2','My new car is dented. It has a _____ on the door.'],
['C3','There is a small leak in the aquarium. It is _____.'],
['C4','Look at the crack in that wall. It is _____.'],
['C5','This dress is stained. There are several bad _____ on it.']]},
{id:'D',title:'Need · Passive / Gerund',points:4,type:'text',help:'Use the correct form of need and any necessary words.',items:[
['D1','Those towels are so dirty. They _____ washing.'],
['D2','The wastebasket in your bedroom is full. It _____ emptied.'],
['D3','The grass in the front yard looks dry. It _____ watering.'],
['D4','The microwave oven is broken. It _____ replaced.']]},
{id:'E',title:'Common technology faults',points:5,type:'radio',help:'Circle the correct word or phrase.',items:[
['E1','My cell phone keeps _____.',['dying','jamming','replacing']],
['E2','My remote buttons keep _____.',['adjusting','dying','sticking']],
['E3','This printer keeps _____.',['dropping','flickering','jamming']],
['E4','My music player app keeps _____ songs.',['adjusting','dropping','skipping']],
['E5','My desk light keeps _____.',['fixing','flickering','replacing']]]},
{id:'F',title:'Reading · Applications and apps',points:4,type:'radio',help:'Read the article and check the correct answers.',
 reading:"In 2010, the American Dialect Society chose “app” as the word of the year. “App” is short for “application.” It’s a program for an electronic device like a smartphone or a tablet computer. There are more than 425,000 apps that can be downloaded for entertainment, shopping, sports scores, and anything else you might be interested in. Apps are so popular because they can be used almost anywhere – commuting on a bus, waiting in a doctor’s office, or hanging out at the mall. All you need is your smartphone. You don’t need to log into your computer or into a website. You don’t have to set up your video game console. You don’t even need a Wi-Fi connection. Most smartphones can hold hundreds of apps, and you can use more than one app at a time. For instance, you can use a navigation app to find a new restaurant, a dining app to look at the restaurant’s menu, and a weather forecast app to decide what to wear to the restaurant – all at the same time. One of the most popular gaming apps, Pokémon GO, has been downloaded 100 million times. In 2016, within 24 hours of its release, it became the biggest selling gaming app of 2016 and soon had 21 million daily active users in the U.S.A. alone. The Apple Store began selling apps in 2008 with nearly one billion sold. From June 2015 to June 2016, nearly 30 billion apps were sold at an average price of $1. Not only are apps popular – they can be very profitable.",
 items:[
['F1','A suitable title for the article is _____.',['Will apps ever become popular?','There’s an app for everybody!','Angry Birds are popular!']],
['F2','The article says apps _____.',['are convenient to use','need a Wi-Fi connection','are too expensive for average users']],
['F3','A navigation app helps people _____.',['log into a website','get driving directions','forecast the weather']],
['F4','In eight years, the number of apps sold has _____.',['increased','decreased','stayed the same']]]}
]},
16:{quiz:4,units:'7–8',points:25,sections:[
{id:'A',title:'Listening · Environmental issues',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','Marco wants to encourage people to _____.',['stop buying water bottles','reduce trash around the world','recycle water bottles']],
['A2','A way to reduce car pollution is to _____.',['get the bus at noon','live closer to work','buy a new car']],
['A3','Stephanie is most interested in how _____.',['pollution causes health problems','medicine affects health','fish farmers pollute']],
['A4','Claire is going to take a course in _____.',['psychology','auto repair','the science of cooking']]]},
{id:'B',title:'Passive voice and prepositions',points:4,type:'text',help:'Rewrite in passive and use the expression in parentheses.',items:[
['B1','The careless use of campfires is burning thousands of acres of forest land. (because of)'],
['B2','Flooding has displaced millions of people. (as a result of)'],
['B3','Deforestation has endangered tree frogs. (by)'],
['B4','Disease and famine are causing suffering for poor people around the world. (due to)']]},
{id:'C',title:'Solutions with infinitives',points:3,type:'text',help:'Use end wasteful spending, walk every day and eat fresh vegetables, donate clothing and food, or start recycling programs.',items:[
['C1','The best ways to avoid cancer are _____.'],
['C2','One way to end government corruption is _____.'],
['C3','The best way to reduce trash is _____.']]},
{id:'D',title:'Social issues vocabulary',points:4,type:'radio',help:'Circle the correct phrase.',items:[
['D1','Millions of people don’t have food to eat; this is a problem of _____.',['famine','recession','political unrest']],
['D2','High rates of _____ often result from recession.',['global warming','unemployment','cancer']],
['D3','Amelia learned _____ by practicing swimming every day despite difficulties.',['concern for others','perseverance','tolerance']],
['D4','I learned _____ by playing team sports.',['money management','cooperation','creativity']]]},
{id:'E',title:'Rather / Prefer',points:4,type:'compound',help:'Complete the dialogue with rather or prefer.',items:[
['E',"A: Would you _____ learn the drums or the piano, Olivia?\nB: I’d _____ not to play drums. I’d _____ to find a good piano teacher.\nA: I think I’d _____ not learn either instrument.",
 [['Blank 1',['rather','prefer']],['Blank 2',['rather','prefer']],['Blank 3',['rather','prefer']],['Blank 4',['rather','prefer']]]]]},
{id:'F',title:'Reading · Study Habits',points:3,type:'multi',maxSelections:3,help:'Read the article and select THREE true statements.',
 reading:"• DEVELOPING GOOD STUDY HABITS • Good study habits can help you learn better and make homework less stressful. These ideas are helpful for managing homework and study time. • When are you most productive? At night, during the afternoon, or in the morning? Find the time when you do your best work, and then make a plan to study at that time every day. In addition, set aside five to ten minutes in each day to plan what subjects to invest your study time in. And remember to include some time for fun every day. • Think of your study sessions like a farmer who grows crops. A farmer know it takes an entire growing season to end up with a healthy crop. He must care for, water, and weed his crops constantly. Think of studying in the same way. Don’t cram everything you need to know the night before a test and then forget it the next day. You may do well on the test, but cramming won’t get you an education. And you won’t be stressed out by the lack of sleep. • Help a classmate with homework, and you reinforce your own understanding of the subject. If you don’t have a classmate or a family member to talk to, explain subject material to yourself in a mirror. By discovering what techniques are best for you, you can set goals, identify problems, find appropriate solutions, and take the stress out of the homework.",
 items:[['F','Choose THREE true statements.',['Good study habits can help reduce stress.','It doesn’t matter what time of day you study.','Planning subjects for the day wastes time.','The best time to study for a test is the night before.','Include some time for fun in your study week.','Talking to yourself in a mirror is a good way to study.']]]},
{id:'G',title:'Ways to improve · (not) by + gerund',points:3,type:'text',
 help:'Use the suggestions: write a short story, don’t stay home—go out, don’t take a class—go to clubs, avoid sugary/high-fat foods.',items:[
['G1','A good way to spend a rainy weekend is _____.'],
['G2','The best way to eat healthy is _____.'],
['G3','You can learn to dance better _____.']]}
]},
21:{quiz:5,units:'9–10',points:25,sections:[
{id:'A',title:'Listening · Personal problems and the future',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','Sheila wants to meet new people. Max suggests _____.',['going to a public park','the best bookstore','joining a book club']],
['A2','Sheila can get a dance-class recommendation _____.',['at a contest','from Max’s sister-in-law Melissa','from her neighbors']],
['A3','Josh thinks space travel _____.',['is a possibility','didn’t happen before 1990','is finished for now']],
['A4','Kayla thinks _____.',['there is water on other planets','people will vacation on the moon','astronauts will build telescopes']]]},
{id:'B',title:'Correct the grammar',points:4,type:'text',help:'Correct the mistake in each sentence or question.',items:[
['B1','Do you know where can I get someone to cut my hair?'],
['B2','You can have your car fix at an auto repair shop.'],
['B3','Do you know where Eliza can have her driver’s license renew?'],
['B4','You can get your leather boots shines at Joe’s Shoe Shop.']]},
{id:'C',title:'Three-word phrasal verbs',points:3,type:'radio',help:'Circle the correct phrasal verb.',items:[
['C1','Thank you for _____ a great solution to my problem.',['looking forward to','coming up with','getting along with']],
['C2','Sam couldn’t _____ the other students in chemistry class.',['put up with','keep up with','take care of']],
['C3','Michelle has _____ sugar and fat. She’s lost over 15 pounds!',['cut down on','come up with','broken up with']]]},
{id:'D',title:'Suggestions · Phone problems',points:3,type:'text',help:'Complete with the correct verb forms.',items:[
['D1','It might be a good idea _____ (check out) a website discussion group.'],
['D2','One option is _____ (try) to recharge the battery.'],
['D3','What about _____ (bring) it to a repair shop?']]},
{id:'E',title:'Time expressions',points:4,type:'select',help:'Choose ago, during, for, from, in, over, since, or to.',
 options:[['ago','ago'],['during','during'],['for','for'],['from','from'],['in','in'],['over','over'],['since','since'],['to','to']],
 items:[
['E1','Vincent van Gogh died in 1890, more than 100 years _____.'],
['E2','Disco was popular _____ 1978 to 1980.'],
['E3','Spinning was popular _____ the 2000s.'],
['E4','People have used home computers _____ the 1980s.']]},
{id:'F',title:'Future predictions',points:4,type:'text',help:'Complete with will, future continuous or future perfect.',items:[
['F1','Sophisticated robots _____ (replace) factory workers in the near future.'],
['F2','Tiny computers _____ (be used) to help people with physical problems. Some people _____ (not need) a wheelchair.'],
['F3','Later in this century, people _____ (not live) in homes heated with oil.'],
['F4','Within 50 years, scientists _____ (discover) a cure for the common cold.']]},
{id:'G',title:'Reading · Hot New Products',points:3,type:'multi',maxSelections:3,
 help:'Read the ads and choose THREE true statements.',
 reading:"HOT NEW PRODUCTS! The Reason Washing Machine Andrew Reason has been working on a “green” washing machine for over seven years. And now you can own one! What makes the Reason washing machine so amazing? It has only one button! Once you load your clothes in the machine, the Reason weighs the load. Then it determines the right amount of water, detergent, and fabric softener. You will save money because you won’t use as much electricity or water!\n\nThe Glo Nightlight Do you know any children who are afraid of the dark? If the answer is yes, then try this cool, new nightlight with glowing balls! The Glo Nightlight has three stems that each hold a removable glowing ball. These electronic-free balls don’t get warm, they don’t break, and they don’t need to be plugged into an electric socket. Kids can even bring a ball to bed with them. The balls fade to dark after 30 minutes. Once you place the ball back on the stem, a low-energy LED base will recharge it.\n\nMold and Germ Destroying Air Purifier Cold and flu season is just around the corner. If you don’t want to get sick this year, why not check out the Mold and Germ Destroying Air Purifier? This gadget will eliminate up to 100 percent of airborne irritants like mold and viruses by silently killing them. Once dead, the irritants are filtered and then destroyed in a 400-degree chamber inside the device. The device then recirculates sanitized, cooled air that will keep you healthy.",
 items:[['G','Choose THREE true statements.',['The Reason washing machine is good for the environment.','The Reason washing machine cannot measure laundry detergent.','The Glo Nightlight must be plugged into an electrical socket.','The Glo Nightlight balls can stay lit for 30 minutes.','The air purifier uses very cold air to kill irritants.','The air purifier can help keep you from getting sick.']]]}
]},
24:{quiz:6,units:'11–12',points:25,sections:[
{id:'A',title:'Listening · Life choices / Coffee shop',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1',"Before Patrick’s mom finished high school, she _____.",['bought a new car','almost didn’t graduate','worked full-time after school']],
['A2','If Patrick’s mom had been more serious, she would have _____.',['taken auto mechanics','taken higher-level classes','had more regrets']],
['A3','To establish a popular coffee shop, Tess and Austin say it’s important to _____.',['have affordable snacks','play good music','have soft, attractive lighting']],
['A4','Austin surprises Tess by saying he _____.',['always goes to the Roasted Bean','loves chai tea','doesn’t drink coffee']]]},
{id:'B',title:'Reading · Book Clubs',points:4,type:'multi',maxSelections:4,
 help:'Read the article and choose FOUR true statements.',
 reading:"Reading Is Fun! Book club members know that sharing and talking about books with others can be very rewarding. For people who feel that they are too busy to read, a book club helps them to keep up with a reading schedule. Others have gained self-confidence by participating in or leading a discussion. And most people enjoy the chance to make new friends. A successful book club should be small enough so quiet people can be heard, but also big enough for many different opinions. The best arrangement is a mixture of ages and backgrounds. Some book clubs meet in bookstores, public libraries, or cafés, or even online, but most have their meetings in members’ homes. This setting offers a quiet spaces and time for longer discussions. A book club could specialize in one subject or type of book, like mystery, science fiction, or biography. Or the members could read all types of books, as long as the book is recommended by someone who thinks it would be worth discussing. For the meeting to go smoothly, a leader should be appointed. The leader will usually start the discussion and keep it going when needed. Book club members should never be afraid to offer their opinion, even if they don’t like a book. Different opinions make the discussion livelier!",
 items:[['B','Choose FOUR true statements.',['A book club is only for people with a lot of time.','Some members gain confidence by leading discussions.','A book club should have many people with identical opinions.','Successful book clubs have members of different backgrounds and ages.','A club can read many different kinds of books.','Most clubs meet in members’ homes.','A leader is not necessary.','It is not OK to dislike the book being discussed.']]]},
{id:'C',title:'Time clauses',points:3,type:'radio',help:'Circle the correct word or phrase.',items:[
['C1','_____ I graduated from college, I used my degree to get a high-paying job.',['Once','Until','Before']],
['C2','_____ Takio got his first car, he found how many friends needed rides.',['Before','Until','The moment']],
['C3','As soon as Katrina landed her first job, she _____ to save 10% of each paycheck.',['had decided','decided','have decided']]]},
{id:'D',title:'Personality adjectives',points:4,type:'select',help:'Choose ambitious, naive, rebellious, carefree, pragmatic, sophisticated.',
 options:[['ambitious','ambitious'],['naive','naive'],['rebellious','rebellious'],['carefree','carefree'],['pragmatic','pragmatic'],['sophisticated','sophisticated']],
 items:[
['D1','Seth makes decisions based on practical results instead of theories. He is _____.'],
['D2','People without much experience of challenges may be _____.'],
['D3','My son never seems to worry. He is so _____.'],
['D4','Audrey is difficult to control at school. She is _____.']]},
{id:'E',title:'Regrets and past modals',points:4,type:'radio',help:'Circle the correct phrase.',items:[
['E1','To gain experience, André _____ for a non-paying internship.',['have applied','should have applied','couldn’t have applied']],
['E2','If I’d been sensible, I _____ how to control my money.',['have learned','could have learned','learned']],
['E3','He _____ so naive! I can’t believe he fell for the lies.',['shouldn’t have been','should be','shouldn’t have']],
['E4','If I _____ so immature, I would have appreciated my family.',['had been','has been','hadn’t been']]]},
{id:'F',title:'Purposes and small businesses',points:3,type:'radio',help:'Choose the correct phrase.',items:[
['F1','To build a large customer base, a beauty salon _____.',['having the latest hairstyles','wants good service','has to have a good reputation']],
['F2','Discount stores don’t advertise much _____ customers.',['to be attracted','in order to attract','by attracting']],
['F3','For a new pizzeria _____ on campus, it needs 24-hour delivery.',['to succeed','to successful','to be success']]]},
{id:'G',title:'Because / Due to / For / Since',points:3,type:'select',help:'Complete the sentences.',
 options:[['because','because'],['due to','due to'],['for','for'],['since','since']],
 items:[
['G1','I like Food Network _____ it has interesting cooking shows.'],
['G2','_____ the discount store opened, there is no parking on Main Street!'],
['G3','Starbucks is famous _____ its coffee, but I love the pastries.']]}
]},
28:{quiz:7,units:'13–14',points:25,sections:[
{id:'A',title:'Listening · Media and photography',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','Ellen and Walter probably won’t be at the party because _____.',['they weren’t invited','Ben sent a text to Walter','Ellen works with Ben']],
['A2','Martin thinks Jessica shouldn’t have _____.',['baked a birthday cake for their boss','gotten a better job','been polite to her boss']],
['A3','The final version of a movie _____.',['isn’t in order','has no sound effects','is put together by the editor and director']],
['A4','Cheryl says landscape photographers need to understand _____.',['journalism','how weather affects photos','that landscapes look better on sunny days']]]},
{id:'B',title:'Modals about the past',points:4,type:'radio',help:'Circle the correct phrase.',items:[
['B1','The delivery man is late. He _____ lost the directions.',['might have','should have','must not have']],
['B2','Gloria wore a new ring. They _____ decided to get married.',['shouldn’t have','may not have','must have']],
['B3','You _____ reminded me to charge the camera!',['would have','should have','wouldn’t have']],
['B4','The steak was undercooked. I _____ complained and sent it back.',['must have','should have','would have']]]},
{id:'C',title:'Criticism / Excuse / Prediction / Suggestion / Warning',points:5,type:'select',
 help:'Match the reactions with examples.',
 options:[
 ['a','You should keep track of your computer files.'],
 ['b','If you do it again, you’ll lose your job.'],
 ['c','You’re so irresponsible! You lose everything.'],
 ['d','It wasn’t your fault. Someone else deleted the file.'],
 ['e','You’ll probably find the file in the trash.']],
 items:[['C1','A criticism'],['C2','An excuse'],['C3','A prediction'],['C4','A suggestion'],['C5','A warning']]},
{id:'D',title:'Passive forms · Talk show',points:3,type:'compound',
 help:'Complete the paragraph with passive verb forms.',items:[
 ['D','To prepare for a TV talk show, research has to _____ (do). The selected guests must _____ (rank). The top choices _____ (contact). If unavailable, the next people _____ (invite).',
 [['Verb do',null],['Verb rank',null],['Verb contact',null],['Verb invite',null]]]]},
{id:'E',title:'Reading · Animated Movies',points:4,type:'radio',help:'Read the article and check the correct answers.',
 reading:"Animated movies aren’t just for kids anymore. Some of the most popular movies of 2016 were Zootopia, Finding Dory, and The Secret Lives of Pets. Disney’s Frozen (2013) became the highest-grossing animated movie ever made. Animated movies are now an important force in the movie industry. Making animated movies can take much longer than making a traditional movie. This is partly because approximately seven hours are needed to render one single frame of animated movie. In fact, for Frozen it took 30 hours to render one frame. With 24 frames per second of finished movie, the people at Disney had to work very hard to finish the movie in just two years. Most animated movies have big-name stars attached to them to voice the characters. Tom Hanks voiced the character of Woody in the Toy Story movies, while Angelina Jolie was cast as the voice of Tigress in the Kung Fu Panda movies. Using famous actors to voice animated characters is meant to tempt adults into going to animated movies with their children. Studio executives know that the bigger the name, the more likely adults will tag along with their kids. To further emphasize the impact animated movies have had on the movie industry, the Academy of Motion Picture Arts and Sciences began giving out Academy Awards for Best Animated Feature in 2001. The prestige of winning such an important award results in more ticket sales for movie theaters and more profits for animated moviemakers.",
 items:[
['E1','A good title would be _____.',['Animated Movies Are Just for Kids','Animated Movies Result in Ticket Sales and Awards','Big-Name Movie Stars Avoid Animated Movies']],
['E2','Render means _____.',['translate from raw to final form','remember a previously known fact','have an opinion']],
['E3','Cast means _____.',['speak clearly','choose actors for parts','throw something into the air']],
['E4','Animated movies have had _____ effect on the industry.',['a positive','a negative','no']]]},
{id:'F',title:'Join sentences with relative clauses',points:5,type:'text',help:'Use who or that and make any needed changes.',items:[
['F1','A gaffer carries out the lighting design. He or she works on a movie or TV crew.'],
['F2','Dialog editors are sound technicians. They specialize in editing film dialog.'],
['F3','A property master is responsible for buying props. They are handled by actors.'],
['F4','Critics write film reviews. They sometimes see more than ten movies a week.'],
['F5','Executive producers aren’t involved in shooting films. They are responsible for the budget.']]}
]},
30:{quiz:8,units:'15–16',points:25,sections:[
{id:'A',title:'Listening · Personal goals',points:4,type:'radio',help:'Listen and check the correct answers.',items:[
['A1','Ray doesn’t recycle glass because _____.',['glass is expensive to recycle','he doesn’t get any money','the center only accepts cans']],
['A2','Danielle bought a bike because she _____.',['wants to reduce traffic','had to pay a fine','rides side by side']],
['A3','Ryan hasn’t been able to _____.',['perform his music','hear people play his music','make a living with his music']],
['A4','Sabrina quit the police force because she _____.',['was tired of helping people','plans to move','is ready to start a new career']]]},
{id:'B',title:'Reading · Sidney Crosby',points:4,type:'multi',maxSelections:4,help:'Read the article and select FOUR true statements.',
 reading:"Sidney Crosby was born on August 7, 1987, and grew up near Cole Harbour, Nova Scotia, Canada. His father, Troy, was a very talented ice hockey player, but he never played at the professional level. As a boy, Sidney was a straight-A student and a role model. It’s no wonder that he’s now one of the most respected and successful players in the National Hockey League. Crosby was only the fifth player to represent Canada at the World Junior Hockey Championships as a sixteen-year-old in 2003. His team went on to win the championship in 2005. Crosby was then drafted by the professional ice hockey team the Pittsburgh Penguins later in 2005 when we was only 18 years old. His nickname, “The Next One,” is a reference to Wayne Gretzky, nicknamed, “The Great One,” who is considered to be the best hockey player of all time. Crosby, who has had amazing opportunities throughout his life to achieve his dreams, says, “I want to be able to give back to local organizations so that other young people have the opportunity to reach for their dreams as well.” He has put these words into practice by establishing the Sidney Crosby Foundation, which is not about ice hockey, but about providing financial support to children’s charities that help whole communities. In 2010, Crosby donated his Olympic gold medal winnings of $20,000 to his charity, further standing behind his commitment to children’s needs.",
 items:[['B','Choose FOUR true statements.',['Sidney Crosby’s father never played professional ice hockey.','Sidney Crosby was an average student.','Sidney Crosby is still a positive role model.','Sidney Crosby was drafted at age 18.','Wayne Gretzky’s nickname is The Next One.','The Sidney Crosby Foundation helps children who want only to play hockey.','Sidney Crosby played hockey at the 2010 Winter Olympic Games.']]]},
{id:'C',title:'Passive modals',points:4,type:'text',help:'Complete each sentence with the correct verb forms.',items:[
['C1','Parking tickets must _____ (issue) to drivers who park illegally.'],
['C2','People ought _____ (require) to take a driving course before getting a license.'],
['C3','Teenagers shouldn’t _____ (allow) to vote before they turn 18.'],
['C4','Motorcyclists mustn’t _____ (permit) to ride without a helmet.']]},
{id:'D',title:'Tag questions',points:3,type:'text',help:'Complete each sentence with a tag question.',items:[
['D1','Bullies don’t care about other children’s feelings, _____ ?'],
['D2','Noise pollution can be a big problem here, _____ ?'],
['D3','The government isn’t helping the homeless, _____ ?']]},
{id:'E',title:'Run / Save / Lose',points:3,type:'text',help:'Use the correct form of run, save or lose.',items:[
['E1','Two years from now, I hope she _____ enough money for a new car.'],
['E2','By the end of this year, I’d like _____ 15 pounds.'],
['E3','By the time I’m 30, I hope I _____ a marathon.']]},
{id:'F',title:'Present perfect vs past simple',points:3,type:'text',help:'Complete using the present perfect or past simple.',items:[
['F1','She _____ (be able) to help many people in her life and make a difference. We will miss her.'],
['F2','Last year I _____ (manage) to find true love, and I’m getting married next month!'],
['F3','They worked hard, but they _____ (not be able) to get into their chosen college this year.']]},
{id:'G',title:'Community concerns and personality',points:4,type:'radio',help:'Circle the correct word or phrase.',items:[
['G1','I hope the school budget passes so teachers don’t face _____.',['lack of affordable child care','overcrowded classrooms','homelessness']],
['G2','A study says _____ is responsible for over 45,000 deaths a year.',['stray animals','vandalism','inadequate health care']],
['G3','We want a _____ manager, skilled at solving problems.',['dependent','resourceful','rigid']],
['G4','Amanda used to be _____ and shy, but now she’s outgoing.',['courageous','cynical','timid']]]}
]}
};
window.F111_QZ24_I2_BANK=Object.freeze(banks);
})();