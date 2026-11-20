// F111 R66 · Banco editorial B2 · Interchange 5th Edition 1 · original quizzes U1–16.
// Contiene exclusivamente preguntas y alternativas de la prueba, nunca claves de corrección.
// Cada id coincide con F111_QZ_SECTIONS_B2. No se publica como examen estudiantil
// hasta pasar gate de backend + revisión editorial de fuente y materiales.
(function(){
'use strict';
const banks={
4:{quiz:1,units:'1–2',sections:[
{id:'A',title:'Listening · Lucy, Michael and Sylvie',points:4,type:'radio',
 help:'Listen to Lucy, Michael, and Sylvie. Check the correct answers.',
 items:[
['A1','Sylvie is _____.',["Michael’s friend.","Lucy’s friend.","Michael’s classmate."]],
['A2',"Sylvie’s last name is _____.",['Marso.','Marceau.','Marcoe.']],
['A3','Sylvie is from _____.',['Vancouver.','Montreal.','Toronto.']],
['A4','They are all _____.',['in the cafeteria.','in the same school.','in the same chemistry class.']]]},
{id:'B',title:'Present tense of be',points:4,type:'text',
 help:'Complete each conversation with the correct form of be.',items:[
['B1',"A: Where _____ you from, Riko?\nB: I’m from Tokyo. How about you?"],
['B2',"A: _____ Jacob in your class this semester?\nB: Yes. We’re in the same English class."],
['B3',"A: What _____ your math class like?\nB: It’s really interesting, and the teacher’s great!"],
['B4',"A: _____ Emma and Betty from Canada?\nB: No, they’re from England."]]},
{id:'C',title:'Possessives and object pronouns',points:4,type:'compound',
 help:'Circle the two correct words in each conversation; each question has two selections.',
 items:[
['C1',"A: Nice to meet you, Diego. What’s _____ last name again?\nB: _____ last name is Garcia. It’s nice to meet you, too.",[
  ['What’s (his / their / your) last name again?',['his','their','your']],
  ['(Her / My / Its) last name is Garcia.',['Her','My','Its']]]],
['C2',"A: This is my new friend, Elizabeth. Everyone calls _____ Beth.\nB: Hi, Beth. We’re the Johnsons. _____ first names are George and Julie.",[
  ['Everyone calls (me / them / her) Beth.',['me','them','her']],
  ['(Your / His / Our) first names are George and Julie.',['Your','His','Our']]]]]},
{id:'D',title:'Simple present',points:3,type:'text',
 help:'Complete the conversations in the simple present.',items:[
['D1',"A: Where _____ you work?\nB: I work in a garage. I’m a mechanic."],
['D2',"A: What _____ he do, exactly?\nB: He’s a reporter for The Boston Globe."],
['D3',"A: Where does she _____ to school?\nB: She goes to the University of Chicago."]]},
{id:'E',title:'Correct the job',points:3,type:'text',
 help:'Write the correct job for each description, replacing the incorrect one.',items:[
['E1','Carmen is a salesperson. She works for an airline. She serves drinks to passengers.'],
['E2',"I work for World Travel. I’m a receptionist. I take people on tours."],
['E3','Sam and Jerry are in the entertainment business. They play music. They are servers.']]},
{id:'F',title:'At / In / Late / On / Until',points:3,type:'select',
 help:'Choose from at, in, late, on or until. Two words are not used.',
 options:[['at','at'],['in','in'],['late','late'],['on','on'],['until','until']],
 items:[['F1','I sleep _____ 10:00 on weekdays.'],
        ['F2','John gets home _____ at night on weekends.'],
        ['F3','They have lunch _____ Saturdays around 1:00 P.M.']]},
{id:'G',title:'Reading · An email from David',points:4,type:'radio',
 reading:"Hi Ricardo!\nIn your email, you asked me, 'What do you do every day?'\nWell, I’m a student at the University of Denver. I really like my classes. I study tourism and Spanish. I go to school around 8:00 in the morning on weekdays. Around noon, I have lunch with some classmates. On Mondays and Fridays, I work out at the gym before my classes. And in the late afternoon, on Tuesdays and Thursdays, my friend Michael and I have part-time jobs. We work in the school cafeteria as servers. I also study in the library every weeknight until about midnight. I’m a full-time student, and I don’t have time to watch TV.\nWhat do you do? Send me another email, please!\nWrite soon,\nDavid",
 help:'Read David’s email and check the correct answer for each question.',items:[
['G1',"Ricardo is David’s _____.",['classmate.','new friend.','best friend.']],
['G2','David is a _____.',['part-time teacher.','full-time student.','part-time chef.']],
['G3','Michael _____.',['works in the library.','is Ricardo’s friend.','is David’s friend.']],
['G4','On Tuesdays and Thursdays, David _____.',['works out at the gym.','works with Michael.','doesn’t study at the library.']]]}
]},
8:{quiz:2,units:'3–4',sections:[
{id:'A',title:'Listening · Shopping for sweaters',points:4,type:'radio',help:'Listen to Ann and Ben in a clothing store. Choose the correct answers.',items:[
['A1','Ben prefers the _____.',['green sweaters','red sweaters','blue sweaters']],
['A2','The blue sweaters are _____.',['$25','$29','$41']],
['A3','The green sweaters are made of _____.',['wool','silk','cotton']],
['A4',"Ben’s size is _____.",['large','medium','small']]]},
{id:'B',title:'Materials and clothing',points:3,type:'radio',help:'Circle the correct word.',items:[
['B1','I really like those _____ socks.',['cotton','plastic','leather']],
['B2','Your _____ tie is beautiful.',['plastic','silk','rubber']],
['B3','This _____ necklace is perfect for me. But it’s $3,000!',['gold','cotton','wool']]]},
{id:'C',title:'This / That / These / Those',points:4,type:'select',options:[['this','this'],['that','that'],['these','these'],['those','those']],items:[
['C1','How much is _____ watch? I can’t find a price tag.'],
['C2','Look at _____ black jeans over there! Aren’t they stylish?'],
['C3','I like _____ gold earrings. They look great on me!'],
['C4','Excuse me. I like _____ scarf. Can I see it, please?']]},
{id:'D',title:'Comparative adjectives',points:4,type:'text',help:'Complete with the comparative of each adjective and than where needed.',items:[
['D1','Are these boots _____ the ones over there? (large)'],
['D2','Silk is _____ cotton. (expensive)'],
['D3','Which dress is _____, the red one or the green one? (pretty)'],
['D4','Leather jackets are usually _____ wool ones. (good)']]},
{id:'E',title:'Object pronouns',points:3,type:'radio',help:'Circle the correct word.',items:[
['E1','Tom Hanks is my favorite actor. I like _____ a lot.',['him','it','you']],
['E2','Music videos are boring. Do you like _____?',['her','them','us']],
['E3','My favorite TV show is Doctor Who. What do you think of _____?',['her','it','me']]]},
{id:'F',title:'Do / Does / What / Would',points:4,type:'select',options:[['do','do'],['does','does'],['what','what'],['would','would']],items:[
['F1',"A: _____ you like to see a movie tonight?\nB: Sure. What time does it start?"],
['F2','A: _____ you like horror movies?\nB: No, not really.'],
['F3','A: What kinds of music _____ Ricardo like?\nB: Rock and classical, I think.'],
['F4','A: _____ does Dana play?\nB: She plays the piano.']]},
{id:'G',title:'Reading · Audrey Tautou',points:3,type:'radio',help:'Read the article and check the correct answers.',
 reading:"Audrey Tautou is a French actress. She has fans around the world. Here are some interesting things about Audrey’s life and career.\n1978: Audrey is born in Beaumont, France.\n1980s and 1990s: Audrey acts in plays (especially comedies) in high school. After that she goes to acting school. She wins two different acting awards – one in 1998 and one in 1999.\n2000–2002: Audrey acts in many movies, including Voyous Voyelle (2000). Then she plays a young woman called Amélie in a movie of the same name. Amélie (2001) is in French, but the movie is a big international hit. Audrey becomes popular in many countries, including the United States.\n2003–present: Audrey acts in many movies, including The Spanish Apartment and He Loves Me, He Loves Me Not. She also acts in Dirty Pretty Things. This is the first time she speaks English in a movie. After this movie, she speaks English in other movies, such as Coco Before Chanel (2009). In this movie, she plays Coco Chanel, a famous French clothing designer.",
 items:[
['G1','In high school, Audrey Tautou acts _____.',['in plays.','on television.','in movies.']],
['G2','Many Americans like the movie _____.',['Voyous Voyelle.','Amélie.','The Spanish Apartment.']],
['G3','In Coco Before Chanel, Audrey speaks _____.',['English.','French.','Spanish.']]]}
]},
13:{quiz:3,units:'5–6',sections:[
{id:'A',title:'Listening · Family and exercise',points:4,type:'radio',help:'Listen to the conversations and check the correct answers.',items:[
['A1','Catherine has _____ brothers and sisters.',['four','seven','ten']],
['A2','Right now, Mark is living _____.',['with his parents.','with a friend.','with his wife.']],
['A3','Sharon usually goes to the gym _____.',['on Thursdays.','twice a week.','three times a week.']],
['A4',"The man’s younger brother and sister _____.",['are in school.','have children.','are working abroad.']]]},
{id:'B',title:'Present continuous',points:4,type:'compound',help:'Complete each conversation with the present continuous.',items:[
['B1',"A: How is your sister? _____ (study) these days?\nB: No, she isn’t. She _____ (work) as a salesperson at a department store.",[
 ['Question using study',null],['Answer using work',null]]],
['B2',"A: Is that Martin over there? Who _____ (wait) for?\nB: His parents. They _____ (meet) him for dinner.",[
 ['Question using wait',null],['Answer using meet',null]]]]},
{id:'C',title:'Rewrite with most / some / few / no one',points:3,type:'text',help:'Rewrite each statement using most, some, few, or no one.',items:[
['C1','About 80 percent of American mothers work.'],
['C2','A very small percent of Japanese families have more than three children.'],
['C3','In Britain, about 25 percent of young adult men live at home with their parents.']]},
{id:'D',title:'Exercise verbs',points:3,type:'radio',help:'Circle the correct word.',items:[
['D1','Jared does _____ every morning before breakfast.',['yoga','football','jogging']],
['D2','How often do you _____ swimming in the summer?',['go','do','play']],
['D3','I sometimes play _____ with my friends.',['karate','aerobics','baseball']]]},
{id:'E',title:'Word order · Frequency',points:3,type:'text',help:'Put the words in the correct order.',items:[
['E1','(dinner / often / TV / I / watch / after)'],
['E2','(in / you / coffee / the / do / drink / ever / evening)'],
['E3','(very / doesn’t / Jeff / much / exercise)']]},
{id:'F',title:'Good / Long / Often / Well',points:4,type:'select',options:[['good','good'],['long','long'],['often','often'],['well','well']],help:'Use good, long, often or well.',items:[
['F1','A: How _____ do you work out?\nB: Every day. I’m a real fitness freak.'],
['F2','A: How _____ do you play tennis?\nB: About average. But I’m getting better and better!'],
['F3','A: How _____ do you spend at the gym?\nB: Just thirty minutes a day. Who has more time than that?'],
['F4','A: How _____ are you at soccer?\nB: OK, I guess. It’s not really my favorite sport.']]},
{id:'G',title:'Reading · Hilda’s letter',points:4,type:'multi',maxSelections:4,help:'Read Hilda’s letter. Select FOUR true statements.',
 reading:"Dear Paul,\nAustin is a great city. I really like it here! There’s always a lot to do. Every day after class, I walk down Guadalupe Street. I always like to go to my favorite coffee shop in the afternoon and meet my friends there for coffee. In the evening, there is always something interesting to do in town or near the university. For example, I sometimes see a foreign movie, and I often listen to live music.\nOn Saturday, my friends and I sometimes take the bus to San Antonio for the day. I love the shops and restaurants there. It’s a great city for walking. We almost always walk along the River Walk and have lunch at a restaurant by the river. After lunch, we always go shopping.\nOn Sunday, I sometimes like to play tennis with friends, or we watch sports on TV, like a football game or a basketball game. I think football is very exciting!\nWell, that’s all for now. Hope to hear from you soon.\nTake care,\nHilda",
 items:[['G','Choose FOUR true statements.',['She walks down Guadalupe Street every day after class.','She meets her friends for coffee in the evening.','She never listens to live music.','She enjoys going to San Antonio on weekends.','She doesn’t like walking.','She usually has lunch by the river in San Antonio.','She plays tennis with friends every Sunday.','She likes to watch football and basketball on TV.']]]}
]},
16:{quiz:4,units:'7–8',sections:[
{id:'A',title:'Listening · Vicky and Paolo’s vacations',points:4,type:'compound',
 help:'Listen and choose one country and one weather description for each speaker.',items:[
['A','Complete the two vacation rows.',[
['Vicky · Country visited',['Costa Rica','China','India']],
['Vicky · Weather',['windy','sunny','warm','cool']],
['Paolo · Country visited',['Australia','Chile','Canada']],
['Paolo · Weather',['windy','sunny','warm','cool']]]]]},
{id:'B',title:'Simple past in a conversation',points:8,type:'compound',
 help:'Complete the dialogue using the correct past form of the verbs.',items:[
['B','Complete all eight blanks in the conversation.',
 [['A: _____ you _____ (stay) home last night? · Write both words',null],
 ['A: What _____ you _____ (do)? · Write both words',null],
 ['B: I _____ (go) dancing at the new club on Eighth Street.',null],
 ['Suzie and Mike _____ (be) there, too.',null],
 ['Yes, we _____ (have) a great time!',null],
 ['But where _____ (be) you?',null],
 ['I _____ (be) in the laundromat all evening.',null],
 ['We _____ (spend) the evening laughing and talking.',null]]]]},
{id:'C',title:'Find the correct place',points:4,type:'text',
 help:'Correct the wrong place in each statement.',items:[
['C1','All my clothes were dirty. I wanted to wash them, so I went to the library.'],
['C2','I went to the post office. I was very hungry. I needed to buy food.'],
['C3','I went to the drugstore. I want to go to a party. I need a new T-shirt and jeans.'],
['C4','I don’t have a computer. I wanted to read the news, so I went to the grocery store.']]},
{id:'D',title:'One / Any / Few / Many / Much',points:5,type:'compound',
 help:'Circle the correct word or phrase in each blank.',items:[
['D1',"A: Is there a bank near here?\nB: Yes, there is. There’s _____ around the corner.",[['Select one',['any','one','some']]]],
['D2','A: Are there _____ drugstores in this neighborhood?\nB: Well, there are _____.',[['Blank 1',['few','many','much']],['Blank 2',['a few','a little','not much']]]],
['D3','A: Is there _____ public transportation near here?\nB: No, there isn’t _____ public transportation in this town.',
 [['Blank 1',['many','much','one']],['Blank 2',['any','one','none']]]]]},
{id:'E',title:'Reading · Gina’s neighborhood',points:4,type:'multi',maxSelections:4,
 help:'Read Gina’s email and select FOUR things you can do in her neighborhood.',
 reading:"Hi Brittany!\nGuess what! I moved into my apartment yesterday. I really like my new roommates. I also like the neighborhood. There are a lot of different restaurants here. Last night, I ate at a Mexican restaurant just around the corner. The food was delicious. I want to try a new Japanese restaurant near here soon. For breakfast this morning, I came to this great coffee shop across from my apartment. Actually, it has Wi-Fi, so I’m emailing you from here now.\nIt’s a really convenient neighborhood. There’s a grocery store on our street, and there are some interesting stores, too. One store sells the newest computers and cell phones. I might get a computer there, and then I can email you from home! My roommates told me there’s a great park just two blocks away. I want to start jogging every weekend.\nCome and visit soon!\nGina",
 items:[['E','Choose FOUR things you can do.',['borrow books','buy electronics','eat different kinds of food','make travel arrangements','go jogging','see movies','get a haircut','send emails','go dancing','wash and dry clothes']]]}
]},
21:{quiz:5,units:'9–10',sections:[
{id:'A',title:'Listening · People descriptions',points:4,type:'radio',
 help:'Listen to the conversations and check the correct information.',items:[
['A1','Choose the correct description of Emily.',['Emily is short and in her thirties.','Emily is medium height and in her twenties.','Emily is fairly short and about twenty-five.']],
['A2','Choose the correct description of Steve.',['Steve has blue eyes and black hair.','Steve is really tall and has curly blond hair.','Steve is 29 years old and handsome.']],
['A3','Choose the correct description of the thief.',['The thief was short and elderly and had a white beard.','The thief had on new pants and a black T-shirt.','The thief had a brown beard and was pretty tall.']],
['A4','Choose the correct description of Joe and Penny.',['Joe and Penny are sitting on the couch and talking to Tom.','Joe and Penny are both wearing jeans and red sweaters.','Joe and Penny are the good-looking couple sitting on the couch.']]]},
{id:'B',title:'Appearance and age',points:3,type:'radio',help:'Circle the correct word.',items:[
['B1','My brother is _____ his twenties and goes to college in California.',['in','about','at']],
['B2','Jackie _____ long curly red hair and green eyes.',['does','has','is']],
['B3','Jun’s uncle _____ 6 feet tall and has a light brown beard and a mustache.',['is','has','are']]]},
{id:'C',title:'Word order',points:4,type:'text',help:'Put the words in the correct order.',items:[
['C1','(is / beautiful / thirties / Kristi / her / really / and in)'],
['C2','(wear / mustache / and have / Sam / a / does / glasses)'],
['C3','(red / Cindy / height / long / has / and is / medium / hair)'],
['C4','(on / person / the / couch / who’s / sitting / the)']]},
{id:'D',title:'Experiences · Present perfect',points:3,type:'radio',help:'Circle the correct word.',items:[
['D1','Has Martin ever _____ octopus?',['eaten','ridden','lost']],
['D2','How many times have you lost your _____?',['classes','sports','cell phone']],
['D3','Have you ever _____ a truck?',['ridden','driven','worn']]]},
{id:'E',title:'Present perfect conversations',points:4,type:'compound',
 help:'Complete each conversation using the present perfect.',items:[
['E1',"A: _____ you _____ to any good movies lately? (be)\nB: Yes, I _____ already _____ three great movies this month. (see)",
 [['A · Pregunta completa en presente perfecto',null],['B · Respuesta completa en presente perfecto',null]]],
['E2',"A: _____ he ever _____ Thai food before? (eat)\nB: No, he _____ never _____ it in his life. (have)",
 [['A · Pregunta completa en presente perfecto',null],['B · Respuesta completa en presente perfecto',null]]]]},
{id:'F',title:'For or Since',points:3,type:'radio',help:'Select the correct word.',items:[
['F1','I lived in Boston _____ five years. I loved every minute I was there!',['for','since']],
['F2','My wife and I have gone to Costa Rica every year _____ 2001.',['for','since']],
['F3','Patrick has studied Portuguese _____ a long time. He speaks it well now.',['for','since']]]},
{id:'G',title:'Reading · Travel Adventure',points:4,type:'select',
 help:'Read each story and choose the most suitable title. Do not repeat titles.',
 options:[['Amazing Summer School','Amazing Summer School'],['Globe-Trotting Twosome','Globe-Trotting Twosome'],['Never Too Old','Never Too Old'],['The Risk Taker','The Risk Taker']],
 items:[
['G1','Keith enjoys dangerous sports, has long wanted to go ice climbing and now takes climbing lessons.'],
['G2','Sisters Maria and Eva have traveled widely, seen pyramids and eaten unusual foods; they recently wrote a travel guide.'],
['G3','Take an educational boat trip in China from Beijing to Shanghai in July, with lectures and tour guides.'],
['G4','Larry and Pauline have traveled in their truck across 48 states; Pauline is 80 and Larry is 82.']]}
]},
24:{quiz:6,units:'11–12',sections:[
{id:'A',title:'Listening · Travel advice',points:4,type:'radio',help:'Listen and check the correct information.',items:[
['A1','Choose the correct statement about Chuncheon.',['The woman visited Chuncheon for the first time.','The beaches in Chuncheon are never crowded.','The woman thinks Chuncheon is relaxing.']],
['A2','Choose the correct statement about Mexico City.',['The man had a great vacation in Mexico City last July.','The man hasn’t been to Mexico City yet.','The man can’t wait to go to Mexico City in August.']],
['A3','Choose the correct statement about San Francisco.',['The man has been to San Francisco.','The woman thinks the man should visit Lombard Street.','Winter is a good time to visit San Francisco.']],
['A4','Choose the correct statement about McNabs Island.',['Many people live on McNabs Island.','The man took a boat from Halifax to McNabs Island.','The man stayed in a hotel on McNabs Island.']]]},
{id:'B',title:'Word order · Cities',points:3,type:'text',help:'Put the words in the correct order to make sentences.',items:[
['B1','(really / Montreal / is / beautiful / city / a)'],
['B2','(an / Ecuador / country / interesting / is / extremely)'],
['B3','(me / too / for / is / Los Angeles / expensive)']]},
{id:'C',title:'City adjectives',points:4,type:'radio',help:'Circle the correct word.',items:[
['C1','New York City is very exciting, but it’s _____.',['boring','interesting','stressful']],
['C2','Lisbon is an interesting city, and it’s _____, too.',['beautiful','noisy','polluted']],
['C3','My cousin lives in a safe city. It’s _____, though.',['clean','crowded','dangerous']],
['C4','My hometown is pretty boring. It’s very _____, however.',['interesting','relaxing','ugly']]]},
{id:'D',title:'Should / Shouldn’t / Can’t',points:3,type:'select',options:[['should','should'],['shouldn’t','shouldn’t'],['can’t','can’t']],items:[
['D1','This city can be dangerous at night. You _____ stay out too late.'],
['D2','You _____ travel by subway late at night. There are no trains after midnight.'],
['D3','In Hong Kong, the weather is nice in the fall. You _____ go there then.']]},
{id:'E',title:'Giving health advice',points:3,type:'text',
 help:'Respond using take some pain medicine, use a heating pad, see a dentist or use this lotion.',items:[
['E1','A: What do you suggest for a sunburn?\nB: It’s a good idea _____.'],
['E2','A: What should I do for sore muscles?\nB: It’s sometimes helpful _____.'],
['E3','A: What should I do for a toothache?\nB: It’s important _____.']]},
{id:'F',title:'Medications · Containers',points:4,type:'select',
 options:[['bag','bag'],['bottle','bottle'],['can','can'],['tube','tube']],help:'Complete the conversations with bag, bottle, can or tube.',items:[
['F1','What do you have for a cold? Get this _____ of vitamin C, and take two every day.'],
['F2','I need to shave my beard. I suggest a _____ of shaving cream.'],
['F3','My teeth hurt. Try this _____ of special toothpaste.'],
['F4','Could I get something for a bad cough? Here’s a _____ of cough drops.']]},
{id:'G',title:'Reading · Wendy’s Blog',points:4,type:'distinct',
 help:'Read the blog and choose FOUR different suggestions people actually gave Wendy.',
 reading:"WENDY'S WORLD · TOO MUCH ADVICE!\nIsn’t it amazing? You have a health problem, and everyone gives you different advice. For several months, I felt tired all the time. Some people suggested I sleep longer, but others said I was sleeping too much. One friend told me I was working too hard, and she said it’s important to relax. Another friend suggested that it’s helpful to get a lot of fresh air. His advice was that I should go for a long walk every day after work. One co-worker told me, 'You’re not tired, just lazy!'\nEven different doctors gave me different advice for the same problem! I visited one doctor, and she gave me some vitamin C. It didn’t work. So I went to another doctor, and he suggested I take a vacation. That didn’t work either. A third doctor told me to pick up some medicine from the drugstore. I felt even more tired! Finally, I went to the doctor of traditional Chinese medicine. He gave me some medicinal plants. He advised me to heat them in water and then drink the herbal mixture. It worked! Now I’m never tired, but I can’t sleep at night!",
 options:[['1','Ask someone for advice.'],['2','See a doctor.'],['3','Go on a vacation.'],['4','Take some pain medicine.'],['5','Never sleep at night.'],['6','Try some medicinal plants.'],['7','Sleep less.'],['8','Walk before work.'],['9','Sleep more.'],['10','Work longer hours.']],
 items:[['G1','Suggestion 1'],['G2','Suggestion 2'],['G3','Suggestion 3'],['G4','Suggestion 4']]}
]},
28:{quiz:7,units:'13–14',sections:[
{id:'A',title:'Listening · Restaurant order',points:4,type:'text',help:'Listen to the server and complete each part of Restaurant Check Order 106.',items:[
['A1','Restaurant Check Order 106 · Item 1: a _____ with _____. Write the complete order item.'],
['A2','Restaurant Check Order 106 · Item 2: a small _____ with blue cheese.'],
['A3','Restaurant Check Order 106 · Item 3: a large _____.'],
['A4','Restaurant Check Order 106 · Item 4: chocolate _____.']]},
{id:'B',title:'Agreeing / Disagreeing',points:4,type:'radio',help:'Check the correct response.',items:[
['B1',"I’m crazy about really spicy food.",['I am, too.','Oh, I can’t.','Neither do I.']],
['B2',"I can’t stand greasy fast food.",['Really? I can’t.','Neither am I.','Oh, I love it!']],
['B3','I like Indian food a lot.',['So can I.','So do I.','So am I.']],
['B4',"I’m not in the mood for pizza.",['Neither am I.','I don’t either.','Really? I can’t.']]]},
{id:'C',title:'Which word doesn’t fit?',points:3,type:'radio',help:'Choose the word or phrase that does not fit.',items:[
['C1','iced coffee / tea / vinaigrette / fresh juice',['iced coffee','tea','vinaigrette','fresh juice']],
['C2','spicy octopus / chicken salad / tuna sushi / shrimp curry',['spicy octopus','chicken salad','tuna sushi','shrimp curry']],
['C3','beef sandwich / mixed green salad / pea soup / vegetable curry',['beef sandwich','mixed green salad','pea soup','vegetable curry']]]},
{id:'D',title:'Would / Will / I’d / I’ll',points:4,type:'compound',help:'Complete the conversation with the four words.',items:[
['D',"A: What _____ you like to eat?\nB: The spicy chicken, please.\nA: What kind of potatoes would you like?\nB: _____ have the french fries.\nA: Anything to drink?\nB: Yes, please. _____ like some water.\nA: Anything else?\nB: No. That _____ be all.",
 [['Blank 1',['would','will','I’d','I’ll']],
  ['Blank 2',['would','will','I’d','I’ll']],
  ['Blank 3',['would','will','I’d','I’ll']],
  ['Blank 4',['would','will','I’d','I’ll']]]]]},
{id:'E',title:'Geography words',points:3,type:'radio',help:'Circle the correct word.',items:[
['E1','There are lots of beautiful trees in this _____.',['ocean','forest','waterfall']],
['E2','A _____ is a very dry place.',['desert','river','lake']],
['E3','A _____ is usually taller than a hill.',['lake','mountain','river']]]},
{id:'F',title:'Superlatives and Comparatives',points:3,type:'text',
 help:'Complete with the correct form of the adjective.',items:[
['F1','Which city is _____, Buenos Aires or Lima? (crowded)'],
['F2','Is Disneyland _____ amusement park in the world? (famous)'],
['F3','What is _____ river in the world: the Amazon, the Danube, or the Nile? (long)']]},
{id:'G',title:'Reading · Hawaii, the Big Island',points:4,type:'radio',
 help:'Read the article and check the correct answer.',
 reading:"VISIT HAWAII · THE BIG ISLAND\nEveryone knows that Hawaii is a beautiful group of islands in the middle of the Pacific Ocean. But did you know that Hawaii is both the name of the state and the name of the biggest island in the state? Most people call it the Big Island.\nThe geography and weather on the Big Island are very interesting. There are towns by the ocean with beaches, and there are volcanoes, waterfalls and forests on the island. The weather is different in different parts of the island.\nOn the west side, the weather in sunny Kailua Kona is almost perfect. It gets up to about 27°C in the winter and 30°C in the summer. It only goes down to 19°C in the winter and 23°C in the summer. The Kohala area in the north is the driest part of the island with about 56 centimeters of rain per year. On the east side, Hilo gets around 320 centimeters of rain per year: one of the wettest cities in the United States. All that rain makes for some amazing waterfalls near Hilo.\nWater temperatures are the coldest in February and warmest in September and October. There is good snorkeling, great scuba diving, and wonderful fishing year-round. That makes the Big Island popular any time of year.",
 items:[
['G1','What is Hawaii?',['a city','a city and a state','an island and a country','a state and an island']],
['G2','How hot does it get in Kailua Kona in the winter?',['30°C (86°F)','27°C (80°F)','23°C (73°F)','19°C (66°F)']],
['G3','Where does it rain the most?',['in the north','in the south','in the east','in the west']],
['G4','When are water temperatures the coldest?',['in September','in October','in January','in February']]]}
]},
30:{quiz:8,units:'15–16',sections:[
{id:'A',title:'Listening · Telephone invitations',points:4,type:'compound',
 help:'Listen to two telephone conversations. For each person, select the invitation and the excuse.',
 items:[['A','Wes and Rita · Invitation / Excuse',
 [['Wes · Invitation',['beach party','birthday party','dinner in a restaurant','go swimming']],
 ['Wes · Excuse',['Amy and Terry are going to be there.','He doesn’t want to get a sunburn.','He starts work at 6:00 P.M.','He’s going to a restaurant with Terry and Amy.']],
 ['Rita · Invitation',['baseball game','basketball game','dance performance','play']],
 ['Rita · Excuse',['She doesn’t like sports.','She isn’t feeling well.','She needs to study for a test.','She’s going to the Odeon Theater with Lucinda.']]]]]},
{id:'B',title:'Verb + Infinitive',points:6,type:'compound',help:'Complete the conversations with the correct verb forms and infinitives.',items:[
['B1',"A: What _____ you _____ (plan, do) tonight?\nB: I _____ (want, stay) home. There’s a soccer match on TV.",
 [['A · Question using plan, do',null],['B · Answer using want, stay',null]]],
['B2',"A: What _____ you and Dave _____ (go, do) tomorrow?\nB: We _____ (like, have) a barbecue on the beach, but it may rain.",
 [['A · Question using go, do',null],['B · Answer using like, have',null]]],
['B3',"A: What _____ you _____ (hope, do) after graduation?\nB: I _____ (love, travel) in Europe for a while.",
 [['A · Question using hope, do',null],['B · Answer using love, travel',null]]]]},
{id:'C',title:'Messages · Infinitives',points:4,type:'text',
 help:'Look at each message and complete the request with the name.',items:[
['C1','Message: The test on Thursday is at 1:00 P.M. · Please tell _____ (Ken).'],
['C2','Message: Meet me after class today. · Would you ask _____ (Alex)?'],
['C3','Message: There’s a volleyball game tonight. · Could you tell _____ (Marcus)?'],
['C4','Message: Come to the picnic on Saturday. · Please ask _____ (Paula)?']]},
{id:'D',title:'Tell / Ask / To tell / To bring',points:3,type:'radio',help:'Circle the correct word or phrase.',items:[
['D1',"Please _____ Mary there’s a school party on Saturday.",['tell','to tell']],
['D2','Would you ask Bill _____ the concert tickets tonight?',['bring','to bring']],
['D3','Could you _____ Dana that the movie starts at 8:15?',['tell','ask']]]},
{id:'E',title:'Write sentences using infinitives',points:4,type:'text',
 help:'Choose the suitable expression: want/get a new one, would like/go shopping later, hope/move out soon, plan/cut it short, would love/have the same teacher.',items:[
['E1',"I’ve moved to a new place, but I don’t like it."],
['E2',"I don’t like my hairstyle."],
['E3',"I really need some new clothes."],
['E4',"Another English class starts soon."]]},
{id:'F',title:'Reading · Rianna’s email',points:4,type:'compound',
 help:'Read Rianna’s email. Write TWO recent changes and TWO future plans.',
 reading:"Hi Jenny!\nHow have you been? What have you done in the past year? I’m sorry I haven’t written in a long time. It’s been a crazy year.\nI’ve been pretty busy. As you know, I’m not in school anymore. My first job was OK at first. Then I got bored with it. I knew I needed a change. I found a new job at a travel agency. I love it, but it’s a lot more stressful than my old job. I just got a raise, though. I’m happy about that because I moved to a new apartment a few months ago, and it’s more expensive than my old apartment!\nI have some other big news. Ben and I got engaged! He’s still in school, and he hopes to graduate in the summer. We plan to get married next year, after he finishes school and gets a job. We hope to travel around Mexico for our honeymoon. I can arrange it at the travel agency, so it will be a great trip! We’re very excited!\nI’m looking forward to hearing all your news.\nRianna",
 items:[['F','Two changes and two future plans',
 [['Recent change 1',null],['Recent change 2',null],
 ['Future plan 1',null],['Future plan 2',null]]]]}
]}
};
window.F111_QZ24_B2_BANK=Object.freeze(banks);
})();